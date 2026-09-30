import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const SCHEMA_FILE = path.join(process.cwd(), "schema.sql");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface Author {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
}

interface Chapter {
  id: string;
  projectId: string;
  title: string;
  subtitle?: string;
  content: string;
  order: number;
  status: "draft" | "review" | "final";
  lastEditedBy: string;
  updatedAt: string;
}

interface Idea {
  id: string;
  projectId: string;
  title: string;
  content: string;
  category: "Plot" | "Karakter" | "Riset" | "Dialog" | "Lainnya";
  authorId: string;
  pinned: boolean;
  createdAt: string;
}

interface RevisionLog {
  id: string;
  projectId: string;
  chapterId?: string;
  chapterTitle?: string;
  authorName: string;
  action: string;
  timestamp: string;
}

interface Annotation {
  id: string;
  projectId: string;
  chapterId: string;
  chapterTitle: string;
  text: string;
  authorName: string;
  createdAt: string;
  resolved: boolean;
}

interface GlossaryTerm {
  id: string;
  projectId: string;
  term: string;
  category: "Karakter" | "Lokasi" | "Istilah Dunia" | "Aturan Magic/Sains" | "Lainnya";
  definition: string;
  aliases?: string;
  updatedAt: string;
}

interface Project {
  id: string;
  title: string;
  subtitle: string;
  genre: string;
  synopsis: string;
  createdAt: string;
}

interface DB {
  projects: Project[];
  chapters: Chapter[];
  ideas: Idea[];
  logs: RevisionLog[];
  authors: Author[];
  annotations: Annotation[];
  glossary?: GlossaryTerm[];
}

const initialDb: DB = {
  authors: [
    { id: "auth_1", name: "Rian Hidayat", role: "Penulis Utama", avatar: "👨‍💻", color: "bg-emerald-500" },
    { id: "auth_2", name: "Kirana Maharani", role: "Penulis Studio", avatar: "👩‍🎨", color: "bg-indigo-500" }
  ],
  projects: [
    {
      id: "proj_1",
      title: "Gema Di Ujung Senja",
      subtitle: "Novel Fiksi Psikologis & Perjalanan Dua Jiwa",
      genre: "Fiksi / Drama",
      synopsis: "Kisah tentang dua sahabat masa kecil yang terpisah selama satu dekade dan dipertemukan kembali dalam proyek restorasi arsip tua di Yogyakarta.",
      createdAt: new Date().toISOString()
    }
  ],
  chapters: [
    {
      id: "chap_1",
      projectId: "proj_1",
      title: "Bab 1: Stasiun Tugu Pukul Empat Sore",
      subtitle: "Pertemuan setelah sepuluh tahun berlalu",
      content: "Kereta rel listrik berdecit pelan saat memasuki peron jalur tiga Stasiun Tugu. Aroma uap panas bercampur bau khas stasiun tua menyambut kedatangan sore itu. Langit Yogyakarta tampak jingga kemerahan, menepis mendung yang menggantung sejak siang.\n\nArya berdiri di dekat pilar besi bercat hijau pudar. Tangannya menggenggam tiket kertas yang sudah agak kusut. Di seberangnya, seorang perempuan berjas hujan abu-abu melangkah turun dari gerbong ekonomi, membawa ransel kanvas lusuh yang sama persis seperti sepuluh tahun lalu.\n\n'Kamu terlambat lima menit, Kiran,' sapa Arya dengan senyum tipis.\n\nKirana mendengus pelan, lalu tertawa kecil. 'Kemacetan Ring Road tidak bisa diajak kompromi, Ary. Tapi setidaknya kita tepat waktu untuk memulai semua ini.'",
      order: 1,
      status: "final",
      lastEditedBy: "Rian Hidayat",
      updatedAt: new Date().toISOString()
    },
    {
      id: "chap_2",
      projectId: "proj_1",
      title: "Bab 2: Arsip yang Terlupakan",
      subtitle: "Menemukan kotak kayu berdebu di loteng",
      content: "Rumah kakek di kawasan Kotabaru menyimpan lorong waktu tersendiri. Debu lembut menari di bawah sorotan cahaya matahari yang menembus genting kaca.\n\n'Di sinilah kakek menyimpan catatan harian tahun 1965,' ujar Kirana sambil menyeka permukaan kotak kayu jati berukir melati.\n\nArya mendekat, membawa lampu senter kecil. Bau kertas tua semacam vanili kering dan tinta cina langsung menusuk indra penciuman mereka. Lembar demi lembar catatan itu menyimpan teka-teki keluarga yang selama ini terkubur rapat.",
      order: 2,
      status: "review",
      lastEditedBy: "Kirana Maharani",
      updatedAt: new Date().toISOString()
    }
  ],
  ideas: [
    {
      id: "idea_1",
      projectId: "proj_1",
      title: "Simbol Kunci Inggris Tua",
      content: "Kunci inggris peninggalan ayah Arya jadi metafora rekonsiliasi. Setiap bab bisa disisipkan kutipan tentang memperbaiki mesin yang macet.",
      category: "Plot",
      authorId: "auth_1",
      pinned: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "idea_2",
      projectId: "proj_1",
      title: "Latar Suasana Malam Malioboro",
      content: "Tambahkan deskripsi aroma wedang ronde dan suara angklung jalanan saat mereka berdua menyusuri trotoar malam.",
      category: "Karakter",
      authorId: "auth_2",
      pinned: false,
      createdAt: new Date().toISOString()
    }
  ],
  logs: [
    {
      id: "log_1",
      projectId: "proj_1",
      chapterId: "chap_1",
      chapterTitle: "Bab 1: Stasiun Tugu Pukul Empat Sore",
      authorName: "Rian Hidayat",
      action: "Membuat bab baru dan menulis draf awal",
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: "log_2",
      projectId: "proj_1",
      chapterId: "chap_2",
      chapterTitle: "Bab 2: Arsip yang Terlupakan",
      authorName: "Kirana Maharani",
      action: "Merevisi bagian deskripsi aroma kertas tua",
      timestamp: new Date(Date.now() - 1800000).toISOString()
    }
  ],
  annotations: [
    {
      id: "ann_1",
      projectId: "proj_1",
      chapterId: "chap_1",
      chapterTitle: "Bab 1: Stasiun Tugu Pukul Empat Sore",
      text: "Perkuat kesan emosional saat Arya melihat Kirana turun dari kereta.",
      authorName: "Kirana Maharani",
      createdAt: new Date().toISOString(),
      resolved: false
    }
  ],
  glossary: [
    {
      id: "glos_1",
      projectId: "proj_1",
      term: "Arya Perkasa",
      category: "Karakter",
      definition: "Tokoh utama pria, 28 tahun, konservator arsip sejarah lulusan UGM.",
      aliases: "Ary, Arya",
      updatedAt: new Date().toISOString()
    },
    {
      id: "glos_2",
      projectId: "proj_1",
      term: "Kirana Maharani",
      category: "Karakter",
      definition: "Tokoh utama wanita, jurnalis lepas berjiwa petualang.",
      aliases: "Kiran, Kirana",
      updatedAt: new Date().toISOString()
    },
    {
      id: "glos_3",
      projectId: "proj_1",
      term: "Rumah Kotabaru",
      category: "Lokasi",
      definition: "Rumah berarsitektur kolonial Belanda peninggalan kakek Arya.",
      aliases: "Rumah Kakek",
      updatedAt: new Date().toISOString()
    }
  ]
};

function readDb(): DB {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (!parsed.glossary) parsed.glossary = initialDb.glossary;
      return parsed;
    }
  } catch (e) {
    console.error("Error reading DB file:", e);
  }
  writeDb(initialDb);
  return initialDb;
}

function writeDb(data: DB) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function linkifyGlossary(text: string, glossary: GlossaryTerm[]): string {
  if (!glossary || glossary.length === 0 || !text) return text;

  const termMap = new Map<string, GlossaryTerm>();
  const searchPhrases: string[] = [];

  for (const item of glossary) {
    if (item.term && item.term.trim()) {
      const mainTerm = item.term.trim();
      termMap.set(mainTerm.toLowerCase(), item);
      searchPhrases.push(mainTerm);
    }
    if (item.aliases && item.aliases.trim()) {
      const aliasList = item.aliases.split(",").map(a => a.trim()).filter(Boolean);
      for (const a of aliasList) {
        if (a.length >= 3 && !termMap.has(a.toLowerCase())) {
          termMap.set(a.toLowerCase(), item);
          searchPhrases.push(a);
        }
      }
    }
  }

  if (searchPhrases.length === 0) return text;

  searchPhrases.sort((a, b) => b.length - a.length);

  const escapedPhrases = searchPhrases.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`\\b(${escapedPhrases.join('|')})\\b`, 'gi');

  return text.replace(regex, (match) => {
    const item = termMap.get(match.toLowerCase());
    if (!item) return match;
    return `<span class="glossary-link" onclick="openGlossaryPopup('${item.id}')" title="Klik untuk lihat definisi glosarium: ${item.term}">${match}</span>`;
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "15mb" }));

  // API Routes
  app.get("/api/data", (req, res) => {
    const db = readDb();
    res.json(db);
  });

  // Automated DB Bootstrap Endpoint
  app.post("/api/db/bootstrap", (req, res) => {
    try {
      writeDb(initialDb);
      res.json({
        success: true,
        message: "Database Studio Buku berhasil dibootstrap dengan skema awal dan data seed default.",
        db: initialDb
      });
    } catch (err: any) {
      res.status(500).json({ error: "Gagal melakukan bootstrap database: " + err?.message });
    }
  });

  // Projects CRUD
  app.post("/api/projects", (req, res) => {
    const db = readDb();
    const { title, subtitle, genre, synopsis } = req.body;
    const newProject: Project = {
      id: "proj_" + Date.now(),
      title: title || "Proyek Buku Baru",
      subtitle: subtitle || "Naskah Fiksi / Non-Fiksi Studio",
      genre: genre || "Fiksi",
      synopsis: synopsis || "Sinopsis naskah cerita...",
      createdAt: new Date().toISOString()
    };
    db.projects.push(newProject);

    const firstChap: Chapter = {
      id: "chap_" + Date.now(),
      projectId: newProject.id,
      title: "Bab 1: Permulaan",
      subtitle: "Draf awal cerita",
      content: "Tulis isi naskah bab pertama Anda di sini...",
      order: 1,
      status: "draft",
      lastEditedBy: req.body.authorName || "Penulis Studio",
      updatedAt: new Date().toISOString()
    };
    db.chapters.push(firstChap);

    writeDb(db);
    res.json(newProject);
  });

  app.put("/api/projects/:id", (req, res) => {
    const db = readDb();
    const projIndex = db.projects.findIndex(p => p.id === req.params.id);
    if (projIndex === -1) return res.status(404).json({ error: "Project not found" });

    db.projects[projIndex] = { ...db.projects[projIndex], ...req.body };
    writeDb(db);
    res.json(db.projects[projIndex]);
  });

  // Chapters CRUD
  app.post("/api/chapters", (req, res) => {
    const db = readDb();
    const { projectId, title, subtitle, content, order, status, authorName } = req.body;
    const newChapter: Chapter = {
      id: "chap_" + Date.now(),
      projectId: projectId || "proj_1",
      title: title || "Bab Baru",
      subtitle: subtitle || "",
      content: content || "",
      order: order || db.chapters.length + 1,
      status: status || "draft",
      lastEditedBy: authorName || "Penulis",
      updatedAt: new Date().toISOString()
    };
    db.chapters.push(newChapter);

    db.logs.unshift({
      id: "log_" + Date.now(),
      projectId: newChapter.projectId,
      chapterId: newChapter.id,
      chapterTitle: newChapter.title,
      authorName: authorName || "Penulis",
      action: "Membuat bab baru",
      timestamp: new Date().toISOString()
    });

    writeDb(db);
    res.json(newChapter);
  });

  app.put("/api/chapters/:id", (req, res) => {
    const db = readDb();
    const index = db.chapters.findIndex(c => c.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Chapter not found" });

    const updated = {
      ...db.chapters[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    db.chapters[index] = updated;

    db.logs.unshift({
      id: "log_" + Date.now(),
      projectId: updated.projectId,
      chapterId: updated.id,
      chapterTitle: updated.title,
      authorName: req.body.authorName || updated.lastEditedBy || "Penulis",
      action: req.body.actionDescription || "Memperbarui isi bab",
      timestamp: new Date().toISOString()
    });

    if (db.logs.length > 50) db.logs = db.logs.slice(0, 50);

    writeDb(db);
    res.json(updated);
  });

  app.delete("/api/chapters/:id", (req, res) => {
    const db = readDb();
    const chap = db.chapters.find(c => c.id === req.params.id);
    db.chapters = db.chapters.filter(c => c.id !== req.params.id);
    if (chap) {
      db.logs.unshift({
        id: "log_" + Date.now(),
        projectId: chap.projectId,
        chapterTitle: chap.title,
        authorName: "Penulis",
        action: `Menghapus bab: ${chap.title}`,
        timestamp: new Date().toISOString()
      });
    }
    writeDb(db);
    res.json({ success: true });
  });

  // Glossary CRUD
  app.get("/api/glossary", (req, res) => {
    const db = readDb();
    const projId = req.query.projectId as string;
    const terms = (db.glossary || []).filter(g => !projId || g.projectId === projId);
    res.json(terms);
  });

  app.post("/api/glossary", (req, res) => {
    const db = readDb();
    const { projectId, term, category, definition, aliases } = req.body;
    const newTerm: GlossaryTerm = {
      id: "glos_" + Date.now(),
      projectId: projectId || "proj_1",
      term: term || "Istilah Baru",
      category: category || "Karakter",
      definition: definition || "",
      aliases: aliases || "",
      updatedAt: new Date().toISOString()
    };
    if (!db.glossary) db.glossary = [];
    db.glossary.push(newTerm);
    writeDb(db);
    res.json(newTerm);
  });

  app.put("/api/glossary/:id", (req, res) => {
    const db = readDb();
    if (!db.glossary) db.glossary = [];
    const idx = db.glossary.findIndex(g => g.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Term not found" });
    db.glossary[idx] = { ...db.glossary[idx], ...req.body, updatedAt: new Date().toISOString() };
    writeDb(db);
    res.json(db.glossary[idx]);
  });

  app.delete("/api/glossary/:id", (req, res) => {
    const db = readDb();
    if (!db.glossary) db.glossary = [];
    db.glossary = db.glossary.filter(g => g.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
  });

  // Ideas CRUD
  app.post("/api/ideas", (req, res) => {
    const db = readDb();
    const { projectId, title, content, category, authorId, pinned } = req.body;
    const newIdea: Idea = {
      id: "idea_" + Date.now(),
      projectId: projectId || "proj_1",
      title: title || "Ide Baru",
      content: content || "",
      category: category || "Plot",
      authorId: authorId || "auth_1",
      pinned: !!pinned,
      createdAt: new Date().toISOString()
    };
    db.ideas.push(newIdea);
    writeDb(db);
    res.json(newIdea);
  });

  app.put("/api/ideas/:id", (req, res) => {
    const db = readDb();
    const idx = db.ideas.findIndex(i => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Idea not found" });
    db.ideas[idx] = { ...db.ideas[idx], ...req.body };
    writeDb(db);
    res.json(db.ideas[idx]);
  });

  app.delete("/api/ideas/:id", (req, res) => {
    const db = readDb();
    db.ideas = db.ideas.filter(i => i.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
  });

  // Annotations CRUD
  app.post("/api/annotations", (req, res) => {
    const db = readDb();
    const { projectId, chapterId, chapterTitle, text, authorName } = req.body;
    const newAnn: Annotation = {
      id: "ann_" + Date.now(),
      projectId: projectId || "proj_1",
      chapterId: chapterId || "",
      chapterTitle: chapterTitle || "",
      text: text || "",
      authorName: authorName || "Penulis",
      createdAt: new Date().toISOString(),
      resolved: false
    };
    db.annotations.unshift(newAnn);
    writeDb(db);
    res.json(newAnn);
  });

  app.put("/api/annotations/:id", (req, res) => {
    const db = readDb();
    const idx = db.annotations.findIndex(a => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Annotation not found" });
    db.annotations[idx] = { ...db.annotations[idx], ...req.body };
    writeDb(db);
    res.json(db.annotations[idx]);
  });

  app.delete("/api/annotations/:id", (req, res) => {
    const db = readDb();
    db.annotations = db.annotations.filter(a => a.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
  });

  // Import Text / Google Docs / Txt format
  app.post("/api/import", (req, res) => {
    const db = readDb();
    const { projectId, text, authorName, splitBy } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    let chunks: string[] = [];
    if (splitBy === "chapters") {
      chunks = text.split(/(?=Bab\s+\d+|BAB\s+\d+)/i).filter((s: string) => s.trim().length > 0);
    } else {
      chunks = text.split(/\n\s*\n/).filter((s: string) => s.trim().length > 0);
    }

    if (chunks.length === 0) chunks = [text];

    const createdChapters = [];
    let orderBase = db.chapters.length + 1;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i].trim();
      const firstLine = chunk.split("\n")[0] || `Bagian Impor ${i + 1}`;
      const title = firstLine.length > 50 ? `Bab Impor ${orderBase + i}` : firstLine;
      const content = firstLine.length > 50 ? chunk : chunk.split("\n").slice(1).join("\n") || chunk;

      const newChap: Chapter = {
        id: "chap_imp_" + Date.now() + "_" + i,
        projectId: projectId || "proj_1",
        title: title,
        subtitle: "Diimpor dari Dokumen",
        content: content,
        order: orderBase + i,
        status: "draft",
        lastEditedBy: authorName || "Penulis",
        updatedAt: new Date().toISOString()
      };
      db.chapters.push(newChap);
      createdChapters.push(newChap);
    }

    db.logs.unshift({
      id: "log_" + Date.now(),
      projectId: projectId || "proj_1",
      chapterTitle: `${createdChapters.length} Bagian Diimpor`,
      authorName: authorName || "Penulis",
      action: `Mengimpor naskah teks (${createdChapters.length} bagian baru)`,
      timestamp: new Date().toISOString()
    });

    writeDb(db);
    res.json({ success: true, count: createdChapters.length, chapters: createdChapters });
  });

  // PUBLIC READER ENDPOINTS FOR EXTERNAL AUDIENCES (CHAPTER / FULL PROJECT) WITH GLOSSARY LINKING
  app.get("/public/chapter/:chapterId", (req, res) => {
    const db = readDb();
    const chapter = db.chapters.find(c => c.id === req.params.chapterId);
    if (!chapter) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Bab Tidak Ditemukan - Studio Buku</title><meta charset="utf-8"/></head>
          <body style="font-family:sans-serif; text-align:center; padding:50px; background:#111827; color:#f3f4f6;">
            <h1>404 - Bab Tidak Ditemukan</h1>
            <p>Bab naskah ini telah dihapus atau tidak tersedia.</p>
          </body>
        </html>
      `);
    }

    const project = db.projects.find(p => p.id === chapter.projectId) || db.projects[0];
    const projGlossary = (db.glossary || []).filter(g => g.projectId === project.id);

    const wordCount = chapter.content.trim().split(/\s+/).filter(Boolean).length;
    const readTime = Math.ceil(wordCount / 200);

    const rawParagraphs = chapter.content.split(/\n\s*\n/);
    const paragraphs = rawParagraphs.map(p => {
      const linked = linkifyGlossary(p, projGlossary);
      return `<p style="margin-bottom: 1.5em; text-indent: 1.5em; line-height: 1.8; font-size: 1.15rem;">${linked.replace(/\n/g, "<br/>")}</p>`;
    }).join("");

    const glossaryCardsHtml = projGlossary.map(g => `
      <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border); padding: 12px 15px; border-radius: 10px; margin-bottom: 10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px;">
          <strong style="color: var(--accent); font-size: 0.95rem;">${g.term}</strong>
          <span style="font-size: 0.7rem; background: rgba(245,158,11,0.2); color: var(--accent); padding: 2px 8px; border-radius: 12px; font-family: system-ui; font-weight: bold;">${g.category}</span>
        </div>
        <div style="font-size: 0.85rem; opacity: 0.9; line-height: 1.4;">${g.definition}</div>
        ${g.aliases ? `<div style="font-size: 0.75rem; opacity: 0.6; margin-top: 4px; font-style: italic;">Sebutan lain: ${g.aliases}</div>` : ""}
      </div>
    `).join("");

    const html = `
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${chapter.title} - ${project.title}</title>
          <style>
            :root {
              --bg: #111827;
              --text: #f3f4f6;
              --paper: #1f2937;
              --border: #374151;
              --accent: #f59e0b;
            }
            body.sepia {
              --bg: #f4ecd8;
              --text: #3c2f2f;
              --paper: #fbf0d9;
              --border: #e2d3b5;
              --accent: #b45309;
            }
            body.light {
              --bg: #f9fafb;
              --text: #111827;
              --paper: #ffffff;
              --border: #e5e7eb;
              --accent: #d97706;
            }
            body {
              background-color: var(--bg);
              color: var(--text);
              font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
              margin: 0;
              padding: 0;
              transition: all 0.3s ease;
            }
            .header-bar {
              position: sticky;
              top: 0;
              background: var(--paper);
              border-bottom: 1px solid var(--border);
              padding: 12px 20px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              font-family: system-ui, sans-serif;
              font-size: 0.85rem;
              z-index: 100;
            }
            .controls button {
              background: transparent;
              border: 1px solid var(--border);
              color: var(--text);
              padding: 6px 12px;
              border-radius: 20px;
              cursor: pointer;
              font-weight: bold;
              font-size: 0.75rem;
            }
            .glossary-link {
              background-color: rgba(245, 158, 11, 0.22);
              border-bottom: 2px solid var(--accent);
              color: inherit;
              font-weight: bold;
              padding: 0 3px;
              border-radius: 4px;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .glossary-link:hover {
              background-color: var(--accent);
              color: #111827;
            }
            .container {
              max-width: 760px;
              margin: 40px auto;
              padding: 40px 30px;
              background-color: var(--paper);
              border-radius: 16px;
              border: 1px solid var(--border);
              box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            }
            .title {
              font-size: 2rem;
              font-weight: 900;
              color: var(--accent);
              margin-bottom: 8px;
              line-height: 1.2;
            }
            .subtitle {
              font-size: 1.1rem;
              font-style: italic;
              opacity: 0.8;
              margin-bottom: 20px;
            }
            .meta {
              font-family: system-ui, sans-serif;
              font-size: 0.8rem;
              opacity: 0.7;
              border-bottom: 1px solid var(--border);
              padding-bottom: 16px;
              margin-bottom: 30px;
              display: flex;
              gap: 15px;
            }
            .modal-overlay {
              display: none;
              position: fixed;
              inset: 0;
              background: rgba(0,0,0,0.75);
              backdrop-filter: blur(4px);
              z-index: 200;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .modal-box {
              background: var(--paper);
              border: 2px solid var(--accent);
              border-radius: 16px;
              max-width: 480px;
              width: 100%;
              padding: 24px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.5);
              font-family: system-ui, sans-serif;
            }
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid var(--border);
              text-align: center;
              font-family: system-ui, sans-serif;
              font-size: 0.8rem;
              opacity: 0.7;
            }
            @media print {
              .header-bar { display: none; }
              .container { border: none; box-shadow: none; background: white; color: black; max-width: 100%; }
            }
          </style>
        </head>
        <body class="dark">
          <div class="header-bar">
            <div>
              <strong>📖 Studio Buku Reader</strong> — ${project.title}
            </div>
            <div class="controls">
              <button onclick="openFullGlossaryDrawer()">📖 Glosarium (${projGlossary.length})</button>
              <button onclick="document.body.className='light'">☀️ Terang</button>
              <button onclick="document.body.className='sepia'">📜 Sepia</button>
              <button onclick="document.body.className='dark'">🌙 Gelap</button>
              <button onclick="window.print()">🖨️ Cetak</button>
            </div>
          </div>

          <div class="container">
            <div class="title">${chapter.title}</div>
            ${chapter.subtitle ? `<div class="subtitle">${chapter.subtitle}</div>` : ""}
            <div class="meta">
              <span>📚 Naskah: ${project.title}</span>
              <span>📝 ${wordCount.toLocaleString("id-ID")} Kata</span>
              <span>⏱️ ~${readTime} menit baca</span>
            </div>

            <div style="background: rgba(245,158,11,0.1); border-left: 3px solid var(--accent); padding: 10px 15px; font-family: system-ui; font-size: 0.8rem; margin-bottom: 25px; border-radius: 6px;">
              💡 <strong>Petunjuk Pembaca / Reviewer:</strong> Istilah atau nama karakter yang digarisbawahi kuning (<span class="glossary-link">seperti ini</span>) dapat diklik untuk melihat penjelasan Glosarium Naskah dari penulis.
            </div>

            <div class="content">
              ${paragraphs}
            </div>

            <div class="footer">
              Dipublikasikan melalui Studio Buku (Nulis Bareng Studio)
            </div>
          </div>

          <!-- GLOSSARY CARD POPUP MODAL -->
          <div id="glossary-modal" class="modal-overlay" onclick="closeGlossaryModal()">
            <div class="modal-box" onclick="event.stopPropagation()">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                <div>
                  <span id="modal-category" style="background: rgba(245,158,11,0.2); color: var(--accent); padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;">Kategori</span>
                  <h3 id="modal-term" style="font-size: 1.4rem; margin: 8px 0 0 0; color: var(--accent);">Nama Istilah</h3>
                </div>
                <button onclick="closeGlossaryModal()" style="background:none; border:none; color:var(--text); font-size: 1.2rem; cursor:pointer; font-weight:bold;">✕</button>
              </div>

              <div id="modal-definition" style="font-size: 0.95rem; line-height: 1.6; margin-bottom: 15px; opacity: 0.95;">
                Definisi istilah...
              </div>

              <div id="modal-aliases" style="font-size: 0.8rem; opacity: 0.7; font-style: italic; border-top: 1px solid var(--border); padding-top: 10px;">
              </div>
            </div>
          </div>

          <!-- FULL GLOSSARY DRAWER MODAL -->
          <div id="full-glossary-modal" class="modal-overlay" onclick="closeFullGlossaryDrawer()">
            <div class="modal-box" style="max-width: 600px; max-height: 80vh; overflow-y: auto;" onclick="event.stopPropagation()">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 15px;">
                <h3 style="margin:0; font-size: 1.2rem; color: var(--accent);">📖 Glosarium Naskah (${projGlossary.length} Istilah)</h3>
                <button onclick="closeFullGlossaryDrawer()" style="background:none; border:none; color:var(--text); font-size: 1.2rem; cursor:pointer; font-weight:bold;">✕</button>
              </div>

              <div style="margin-bottom: 15px;">
                ${glossaryCardsHtml.length > 0 ? glossaryCardsHtml : '<div style="opacity:0.7; font-size:0.85rem;">Belum ada istilah glosarium yang ditambahkan untuk proyek ini.</div>'}
              </div>
            </div>
          </div>

          <script>
            const GLOSSARY_DATA = ${JSON.stringify(projGlossary)};

            function openGlossaryPopup(id) {
              const item = GLOSSARY_DATA.find(g => g.id === id);
              if (!item) return;
              document.getElementById('modal-term').innerText = item.term;
              document.getElementById('modal-category').innerText = item.category || 'Glosarium';
              document.getElementById('modal-definition').innerText = item.definition || 'Tidak ada deskripsi.';
              document.getElementById('modal-aliases').innerText = item.aliases ? ('Sebutan/alias lain: ' + item.aliases) : '';
              document.getElementById('glossary-modal').style.display = 'flex';
            }

            function closeGlossaryModal() {
              document.getElementById('glossary-modal').style.display = 'none';
            }

            function openFullGlossaryDrawer() {
              document.getElementById('full-glossary-modal').style.display = 'flex';
            }

            function closeFullGlossaryDrawer() {
              document.getElementById('full-glossary-modal').style.display = 'none';
            }
          </script>
        </body>
      </html>
    `;
    res.send(html);
  });

  app.get("/public/project/:projectId", (req, res) => {
    const db = readDb();
    const project = db.projects.find(p => p.id === req.params.projectId) || db.projects[0];
    const projChapters = db.chapters.filter(c => c.projectId === project.id).sort((a,b) => a.order - b.order);
    const projGlossary = (db.glossary || []).filter(g => g.projectId === project.id);

    const totalWords = projChapters.reduce((acc, c) => acc + (c.content ? c.content.trim().split(/\s+/).filter(Boolean).length : 0), 0);
    const totalReadMins = Math.ceil(totalWords / 200);

    const tocHtml = projChapters.map((c, idx) => `
      <li style="margin-bottom: 8px;">
        <a href="#chap-${c.id}" style="color: var(--accent); text-decoration: none; font-weight: bold;">
          Bab ${idx + 1}: ${c.title}
        </a>
      </li>
    `).join("");

    const chaptersBodyHtml = projChapters.map((c, idx) => {
      const rawParas = c.content.split(/\n\s*\n/);
      const paras = rawParas.map(p => {
        const linked = linkifyGlossary(p, projGlossary);
        return `<p style="margin-bottom: 1.5em; text-indent: 1.5em; line-height: 1.8; font-size: 1.15rem;">${linked.replace(/\n/g, "<br/>")}</p>`;
      }).join("");

      return `
        <section id="chap-${c.id}" style="margin-top: 60px; padding-top: 30px; border-top: 2px dashed var(--border);">
          <div style="font-size: 0.85rem; font-family: system-ui; text-transform: uppercase; color: var(--accent); font-weight: bold;">
            BAB ${idx + 1}
          </div>
          <h2 style="font-size: 1.8rem; margin-top: 5px; margin-bottom: 10px;">${c.title}</h2>
          ${c.subtitle ? `<div style="font-style: italic; opacity: 0.8; margin-bottom: 20px;">${c.subtitle}</div>` : ""}
          <div>${paras}</div>
        </section>
      `;
    }).join("");

    const glossaryCardsHtml = projGlossary.map(g => `
      <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border); padding: 12px 15px; border-radius: 10px; margin-bottom: 10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px;">
          <strong style="color: var(--accent); font-size: 0.95rem;">${g.term}</strong>
          <span style="font-size: 0.7rem; background: rgba(245,158,11,0.2); color: var(--accent); padding: 2px 8px; border-radius: 12px; font-family: system-ui; font-weight: bold;">${g.category}</span>
        </div>
        <div style="font-size: 0.85rem; opacity: 0.9; line-height: 1.4;">${g.definition}</div>
        ${g.aliases ? `<div style="font-size: 0.75rem; opacity: 0.6; margin-top: 4px; font-style: italic;">Sebutan lain: ${g.aliases}</div>` : ""}
      </div>
    `).join("");

    const html = `
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${project.title} - Full Book Reader</title>
          <style>
            :root {
              --bg: #111827;
              --text: #f3f4f6;
              --paper: #1f2937;
              --border: #374151;
              --accent: #f59e0b;
            }
            body.sepia {
              --bg: #f4ecd8;
              --text: #3c2f2f;
              --paper: #fbf0d9;
              --border: #e2d3b5;
              --accent: #b45309;
            }
            body.light {
              --bg: #f9fafb;
              --text: #111827;
              --paper: #ffffff;
              --border: #e5e7eb;
              --accent: #d97706;
            }
            body {
              background-color: var(--bg);
              color: var(--text);
              font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
              margin: 0;
              padding: 0;
              transition: all 0.3s ease;
            }
            .header-bar {
              position: sticky;
              top: 0;
              background: var(--paper);
              border-bottom: 1px solid var(--border);
              padding: 12px 20px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              font-family: system-ui, sans-serif;
              font-size: 0.85rem;
              z-index: 100;
            }
            .controls button {
              background: transparent;
              border: 1px solid var(--border);
              color: var(--text);
              padding: 6px 12px;
              border-radius: 20px;
              cursor: pointer;
              font-weight: bold;
              font-size: 0.75rem;
            }
            .glossary-link {
              background-color: rgba(245, 158, 11, 0.22);
              border-bottom: 2px solid var(--accent);
              color: inherit;
              font-weight: bold;
              padding: 0 3px;
              border-radius: 4px;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .glossary-link:hover {
              background-color: var(--accent);
              color: #111827;
            }
            .container {
              max-width: 800px;
              margin: 40px auto;
              padding: 50px 40px;
              background-color: var(--paper);
              border-radius: 16px;
              border: 1px solid var(--border);
              box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            }
            .book-title {
              font-size: 2.5rem;
              font-weight: 900;
              color: var(--accent);
              margin-bottom: 10px;
              text-align: center;
              line-height: 1.2;
            }
            .book-subtitle {
              font-size: 1.2rem;
              font-style: italic;
              text-align: center;
              opacity: 0.8;
              margin-bottom: 25px;
            }
            .book-meta {
              font-family: system-ui, sans-serif;
              font-size: 0.85rem;
              text-align: center;
              opacity: 0.75;
              padding-bottom: 25px;
              border-bottom: 2px solid var(--border);
              margin-bottom: 35px;
            }
            .synopsis {
              background: rgba(0,0,0,0.1);
              padding: 20px;
              border-radius: 12px;
              border-left: 4px solid var(--accent);
              font-style: italic;
              margin-bottom: 40px;
              font-size: 0.95rem;
            }
            .toc {
              background: rgba(0,0,0,0.15);
              padding: 25px 35px;
              border-radius: 12px;
              font-family: system-ui, sans-serif;
              margin-bottom: 50px;
            }
            .modal-overlay {
              display: none;
              position: fixed;
              inset: 0;
              background: rgba(0,0,0,0.75);
              backdrop-filter: blur(4px);
              z-index: 200;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .modal-box {
              background: var(--paper);
              border: 2px solid var(--accent);
              border-radius: 16px;
              max-width: 480px;
              width: 100%;
              padding: 24px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.5);
              font-family: system-ui, sans-serif;
            }
            @media print {
              .header-bar { display: none; }
              .container { border: none; box-shadow: none; background: white; color: black; max-width: 100%; }
            }
          </style>
        </head>
        <body class="dark">
          <div class="header-bar">
            <div>
              <strong>📚 Studio Buku Complete Reader</strong> — ${project.title}
            </div>
            <div class="controls">
              <button onclick="openFullGlossaryDrawer()">📖 Glosarium (${projGlossary.length})</button>
              <button onclick="document.body.className='light'">☀️ Terang</button>
              <button onclick="document.body.className='sepia'">📜 Sepia</button>
              <button onclick="document.body.className='dark'">🌙 Gelap</button>
              <button onclick="window.print()">🖨️ Cetak</button>
            </div>
          </div>

          <div class="container">
            <div class="book-title">${project.title}</div>
            ${project.subtitle ? `<div class="book-subtitle">${project.subtitle}</div>` : ""}
            <div class="book-meta">
              Genre: <strong>${project.genre}</strong> • Total <strong>${totalWords.toLocaleString("id-ID")} Kata</strong> • Est. <strong>~${totalReadMins} min baca</strong>
            </div>

            ${project.synopsis ? `
              <div class="synopsis">
                <strong>Sinopsis Naskah:</strong><br/>
                ${project.synopsis}
              </div>
            ` : ""}

            <div style="background: rgba(245,158,11,0.1); border-left: 3px solid var(--accent); padding: 10px 15px; font-family: system-ui; font-size: 0.8rem; margin-bottom: 25px; border-radius: 6px;">
              💡 <strong>Petunjuk Pembaca / Reviewer:</strong> Kata/istilah yang digarisbawahi kuning (<span class="glossary-link">seperti ini</span>) dapat diklik untuk melihat penjelasan Glosarium Naskah dari penulis.
            </div>

            <div class="toc">
              <h3 style="margin-top:0; font-size: 1.1rem; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
                📑 Daftar Isi Naskah (${projChapters.length} Bab)
              </h3>
              <ol style="padding-left: 20px; margin-bottom: 0;">
                ${tocHtml}
              </ol>
            </div>

            ${chaptersBodyHtml}

            <div style="margin-top: 60px; text-align: center; font-family: system-ui; font-size: 0.85rem; opacity: 0.7; border-top: 1px solid var(--border); padding-top: 25px;">
              Dipublikasikan melalui Studio Buku (Nulis Bareng Studio)
            </div>
          </div>

          <!-- GLOSSARY CARD POPUP MODAL -->
          <div id="glossary-modal" class="modal-overlay" onclick="closeGlossaryModal()">
            <div class="modal-box" onclick="event.stopPropagation()">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                <div>
                  <span id="modal-category" style="background: rgba(245,158,11,0.2); color: var(--accent); padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;">Kategori</span>
                  <h3 id="modal-term" style="font-size: 1.4rem; margin: 8px 0 0 0; color: var(--accent);">Nama Istilah</h3>
                </div>
                <button onclick="closeGlossaryModal()" style="background:none; border:none; color:var(--text); font-size: 1.2rem; cursor:pointer; font-weight:bold;">✕</button>
              </div>

              <div id="modal-definition" style="font-size: 0.95rem; line-height: 1.6; margin-bottom: 15px; opacity: 0.95;">
                Definisi istilah...
              </div>

              <div id="modal-aliases" style="font-size: 0.8rem; opacity: 0.7; font-style: italic; border-top: 1px solid var(--border); padding-top: 10px;">
              </div>
            </div>
          </div>

          <!-- FULL GLOSSARY DRAWER MODAL -->
          <div id="full-glossary-modal" class="modal-overlay" onclick="closeFullGlossaryDrawer()">
            <div class="modal-box" style="max-width: 600px; max-height: 80vh; overflow-y: auto;" onclick="event.stopPropagation()">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 15px;">
                <h3 style="margin:0; font-size: 1.2rem; color: var(--accent);">📖 Glosarium Naskah (${projGlossary.length} Istilah)</h3>
                <button onclick="closeFullGlossaryDrawer()" style="background:none; border:none; color:var(--text); font-size: 1.2rem; cursor:pointer; font-weight:bold;">✕</button>
              </div>

              <div style="margin-bottom: 15px;">
                ${glossaryCardsHtml.length > 0 ? glossaryCardsHtml : '<div style="opacity:0.7; font-size:0.85rem;">Belum ada istilah glosarium yang ditambahkan untuk proyek ini.</div>'}
              </div>
            </div>
          </div>

          <script>
            const GLOSSARY_DATA = ${JSON.stringify(projGlossary)};

            function openGlossaryPopup(id) {
              const item = GLOSSARY_DATA.find(g => g.id === id);
              if (!item) return;
              document.getElementById('modal-term').innerText = item.term;
              document.getElementById('modal-category').innerText = item.category || 'Glosarium';
              document.getElementById('modal-definition').innerText = item.definition || 'Tidak ada deskripsi.';
              document.getElementById('modal-aliases').innerText = item.aliases ? ('Sebutan/alias lain: ' + item.aliases) : '';
              document.getElementById('glossary-modal').style.display = 'flex';
            }

            function closeGlossaryModal() {
              document.getElementById('glossary-modal').style.display = 'none';
            }

            function openFullGlossaryDrawer() {
              document.getElementById('full-glossary-modal').style.display = 'flex';
            }

            function closeFullGlossaryDrawer() {
              document.getElementById('full-glossary-modal').style.display = 'none';
            }
          </script>
        </body>
      </html>
    `;
    res.send(html);
  });

  // Gemini AI Assistant Proxy Route
  app.post("/api/ai/assist", async (req, res) => {
    try {
      const { action, text, context, genre } = req.body;
      const customApiKey = req.headers["x-gemini-api-key"] as string | undefined;
      const apiKey = customApiKey?.trim() || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(400).json({
          error: "API Key Gemini belum terkonfigurasi. Harap tentukan GEMINI_API_KEY pada server atau masukkan API Key pribadi di Pengaturan AI Studio."
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      let prompt = "";
      let systemInstruction = "Anda adalah asisten penulisan kreatif profesional untuk Studio Buku — studio penulisan buku kolaboratif (menulis bersama, berpikir bersama) dalam bahasa Indonesia.";

      if (action === "continue") {
        prompt = `Lanjutkan tulisan berikut untuk novel bergenre ${genre || "Fiksi"}. Pastikan gaya bahasa selaras, mengalir natural, dan melanjutkan alur emosi dengan indah (panjang sekitar 2-3 paragraf):\n\nKonteks sebelumnya: "${context || ''}"\n\nTeks terakhir:\n"${text}"`;
      } else if (action === "proofread") {
        prompt = `Tinjau dan perbaiki tata bahasa, EBI/EYD, dan pilihan kata (diksi) dari teks berikut agar lebih indah dibaca tanpa mengubah makna aslinya:\n\n"${text}"`;
      } else if (action === "expand_idea") {
        prompt = `Kembangkan gagasan/ide singkat berikut menjadi sebuah draf adegan atau deskripsi naratif yang mendalam untuk novel:\n\nJudul Ide: "${text}"\nKeterangan: "${context}"`;
      } else if (action === "outline") {
        prompt = `Buatkan 5 usulan bab atau alur lanjutan yang menarik untuk cerita bergenre ${genre || "Fiksi"} dengan sinopsis: "${text}". Berikan judul bab dan ringkasan singkat tiap bab dalam format poin.`;
      } else {
        prompt = text || "Berikan saran kreatif untuk penulisan naskah ini.";
      }

      let responseText = "";
      const modelsToTry = ["gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.8-flash"];
      let lastError = null;

      for (const m of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: m,
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.8,
            }
          });
          if (response.text) {
            responseText = response.text;
            break;
          }
        } catch (err: any) {
          console.warn(`Model ${m} failed:`, err?.message || err);
          lastError = err;
        }
      }

      if (!responseText) {
        throw lastError || new Error("Semua model Gemini gagal merespons.");
      }

      res.json({ result: responseText });
    } catch (err: any) {
      console.error("Gemini AI Error:", err);
      const msg = err?.message || "";
      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("Quota exceeded") || msg.includes("rate limit")) {
        return res.status(429).json({ 
          error: "Batas Kuota Free Tier Terlampaui (Error 429: Too Many Requests). Batas maksimal adalah 15 permintaan per menit (RPM) dan 1.500 per hari (RPD). Harap tunggu 1 menit sebelum mencoba kembali atau tingkatkan ke paket Pay-as-you-go." 
        });
      }
      res.status(500).json({ error: msg || "Gagal memproses permintaan AI." });
    }
  });
  app.get("/privacy", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Kebijakan Privasi - Studio Buku</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px 20px; line-height: 1.6; }
            .container { max-width: 800px; margin: 0 auto; background: #1e293b; padding: 40px; border-radius: 20px; border: 1px solid #334155; }
            h1 { color: #fbbf24; margin-bottom: 8px; }
            h2 { color: #f59e0b; margin-top: 24px; font-size: 1.2rem; }
            p { color: #cbd5e1; font-size: 0.95rem; }
            a { color: #fbbf24; text-decoration: none; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Kebijakan Privasi Studio Buku</h1>
            <p><strong>Terakhir diperbarui: 30 September 2026</strong></p>
            <p>Studio Buku (studio.buku.biz.id) berkomitmen untuk melindungi privasi dan keamanan data pengguna dan penulis kami.</p>

            <h2>1. Pengumpulan Informasi</h2>
            <p>Kami mengumpulkan informasi akun dasar saat Anda masuk menggunakan Google Authentication (seperti nama, alamat email, dan foto profil) untuk memverifikasi hak akses naskah dan profil penulis Anda.</p>

            <h2>2. Penggunaan Data</h2>
            <p>Data Anda hanya digunakan untuk menyediakan ruang kerja penulisan naskah, sinkronisasi draf, dan fitur analisis Asisten AI dalam Studio Buku.</p>

            <h2>3. Keamanan Data</h2>
            <p>Kerahasiaan naskah buku Anda dilindungi dengan enkripsi standar dan kontrol akses otentikasi Firebase Auth.</p>

            <h2>4. Kontak</h2>
            <p>Untuk pertanyaan mengenai kebijakan privasi ini, Anda dapat menghubungi kami melalui <a href="mailto:Roy.Wikan@gmail.com">Roy.Wikan@gmail.com</a>.</p>
          </div>
        </body>
      </html>
    `);
  });

  // Terms of Service Route
  app.get("/terms", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Syarat & Ketentuan Layanan - Studio Buku</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px 20px; line-height: 1.6; }
            .container { max-width: 800px; margin: 0 auto; background: #1e293b; padding: 40px; border-radius: 20px; border: 1px solid #334155; }
            h1 { color: #fbbf24; margin-bottom: 8px; }
            h2 { color: #f59e0b; margin-top: 24px; font-size: 1.2rem; }
            p { color: #cbd5e1; font-size: 0.95rem; }
            a { color: #fbbf24; text-decoration: none; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Syarat & Ketentuan Layanan Studio Buku</h1>
            <p><strong>Terakhir diperbarui: 30 September 2026</strong></p>

            <h2>1. Ketentuan Umum</h2>
            <p>Dengan mengakses dan menggunakan Studio Buku (studio.buku.biz.id), Anda menyetujui untuk mematuhi syarat dan ketentuan layanan ini.</p>

            <h2>2. Hak Cipta & Kepemilikan Naskah</h2>
            <p>Seluruh hak cipta, ide cerita, dan isi naskah yang ditulis di Studio Buku sepenuhnya merupakan milik sah penulis / pengguna.</p>

            <h2>3. Penggunaan Layanan</h2>
            <p>Pengguna dilarang menyalahgunakan layanan untuk mempublikasikan materi yang melanggar hukum atau hak cipta pihak lain.</p>

            <h2>4. Kontak Layanan</h2>
            <p>Pertanyaan mengenai syarat dan ketentuan dapat dikirimkan ke <a href="mailto:Roy.Wikan@gmail.com">Roy.Wikan@gmail.com</a>.</p>
          </div>
        </body>
      </html>
    `);
  });

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Studio Buku server running on http://localhost:${PORT}`);
  });
}

startServer();
