import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { INITIAL_SEED_DB, slugify as seedSlugify } from "./src/seedData";

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
  isPrivate?: boolean;
  ownerId?: string;
  ownerName?: string;
  coAuthors?: string[];
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

const initialDb: DB = INITIAL_SEED_DB;
function readDb(): DB {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (!parsed.glossary) parsed.glossary = initialDb.glossary;

      // Migrate / Normalize schema for isPrivate, ownerId, ownerName, coAuthors
      if (parsed.projects && Array.isArray(parsed.projects)) {
        if (parsed.projects.length < 50) {
          writeDb(initialDb);
          return initialDb;
        }

        parsed.projects = parsed.projects.map((p: any) => ({
          ...p,
          isPrivate: typeof p.isPrivate === "boolean" ? p.isPrivate : false,
          ownerId: p.ownerId || "auth_1",
          ownerName: p.ownerName || "Rian Hidayat",
          coAuthors: Array.isArray(p.coAuthors) ? p.coAuthors : ["auth_2", "Kirana Maharani"]
        }));
      }

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

  // Automated DB Bootstrap & Seed Endpoints
  const handleDatabaseSeed = (req: express.Request, res: express.Response) => {
    try {
      console.log(`[Server Seed API] 📥 Received ${req.method} request on ${req.originalUrl || req.path}`);
      
      const body = req.body || {};
      const hasPayload = body && Array.isArray(body.projects) && body.projects.length > 0;
      
      const targetDb: DB = hasPayload
        ? {
            projects: body.projects,
            chapters: Array.isArray(body.chapters) ? body.chapters : INITIAL_SEED_DB.chapters,
            authors: Array.isArray(body.authors) ? body.authors : INITIAL_SEED_DB.authors,
            ideas: Array.isArray(body.ideas) ? body.ideas : INITIAL_SEED_DB.ideas,
            logs: Array.isArray(body.logs) ? body.logs : INITIAL_SEED_DB.logs,
            annotations: Array.isArray(body.annotations) ? body.annotations : [],
            glossary: Array.isArray(body.glossary) ? body.glossary : INITIAL_SEED_DB.glossary,
          }
        : INITIAL_SEED_DB;

      writeDb(targetDb);
      console.log(`[Server Seed API] ✅ Berhasil menulis ${targetDb.projects.length} proyek dan ${targetDb.chapters.length} bab ke ${DB_FILE}`);

      res.json({
        success: true,
        source: hasPayload ? "client_payload" : "server_seed_catalog",
        message: `Database berhasil di-bootstrap dengan ${targetDb.projects.length} proyek naskah dan ${targetDb.chapters.length} bab!`,
        totalProjects: targetDb.projects.length,
        totalChapters: targetDb.chapters.length,
        totalAuthors: targetDb.authors.length,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("[Server Seed API] ❌ Gagal melakukan bootstrap database:", err);
      res.status(500).json({
        success: false,
        error: "Gagal melakukan bootstrap database: " + (err?.message || "Internal error")
      });
    }
  };

  app.all("/api/seed", handleDatabaseSeed);
  app.all("/api/db/bootstrap", handleDatabaseSeed);

  // Serve SQL files directly for Cloudflare D1 Data Explorer
  app.get("/schema.sql", (req, res) => {
    res.type("text/plain").sendFile(path.join(process.cwd(), "schema.sql"));
  });

  app.get("/d1-sql/:file", (req, res) => {
    const filename = req.params.file;
    const safeFile = path.basename(filename);
    const filePath = path.join(process.cwd(), "d1-sql", safeFile);
    if (fs.existsSync(filePath)) {
      res.type("text/plain").sendFile(filePath);
    } else {
      res.status(404).send("File not found");
    }
  });

  // Public Projects API with Pagination
  app.get("/api/public/projects", (req, res) => {
    const db = readDb();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;

    const publicProjs = (db.projects || [])
      .filter(p => !p.isPrivate)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = publicProjs.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const startIndex = (page - 1) * limit;
    const paginated = publicProjs.slice(startIndex, startIndex + limit);

    res.json({
      projects: paginated,
      total,
      page,
      limit,
      totalPages
    });
  });

  // Projects CRUD
  app.post("/api/projects", (req, res) => {
    const db = readDb();
    const { title, subtitle, genre, synopsis, isPrivate, ownerId, ownerName, coAuthors } = req.body;
    const newProject: Project = {
      id: "proj_" + Date.now(),
      title: title || "Proyek Buku Baru",
      subtitle: subtitle || "Naskah Fiksi / Non-Fiksi Studio",
      genre: genre || "Fiksi",
      synopsis: synopsis || "Sinopsis naskah cerita...",
      createdAt: new Date().toISOString(),
      isPrivate: !!isPrivate,
      ownerId: ownerId || req.body.authorId || "auth_1",
      ownerName: ownerName || req.body.authorName || "Penulis Studio",
      coAuthors: Array.isArray(coAuthors) ? coAuthors : []
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
      lastEditedBy: ownerName || req.body.authorName || "Penulis Studio",
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

    db.projects[projIndex] = {
      ...db.projects[projIndex],
      ...req.body,
      isPrivate: typeof req.body.isPrivate === "boolean" ? req.body.isPrivate : db.projects[projIndex].isPrivate
    };
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

  // Helper functions for SEO & Public Preview HTML
  function slugify(text: string): string {
    return (text || "")
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "naskah";
  }

  function escapeHtml(str: string): string {
    return (str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderPublicPreviewHtml(db: DB, projectSlugInput: string, chapterSlugInput?: string): string {
    const cleanProjSlug = (projectSlugInput || "").toLowerCase();
    const project = db.projects.find(p => p.id === projectSlugInput || slugify(p.title) === cleanProjSlug) || db.projects[0];
    if (!project) {
      return `<!DOCTYPE html><html lang="id"><head><title>Proyek Tidak Ditemukan - Studio Buku</title></head><body style="background:#0f172a;color:#f8fafc;font-family:sans-serif;text-align:center;padding:50px;"><h1>404 - Proyek Naskah Tidak Ditemukan</h1><p><a href="https://studio.buku.biz.id" style="color:#fbbf24;">Kembali ke Studio Buku</a></p></body></html>`;
    }

    if (project.isPrivate) {
      return `
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Akses Terbatas (Naskah Privat) - Studio Buku</title>
          <style>
            body { background: #0f172a; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: #1e293b; border: 2px solid #f59e0b; border-radius: 24px; max-width: 480px; width: 100%; padding: 40px 30px; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.5); }
            .icon { font-size: 3.5rem; margin-bottom: 12px; }
            h1 { color: #fbbf24; font-size: 1.5rem; font-weight: 900; margin: 0 0 10px 0; }
            p { color: #cbd5e1; font-size: 0.92rem; line-height: 1.6; margin: 0 0 24px 0; }
            a { display: inline-block; background: #fbbf24; color: #0f172a; text-decoration: none; padding: 10px 26px; border-radius: 99px; font-weight: 900; font-size: 0.85rem; }
            a:hover { background: #f59e0b; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">🔒</div>
            <h1>Naskah Ini Bersifat Privat</h1>
            <p>Penulis inisiator telah mengeset naskah <strong>"${escapeHtml(project.title)}"</strong> sebagai karya privat. Pratinjau publik tidak dapat diakses.</p>
            <a href="https://studio.buku.biz.id">Kembali ke Studio Buku</a>
          </div>
        </body>
        </html>
      `;
    }

    const projChapters = db.chapters.filter(c => c.projectId === project.id).sort((a,b) => a.order - b.order);
    const projGlossary = (db.glossary || []).filter(g => g.projectId === project.id);

    let activeChapter: Chapter | undefined;
    if (chapterSlugInput) {
      const cleanChapSlug = chapterSlugInput.toLowerCase();
      activeChapter = projChapters.find(c => c.id === chapterSlugInput || slugify(c.title) === cleanChapSlug);
    }

    const isFullBook = !activeChapter;
    const currentChap = activeChapter || projChapters[0] || {
      id: "chap_1",
      title: "Bab 1",
      subtitle: "",
      content: "Isi naskah sedang disiapkan.",
      order: 1,
      status: "draft",
      lastEditedBy: "Studio Buku",
      updatedAt: new Date().toISOString()
    };

    const projSlugClean = slugify(project.title);
    const chapSlugClean = currentChap ? slugify(currentChap.title) : "bab-1";

    const BASE_DOMAIN = "https://studio.buku.biz.id";
    const canonicalUrl = isFullBook
      ? `${BASE_DOMAIN}/p/${projSlugClean}`
      : `${BASE_DOMAIN}/p/${projSlugClean}/${chapSlugClean}`;
    const projectCanonicalUrl = `${BASE_DOMAIN}/p/${projSlugClean}`;

    const pageTitle = isFullBook
      ? `${project.title} — Full Naskah & Proposal Penulisan | Studio Buku`
      : `${currentChap.title} | Naskah "${project.title}" — Studio Buku`;

    const pageDesc = isFullBook
      ? `Draf Lengkap & Proposal Naskah "${project.title}". Genre: ${project.genre}. ${project.synopsis}`
      : `${currentChap.title} — ${currentChap.subtitle || project.synopsis}`;

    const wordCount = isFullBook
      ? projChapters.reduce((acc, c) => acc + (c.content ? c.content.trim().split(/\s+/).filter(Boolean).length : 0), 0)
      : (currentChap.content ? currentChap.content.trim().split(/\s+/).filter(Boolean).length : 0);

    const readTime = Math.ceil(wordCount / 200);

    let contentHtml = "";
    if (isFullBook) {
      contentHtml = projChapters.map((c, idx) => {
        const rawParas = (c.content || "").split(/\n\s*\n/);
        const paras = rawParas.map(p => {
          const linked = linkifyGlossary(p, projGlossary);
          return `<p style="margin-bottom: 1.5em; text-indent: 1.5em; line-height: 1.8; font-size: 1.15rem;">${linked.replace(/\n/g, "<br/>")}</p>`;
        }).join("");

        return `
          <section id="${slugify(c.title)}" style="margin-top: 50px; padding-top: 30px; border-top: 2px dashed var(--border);">
            <div style="font-size: 0.8rem; font-family: system-ui; text-transform: uppercase; color: var(--accent); font-weight: 800; letter-spacing: 0.05em;">
              BAB ${idx + 1}
            </div>
            <h2 style="font-size: 1.8rem; margin-top: 6px; margin-bottom: 8px; font-weight: 900; color: var(--accent);">${escapeHtml(c.title)}</h2>
            ${c.subtitle ? `<div style="font-style: italic; opacity: 0.85; margin-bottom: 24px; font-size: 1.05rem;">${escapeHtml(c.subtitle)}</div>` : ""}
            <div>${paras}</div>
          </section>
        `;
      }).join("");
    } else {
      const rawParagraphs = (currentChap.content || "").split(/\n\s*\n/);
      contentHtml = rawParagraphs.map(p => {
        const linked = linkifyGlossary(p, projGlossary);
        return `<p style="margin-bottom: 1.5em; text-indent: 1.5em; line-height: 1.8; font-size: 1.15rem;">${linked.replace(/\n/g, "<br/>")}</p>`;
      }).join("");
    }

    let chapterNavHtml = "";
    if (!isFullBook && projChapters.length > 1) {
      const currentIndex = projChapters.findIndex(c => c.id === currentChap.id);
      const prevChap = projChapters[currentIndex - 1];
      const nextChap = projChapters[currentIndex + 1];

      chapterNavHtml = `
        <div style="display: flex; justify-content: space-between; gap: 10px; margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--border); font-family: system-ui, sans-serif; font-size: 0.85rem;">
          ${prevChap ? `<a href="${BASE_DOMAIN}/p/${projSlugClean}/${slugify(prevChap.title)}" style="color: var(--accent); font-weight: bold; text-decoration: none;">&larr; Bab Sebelumnya: ${escapeHtml(prevChap.title)}</a>` : `<span></span>`}
          ${nextChap ? `<a href="${BASE_DOMAIN}/p/${projSlugClean}/${slugify(nextChap.title)}" style="color: var(--accent); font-weight: bold; text-decoration: none;">Bab Selanjutnya: ${escapeHtml(nextChap.title)} &rarr;</a>` : `<span></span>`}
        </div>
      `;
    }

    const tocHtml = projChapters.map((c, idx) => `
      <li style="margin-bottom: 8px; font-family: system-ui, sans-serif;">
        <a href="${BASE_DOMAIN}/p/${projSlugClean}/${slugify(c.title)}" style="color: var(--accent); font-weight: 800; text-decoration: none; font-size: 0.95rem;">
          Bab ${idx + 1}: ${escapeHtml(c.title)}
        </a>
        ${c.subtitle ? `<span style="font-size: 0.85rem; opacity: 0.8; font-style: italic; margin-left: 6px;">— ${escapeHtml(c.subtitle)}</span>` : ""}
      </li>
    `).join("");

    const glossaryCardsHtml = projGlossary.map(g => `
      <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border); padding: 12px 16px; border-radius: 12px; margin-bottom: 12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
          <strong style="color: var(--accent); font-size: 1rem;">${escapeHtml(g.term)}</strong>
          <span style="font-size: 0.75rem; background: rgba(245,158,11,0.2); color: var(--accent); padding: 2px 10px; border-radius: 12px; font-family: system-ui; font-weight: 800;">${escapeHtml(g.category)}</span>
        </div>
        <div style="font-size: 0.9rem; opacity: 0.95; line-height: 1.5; font-family: system-ui;">${escapeHtml(g.definition)}</div>
        ${g.aliases ? `<div style="font-size: 0.75rem; opacity: 0.65; margin-top: 6px; font-style: italic; font-family: system-ui;">Sebutan lain: ${escapeHtml(g.aliases)}</div>` : ""}
      </div>
    `).join("");

    const jsonLdData = {
      "@context": "https://schema.org",
      "@type": "Book",
      "@id": `${projectCanonicalUrl}#book`,
      "url": canonicalUrl,
      "name": project.title,
      "headline": isFullBook ? project.title : currentChap.title,
      "genre": project.genre,
      "description": project.synopsis,
      "inLanguage": "id",
      "publisher": {
        "@type": "Organization",
        "name": "Studio Buku",
        "url": "https://studio.buku.biz.id",
        "logo": {
          "@type": "ImageObject",
          "url": "https://studio.buku.biz.id/studio-buku-logo.jpg"
        }
      },
      "author": {
        "@type": "Person",
        "name": currentChap ? currentChap.lastEditedBy || "Penulis Studio Buku" : "Penulis Studio Buku"
      },
      "hasPart": projChapters.map(c => ({
        "@type": "Chapter",
        "@id": `${BASE_DOMAIN}/p/${projSlugClean}/${slugify(c.title)}#chapter`,
        "name": c.title,
        "position": c.order,
        "description": c.subtitle || "",
        "url": `${BASE_DOMAIN}/p/${projSlugClean}/${slugify(c.title)}`
      })),
      "potentialAction": [
        {
          "@type": "DonateAction",
          "name": "Sponsori / Dukung Penulis (Investor & Donatur)",
          "target": "mailto:info@studio.buku.biz.id?subject=Sponsorship%20Naskah%20Studio%20Buku"
        },
        {
          "@type": "ReadAction",
          "target": canonicalUrl
        }
      ]
    };

    return `
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          
          <!-- SEO Core Meta Tags -->
          <title>${escapeHtml(pageTitle)}</title>
          <meta name="description" content="${escapeHtml(pageDesc)}" />
          <meta name="keywords" content="${escapeHtml(project.title)}, ${escapeHtml(project.genre)}, Naskah Buku, Studio Buku, Proposal Penulisan, Donor Buku, Investor Naskah" />
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
          <link rel="canonical" href="${canonicalUrl}" />

          <!-- OpenGraph Social Cards -->
          <meta property="og:type" content="book" />
          <meta property="og:title" content="${escapeHtml(pageTitle)}" />
          <meta property="og:description" content="${escapeHtml(pageDesc)}" />
          <meta property="og:url" content="${canonicalUrl}" />
          <meta property="og:site_name" content="Studio Buku" />
          <meta property="og:image" content="https://studio.buku.biz.id/studio-buku-logo.jpg" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:locale" content="id_ID" />

          <!-- Twitter Card Meta Tags -->
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
          <meta name="twitter:description" content="${escapeHtml(pageDesc)}" />
          <meta name="twitter:image" content="https://studio.buku.biz.id/studio-buku-logo.jpg" />

          <!-- Schema.org JSON-LD Structured Data for Google Bot Crawling -->
          <script type="application/ld+json">
            ${JSON.stringify(jsonLdData, null, 2)}
          </script>

          <style>
            :root {
              --bg: #0f172a;
              --text: #f8fafc;
              --paper: #1e293b;
              --border: #334155;
              --accent: #fbbf24;
              --accent-glow: rgba(251, 191, 36, 0.2);
            }
            body.sepia {
              --bg: #f4ecd8;
              --text: #3c2f2f;
              --paper: #fbf0d9;
              --border: #e2d3b5;
              --accent: #b45309;
              --accent-glow: rgba(180, 83, 9, 0.15);
            }
            body.light {
              --bg: #f8fafc;
              --text: #0f172a;
              --paper: #ffffff;
              --border: #e2e8f0;
              --accent: #d97706;
              --accent-glow: rgba(217, 119, 6, 0.15);
            }
            body {
              background-color: var(--bg);
              color: var(--text);
              font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
              margin: 0;
              padding: 0;
              line-height: 1.7;
              transition: all 0.3s ease;
            }
            .header-bar {
              position: sticky;
              top: 0;
              background: var(--paper);
              border-bottom: 2px solid var(--border);
              padding: 12px 24px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 0.85rem;
              z-index: 100;
              box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            }
            .controls button, .controls a {
              background: transparent;
              border: 1px solid var(--border);
              color: var(--text);
              padding: 6px 14px;
              border-radius: 20px;
              cursor: pointer;
              font-weight: 800;
              font-size: 0.75rem;
              text-decoration: none;
              display: inline-flex;
              align-items: center;
              gap: 4px;
            }
            .controls button:hover, .controls a:hover {
              border-color: var(--accent);
              color: var(--accent);
            }
            .academic-sponsor-banner {
              background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%);
              border: 2px solid var(--accent);
              border-radius: 16px;
              padding: 20px 24px;
              margin-bottom: 30px;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .glossary-link {
              background-color: var(--accent-glow);
              border-bottom: 2px solid var(--accent);
              color: inherit;
              font-weight: 800;
              padding: 0 4px;
              border-radius: 4px;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .glossary-link:hover {
              background-color: var(--accent);
              color: #0f172a;
            }
            .container {
              max-width: 820px;
              margin: 40px auto;
              padding: 45px 36px;
              background-color: var(--paper);
              border-radius: 20px;
              border: 1px solid var(--border);
              box-shadow: 0 15px 35px rgba(0,0,0,0.25);
            }
            .project-title {
              font-size: 2.2rem;
              font-weight: 900;
              color: var(--accent);
              margin-bottom: 6px;
              line-height: 1.25;
            }
            .subtitle {
              font-size: 1.15rem;
              font-style: italic;
              opacity: 0.85;
              margin-bottom: 20px;
            }
            .meta-info {
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 0.85rem;
              opacity: 0.8;
              border-bottom: 1px solid var(--border);
              padding-bottom: 18px;
              margin-bottom: 30px;
              display: flex;
              flex-wrap: wrap;
              gap: 16px;
            }
            .toc-box {
              background: rgba(0,0,0,0.2);
              border: 1px dashed var(--accent);
              padding: 20px 24px;
              border-radius: 14px;
              margin-bottom: 35px;
            }
            .modal-overlay {
              display: none;
              position: fixed;
              inset: 0;
              background: rgba(0,0,0,0.8);
              backdrop-filter: blur(6px);
              z-index: 200;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .modal-box {
              background: var(--paper);
              border: 2px solid var(--accent);
              border-radius: 20px;
              max-width: 520px;
              width: 100%;
              padding: 28px;
              box-shadow: 0 25px 50px rgba(0,0,0,0.5);
              font-family: system-ui, -apple-system, sans-serif;
            }
            .footer {
              margin-top: 60px;
              padding-top: 24px;
              border-top: 1px solid var(--border);
              text-align: center;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 0.85rem;
              opacity: 0.8;
              line-height: 1.6;
            }
            @media print {
              .header-bar, .academic-sponsor-banner, .controls { display: none; }
              .container { border: none; box-shadow: none; background: white; color: black; max-width: 100%; margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body class="dark">
          <!-- Header Bar -->
          <div class="header-bar">
            <div style="font-weight: 900; font-size: 0.95rem; color: var(--accent);">
              <a href="${projectCanonicalUrl}" style="color: inherit; text-decoration: none;">📚 Studio Buku</a> — ${escapeHtml(project.title)}
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
            <!-- Banner Khusus Akademisi, Investor & Donatur -->
            <div class="academic-sponsor-banner" id="sponsor">
              <div style="font-size:0.75rem; text-transform:uppercase; font-weight:900; color:var(--accent); letter-spacing:0.05em; margin-bottom:4px;">
                🎓 Ruang Peninjauan Akademisi, Investor & Donatur Naskah
              </div>
              <h2 style="font-size:1.25rem; font-weight:900; margin:0 0 6px 0; color:var(--text);">
                ${escapeHtml(project.title)}
              </h2>
              <p style="font-size:0.88rem; opacity:0.9; margin:0 0 16px 0; line-height:1.5; font-family:system-ui;">
                ${escapeHtml(project.synopsis)}
              </p>
              <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center; font-family:system-ui;">
                <a href="mailto:info@studio.buku.biz.id?subject=Kontak%20Penulis%20Naskah%20${encodeURIComponent(project.title)}" 
                   style="background:rgba(255,255,255,0.12); color:var(--text); padding:8px 18px; border-radius:20px; font-weight:800; text-decoration:none; font-size:0.8rem; border:1px solid var(--border);">
                   ✉️ Kontak Penulis
                </a>
                <button onclick="openQrisModal()" 
                   style="background:var(--accent); color:#0f172a; border:none; padding:8px 18px; border-radius:20px; font-weight:900; font-size:0.8rem; cursor:pointer; shadow:0 4px 12px rgba(0,0,0,0.2);">
                   💸 Donasi QRIS DANA
                </button>
                <a href="${projectCanonicalUrl}" 
                   style="background:rgba(255,255,255,0.1); color:var(--text); padding:8px 18px; border-radius:20px; font-weight:800; text-decoration:none; font-size:0.8rem; border:1px solid var(--border);">
                   📖 Lihat Seluruh Draf Bab (${projChapters.length} Bab)
                </a>
              </div>
            </div>

            <!-- Main Document Title -->
            <h1 class="project-title">${isFullBook ? escapeHtml(project.title) : escapeHtml(currentChap.title)}</h1>
            ${!isFullBook && currentChap.subtitle ? `<div class="subtitle">${escapeHtml(currentChap.subtitle)}</div>` : ""}
            ${isFullBook && project.subtitle ? `<div class="subtitle">${escapeHtml(project.subtitle)}</div>` : ""}

            <div class="meta-info">
              <span>📚 <strong>Naskah:</strong> ${escapeHtml(project.title)}</span>
              <span>🏷️ <strong>Genre:</strong> ${escapeHtml(project.genre)}</span>
              <span>📝 <strong>Volume:</strong> ${wordCount.toLocaleString("id-ID")} Kata</span>
              <span>⏱️ <strong>Estimasi Baca:</strong> ~${readTime} menit</span>
              <span>✍️ <strong>Penulis:</strong> ${escapeHtml(currentChap ? currentChap.lastEditedBy : "Studio Buku")}</span>
            </div>

            <!-- Table of Contents for Full Book view -->
            ${isFullBook ? `
              <div class="toc-box">
                <h3 style="margin:0 0 12px 0; font-size:1.1rem; color:var(--accent); font-family:system-ui; font-weight:900;">📋 Daftar Isi Naskah</h3>
                <ol style="margin:0; padding-left:20px;">
                  ${tocHtml}
                </ol>
              </div>
            ` : ""}

            <div style="background: var(--accent-glow); border-left: 4px solid var(--accent); padding: 12px 18px; font-family: system-ui, sans-serif; font-size: 0.85rem; margin-bottom: 30px; border-radius: 8px;">
              💡 <strong>Petunjuk Peninjau / Pembaca:</strong> Nama tokoh atau istilah bergaris bawah (<span class="glossary-link">seperti ini</span>) dapat diklik untuk membuka penjelasan Glosarium Naskah dari penulis.
            </div>

            <!-- Chapter Content Body -->
            <div class="content">
              ${contentHtml}
            </div>

            <!-- Single Chapter Navigation -->
            ${chapterNavHtml}

            <!-- Footer -->
            <div class="footer">
              <strong style="color:var(--accent);">Hak cipta milik : masing masing user penulisnya, Nulis Buku Bareng di <a href="https://Studio.Buku.Biz.ID" target="_blank" style="color:var(--accent); text-decoration:underline;">https://Studio.Buku.Biz.ID</a></strong><br/>
              Seluruh hak cipta dilindungi undang-undang.
            </div>
          </div>

          <!-- GLOSSARY CARD POPUP MODAL -->
          <div id="glossary-modal" class="modal-overlay" onclick="closeGlossaryModal()">
            <div class="modal-box" onclick="event.stopPropagation()">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
                <div>
                  <span id="modal-category" style="background: rgba(245,158,11,0.2); color: var(--accent); padding: 3px 12px; border-radius: 12px; font-size: 0.75rem; font-weight: 800;">Kategori</span>
                  <h3 id="modal-term" style="font-size: 1.5rem; margin: 8px 0 0 0; color: var(--accent); font-weight: 900;">Nama Istilah</h3>
                </div>
                <button onclick="closeGlossaryModal()" style="background:none; border:none; color:var(--text); font-size: 1.3rem; cursor:pointer; font-weight:bold;">✕</button>
              </div>

              <div id="modal-definition" style="font-size: 1rem; line-height: 1.6; margin-bottom: 18px; opacity: 0.95;">
                Definisi istilah...
              </div>

              <div id="modal-aliases" style="font-size: 0.85rem; opacity: 0.7; font-style: italic; border-top: 1px solid var(--border); padding-top: 12px;">
              </div>
            </div>
          </div>

          <!-- FULL GLOSSARY DRAWER MODAL -->
          <div id="full-glossary-modal" class="modal-overlay" onclick="closeFullGlossaryDrawer()">
            <div class="modal-box" style="max-width: 620px; max-height: 80vh; overflow-y: auto;" onclick="event.stopPropagation()">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--border); padding-bottom: 14px; margin-bottom: 18px;">
                <h3 style="margin:0; font-size: 1.3rem; color: var(--accent); font-weight: 900;">📖 Glosarium Naskah (${projGlossary.length} Istilah)</h3>
                <button onclick="closeFullGlossaryDrawer()" style="background:none; border:none; color:var(--text); font-size: 1.3rem; cursor:pointer; font-weight:bold;">✕</button>
              </div>

              <div style="margin-bottom: 15px;">
                ${glossaryCardsHtml.length > 0 ? glossaryCardsHtml : '<div style="opacity:0.7; font-size:0.9rem;">Belum ada istilah glosarium yang ditambahkan untuk proyek ini.</div>'}
              </div>
            </div>
          </div>

          <!-- QRIS DANA DONATION MODAL -->
          <div id="qris-modal" class="modal-overlay" onclick="closeQrisModal()">
            <div class="modal-box" style="text-align: center; max-width: 440px;" onclick="event.stopPropagation()">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span style="background: rgba(245,158,11,0.2); color: var(--accent); padding: 4px 12px; border-radius: 12px; font-size: 0.75rem; font-weight: 800;">
                  💸 Donasi QRIS DANA Studio.Buku.Biz.ID
                </span>
                <button onclick="closeQrisModal()" style="background:none; border:none; color:var(--text); font-size: 1.3rem; cursor:pointer; font-weight:bold;">✕</button>
              </div>

              <h3 style="margin: 8px 0; color: var(--accent); font-size: 1.2rem;">Dukung Penulis & Proyek Naskah</h3>
              <p style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 16px; font-family: system-ui, sans-serif; line-height: 1.5;">
                Pindai / Scan QRIS DANA di bawah ini menggunakan aplikasi <strong>DANA, GoPay, OVO, ShopeePay, BCA, Mandiri, BRI, BNI</strong> atau m-banking / e-wallet lainnya.
              </p>

              <div style="background: white; padding: 12px; border-radius: 14px; border: 2px solid var(--accent); display: inline-block; margin-bottom: 16px;">
                <img src="/QRIS-DANA.jpeg" alt="QRIS DANA Studio.Buku.Biz.ID" style="max-width: 240px; width: 100%; height: auto; border-radius: 8px; display: block;" />
              </div>

              <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border); padding: 10px 14px; border-radius: 10px; font-size: 0.8rem; font-family: system-ui, sans-serif;">
                <strong style="color: var(--accent);">Penerima QRIS DANA: Studio.Buku.Biz.ID</strong><br/>
                <span style="opacity: 0.8; font-size: 0.75rem;">Terima kasih atas donasi & dukungan Anda untuk keberlangsungan penulisan karya ini!</span>
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

            function openQrisModal() {
              document.getElementById('qris-modal').style.display = 'flex';
            }

            function closeQrisModal() {
              document.getElementById('qris-modal').style.display = 'none';
            }
          </script>
        </body>
      </html>
    `;
  }

  function sanitizeManuscriptExcerpt(rawText: string, maxChars: number): string {
    if (!rawText || !rawText.trim()) return "Kisah dan narasi bermakna terukir indah dalam setiap bab naskah ini.";

    // 1. Remove [[ HEADER ]] tags, --- Author Notes ---, HTML tags, and Markdown symbols
    let cleaned = rawText
      .replace(/\[\[[\s\S]*?\]\]/g, "")
      .replace(/---[\s\S]*?$/g, "")
      .replace(/<[^>]*>?/gm, "")
      .replace(/[*_~`#]/g, "");

    // 2. Strip unwanted non-alphanumeric artifacts except standard Indonesian punctuation
    cleaned = cleaned
      .replace(/[^\w\s\d.,!?'"\-—–“”‘’()]/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) return "Kisah dan narasi bermakna terukir indah dalam setiap bab naskah ini.";

    if (cleaned.length <= maxChars) {
      return cleaned;
    }

    // Trim at word boundary
    let truncated = cleaned.substring(0, maxChars);
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > maxChars * 0.7) {
      truncated = truncated.substring(0, lastSpace);
    }
    return truncated.trim() + "...";
  }

  function renderFrontpageServerHtml(db: DB, pageNum: number = 1): string {
    const publicProjects = (db.projects || []).filter(p => !p.isPrivate);
    const limit = 12;
    const totalProjects = publicProjects.length;
    const totalPages = Math.max(1, Math.ceil(totalProjects / limit));
    const validPage = Math.min(Math.max(1, pageNum), totalPages);
    const startIndex = (validPage - 1) * limit;

    const paginatedProjects = publicProjects.slice(startIndex, startIndex + limit);

    const jsonLdItems = paginatedProjects.map((p, index) => {
      const projSlug = slugify(p.title);
      const pChapters = (db.chapters || []).filter(c => c.projectId === p.id);
      const wordCount = pChapters.reduce((acc, c) => acc + (c.content ? c.content.split(/\s+/).length : 0), 0);

      return {
        "@type": "ListItem",
        "position": startIndex + index + 1,
        "item": {
          "@type": "Book",
          "@id": `https://studio.buku.biz.id/p/${projSlug}`,
          "name": p.title,
          "alternateName": p.subtitle || "",
          "genre": p.genre || "Fiksi / Non-Fiksi",
          "description": p.synopsis || "Naskah terpublikasi di Studio Buku.",
          "url": `https://studio.buku.biz.id/p/${projSlug}`,
          "author": {
            "@type": "Person",
            "name": p.ownerName || "Penulis Studio Buku"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Studio Buku",
            "url": "https://studio.buku.biz.id"
          },
          "numberOfPages": pChapters.length,
          "wordCount": wordCount,
          "inLanguage": "id-ID"
        }
      };
    });

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Studio Buku - Galeri Naskah & Karya Kolaboratif",
      "description": "Platform penulisan & penerbitan naskah kolaboratif. Akses galeri naskah publik, novel, dan jurnal akademis karya penulis Indonesia secara gratis.",
      "url": `https://studio.buku.biz.id${validPage > 1 ? `/?page=${validPage}` : ''}`,
      "publisher": {
        "@type": "Organization",
        "name": "Studio Buku",
        "url": "https://studio.buku.biz.id",
        "logo": "https://studio.buku.biz.id/studio-buku-logo.jpg"
      },
      "mainEntity": {
        "@type": "ItemList",
        "numberOfItems": paginatedProjects.length,
        "itemListElement": jsonLdItems
      }
    };

    const bentoCardStyles = [
      {
        cardBg: "background: linear-gradient(135deg, #0D9488 0%, #0077B6 50%, #03045E 100%); color: #ffffff; border: 1px solid rgba(94, 234, 212, 0.4);",
        titleColor: "#ffffff",
        subColor: "rgba(204, 251, 241, 0.9)",
        synopsisColor: "rgba(255, 255, 255, 0.8)",
        metaColor: "rgba(253, 230, 138, 0.95)",
        btnStyle: "background: #fbbf24; color: #020617; font-weight: 900; border-radius: 9999px;"
      },
      {
        cardBg: "background: linear-gradient(135deg, #FFB300 0%, #F57C00 50%, #E65100 100%); color: #020617; border: 1px solid rgba(251, 191, 36, 0.6);",
        titleColor: "#020617",
        subColor: "rgba(2, 6, 23, 0.9)",
        synopsisColor: "rgba(2, 6, 23, 0.85)",
        metaColor: "#020617",
        btnStyle: "background: #020617; color: #fcd34d; font-weight: 900; border-radius: 9999px;"
      },
      {
        cardBg: "background: linear-gradient(135deg, #D81B60 0%, #C2185B 50%, #880E4F 100%); color: #ffffff; border: 1px solid rgba(244, 114, 182, 0.4);",
        titleColor: "#ffffff",
        subColor: "rgba(252, 231, 243, 0.9)",
        synopsisColor: "rgba(255, 255, 255, 0.75)",
        metaColor: "rgba(253, 230, 138, 0.95)",
        btnStyle: "background: #fbbf24; color: #020617; font-weight: 900; border-radius: 9999px;"
      },
      {
        cardBg: "background: linear-gradient(135deg, #7E22CE 0%, #4A148C 50%, #280659 100%); color: #ffffff; border: 1px solid rgba(192, 132, 252, 0.4);",
        titleColor: "#ffffff",
        subColor: "rgba(233, 213, 255, 0.9)",
        synopsisColor: "rgba(255, 255, 255, 0.75)",
        metaColor: "rgba(251, 207, 232, 0.95)",
        btnStyle: "background: #ec4899; color: #ffffff; font-weight: 900; border-radius: 9999px;"
      },
      {
        cardBg: "background: linear-gradient(135deg, #1E88E5 0%, #1565C0 50%, #0D47A1 100%); color: #ffffff; border: 1px solid rgba(96, 165, 250, 0.4);",
        titleColor: "#ffffff",
        subColor: "rgba(219, 234, 254, 0.9)",
        synopsisColor: "rgba(255, 255, 255, 0.75)",
        metaColor: "rgba(253, 230, 138, 0.95)",
        btnStyle: "background: #fbbf24; color: #020617; font-weight: 900; border-radius: 9999px;"
      },
      {
        cardBg: "background: linear-gradient(135deg, #FFF9C4 0%, #FFF176 50%, #FBC02D 100%); color: #0f172a; border: 1px solid #fcd34d;",
        titleColor: "#0f172a",
        subColor: "rgba(15, 23, 42, 0.9)",
        synopsisColor: "rgba(15, 23, 42, 0.85)",
        metaColor: "#0f172a",
        btnStyle: "background: #280540; color: #fcd34d; font-weight: 900; border-radius: 9999px;"
      }
    ];

    const getCardSpanClassSsr = (index: number) => {
      if (index === 0) return "md:col-span-2 lg:col-span-2 md:row-span-2";
      if (index === 3) return "md:col-span-2 lg:col-span-2";
      if (index === 8) return "md:col-span-2 lg:col-span-2";
      return "col-span-1";
    };

    const projectCardsHtml = paginatedProjects.map((p, idx) => {
      const projSlug = slugify(p.title);
      const pChapters = (db.chapters || []).filter(c => c.projectId === p.id);
      const totalWords = pChapters.reduce((sum, c) => sum + (c.content ? c.content.split(/\s+/).length : 0), 0);
      const authorName = p.ownerName || "Penulis Studio";
      const theme = bentoCardStyles[idx % bentoCardStyles.length];
      const spanClass = getCardSpanClassSsr(idx);

      const isFeaturedCard = idx === 0;
      const isWideCard = idx === 3 || idx === 8;

      const titleFontSizeClass = isFeaturedCard
        ? "text-2xl md:text-3xl font-extrabold"
        : isWideCard
        ? "text-lg sm:text-xl font-bold"
        : "text-base sm:text-lg font-bold";

      const excerptFontSizeClass = isFeaturedCard
        ? "text-sm md:text-base leading-relaxed"
        : isWideCard
        ? "text-xs sm:text-sm leading-relaxed"
        : "text-xs leading-relaxed";

      const subtitleFontSizeClass = isFeaturedCard
        ? "text-xs sm:text-sm"
        : "text-xs";

      const coverSeedUrl = `https://picsum.photos/seed/buku-${p.id}/400/600`;
      const initials = (authorName || "PS")
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

      const maxExcerptChars = isFeaturedCard ? 360 : isWideCard ? 200 : 110;
      const rawExcerptSource = pChapters[0]?.content || p.synopsis || "";
      const manuscriptExcerpt = sanitizeManuscriptExcerpt(rawExcerptSource, maxExcerptChars);

      const avatarColors = [
        "background: #fbbf24; color: #020617;",
        "background: #ec4899; color: #ffffff;",
        "background: #3b82f6; color: #ffffff;",
        "background: #34d399; color: #020617;",
        "background: #c084fc; color: #020617;",
        "background: #fb7185; color: #020617;"
      ];
      const avatarStyle = avatarColors[idx % avatarColors.length];

      return `
        <article class="${spanClass} rounded-3xl overflow-hidden shadow-2xl transition flex flex-col sm:flex-row border border-white/10" id="card-${p.id}" style="${theme.cardBg}">
          <!-- Side Book Cover Strip (~38% Width) -->
          <div class="relative w-full sm:w-[38%] shrink-0 min-h-[170px] sm:min-h-full overflow-hidden bg-slate-950">
            <img src="${coverSeedUrl}" alt="${escapeHtml(p.title)}" class="w-full h-full object-cover opacity-85" loading="lazy" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20"></div>
            
            <!-- GLASSMORPHISM GENRE BADGE -->
            <div class="absolute top-3 left-3">
              <span class="bg-slate-950/85 backdrop-blur-md text-amber-300 text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border border-amber-300/40 shadow-xl">
                ${escapeHtml(p.genre || "Fiksi")}
              </span>
            </div>

            <div class="absolute bottom-3 left-3 text-[10px] font-bold text-white/90 flex items-center space-x-1">
              <span>📚 Studio Buku</span>
            </div>
          </div>

          <!-- Content Panel -->
          <div class="p-6 space-y-3.5 flex-1 flex flex-col justify-between">
            <div class="space-y-2">
              <!-- Author Branding -->
              <div class="flex items-center space-x-2 mb-1">
                <div class="w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] shadow-sm shrink-0" style="${avatarStyle}">
                  ${initials}
                </div>
                <span class="text-xs font-bold truncate" style="color: ${theme.titleColor};">${escapeHtml(authorName)}</span>
                <span class="text-xs shrink-0" title="Penulis Studio Buku">✍️</span>
              </div>

              <!-- Title with Dynamic Font Scaling -->
              <h2 class="${titleFontSizeClass} leading-snug tracking-tight">
                <a href="/p/${projSlug}" style="color: ${theme.titleColor}; text-decoration: none;">${escapeHtml(p.title)}</a>
              </h2>

              ${p.subtitle ? `<p class="${subtitleFontSizeClass} font-serif italic line-clamp-1" style="color: ${theme.subColor};">${escapeHtml(p.subtitle)}</p>` : ''}

              <!-- Editorial Text Excerpt in Quotation Marks -->
              <blockquote class="${excerptFontSizeClass} font-serif italic pl-2.5 my-1.5" style="border-left: 2px solid rgba(251, 191, 36, 0.6); color: ${theme.synopsisColor};">
                “${escapeHtml(manuscriptExcerpt)}”
              </blockquote>
            </div>

            <!-- Metadata & Pill Button -->
            <div class="pt-3 border-t border-black/10 sm:border-white/15 space-y-3 mt-3">
              <div class="flex items-center justify-between text-[11px] font-bold" style="color: ${theme.metaColor};">
                <span>${pChapters.length} Bab Terbit</span>
                <span aria-hidden="true">·</span>
                <span>${totalWords.toLocaleString('id-ID')} Kata</span>
              </div>

              <a href="/p/${projSlug}" class="w-full py-2.5 px-4 text-xs flex items-center justify-center space-x-2 transition text-center text-decoration-none shadow-lg font-black" style="${theme.btnStyle}">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                <span>Baca Naskah</span>
              </a>
            </div>
          </div>
        </article>
      `;
    }).join("\n");

    const prevPageHref = validPage > 2 ? `/?page=${validPage - 1}` : "/";
    const nextPageHref = `/?page=${Math.min(totalPages, validPage + 1)}`;

    const pageNumbersHtml = Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => {
      const href = pNum === 1 ? "/" : `/?page=${pNum}`;
      const isActive = pNum === validPage;
      return `<a href="${href}" class="px-4 py-2 rounded-2xl text-xs font-black transition ${isActive ? 'bg-amber-400 text-slate-950 shadow-lg' : 'bg-[#180228] text-purple-200 hover:bg-purple-800/60 border border-purple-600/40'}">${pNum}</a>`;
    }).join(" ");

    const paginationNavHtml = `
      <nav aria-label="Paginasi Naskah" class="bg-[#290542] border border-purple-600/40 rounded-3xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="text-xs text-purple-200/90 font-medium">
          Menampilkan <span class="font-bold text-amber-300">${startIndex + 1}</span> - <span class="font-bold text-amber-300">${Math.min(startIndex + limit, totalProjects)}</span> dari <span class="font-bold text-amber-300">${totalProjects}</span> Naskah Terpublikasi
        </div>
        <div class="flex items-center space-x-1.5">
          <!-- Panah Ke Kiri (Left Arrow) -->
          <a href="${prevPageHref}" className="p-2.5 rounded-2xl border border-purple-600/50 bg-[#180228] text-purple-100 hover:bg-purple-800/60 transition ${validPage === 1 ? 'opacity-40 pointer-events-none' : ''}" aria-label="Halaman Sebelumnya" style="padding: 8px 14px; font-weight: bold; border-radius: 16px; border: 1px solid rgba(147, 51, 234, 0.4); background: #180228; color: #f3e8ff; text-decoration: none;">
            &larr;
          </a>

          <!-- Angka Angka Paginasi -->
          ${pageNumbersHtml}

          <!-- Panah Ke Kanan (Right Arrow) -->
          <a href="${nextPageHref}" className="p-2.5 rounded-2xl border border-purple-600/50 bg-[#180228] text-purple-100 hover:bg-purple-800/60 transition ${validPage === totalPages ? 'opacity-40 pointer-events-none' : ''}" aria-label="Halaman Selanjutnya" style="padding: 8px 14px; font-weight: bold; border-radius: 16px; border: 1px solid rgba(147, 51, 234, 0.4); background: #180228; color: #f3e8ff; text-decoration: none;">
            &rarr;
          </a>
        </div>
      </nav>
    `;

    return `<!doctype html>
<html lang="id">
  <head>
    <script>window.__DEFINES__ = window.__DEFINES__ || {};</script>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Studio Buku – Galeri Naskah & Karya Kolaboratif ${validPage > 1 ? `(Halaman ${validPage})` : ''}</title>
    <meta name="description" content="Studio Buku: Platform penulisan dan penerbitan naskah kolaboratif. Jelajahi puluhan naskah novel, jurnal akademis, dan fiksi/non-fiksi karya penulis Indonesia." />
    <link rel="canonical" href="https://studio.buku.biz.id${validPage > 1 ? `/?page=${validPage}` : ''}" />
    ${validPage > 1 ? `<link rel="prev" href="https://studio.buku.biz.id${validPage === 2 ? '' : `/?page=${validPage - 1}`}" />` : ''}
    ${validPage < totalPages ? `<link rel="next" href="https://studio.buku.biz.id/?page=${validPage + 1}" />` : ''}

    <!-- OpenGraph Tags -->
    <meta property="og:title" content="Studio Buku – Galeri Naskah & Karya Kolaboratif" />
    <meta property="og:description" content="Jelajahi puluhan naskah novel, jurnal akademis, dan karya fiksi/non-fiksi terpublikasi karya para penulis di Studio Buku." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://studio.buku.biz.id${validPage > 1 ? `/?page=${validPage}` : ''}" />
    <meta property="og:site_name" content="Studio Buku" />
    <meta property="og:image" content="https://studio.buku.biz.id/studio-buku-logo.jpg" />

    <!-- Schema.org JSON-LD Structured Data for Googlebot -->
    <script type="application/ld+json">
      ${JSON.stringify(jsonLd, null, 2)}
    </script>

    <!-- Tailwind CSS Standard CDN for Pre-rendered HTML SSR -->
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-[#1f0330] text-slate-100 font-sans">
    <div id="root">
      <div class="min-h-screen bg-[#1f0330] text-slate-100 flex flex-col font-sans">
        <!-- HEADER -->
        <header class="sticky top-0 z-40 bg-[#160226]/85 backdrop-blur-md border-b border-purple-800/40 px-4 sm:px-8 py-3.5 shadow-2xl">
          <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <a href="/" class="flex items-center space-x-2.5 text-xl sm:text-2xl font-black text-white tracking-tight hover:opacity-90 transition">
              <img src="/studio-buku-logo-box-100.jpg" alt="Studio Buku" class="w-9 h-9 rounded-xl object-cover border border-amber-400" onError="this.style.display='none'" />
              <span>Studio Buku</span>
            </a>
            <div class="flex items-center space-x-3">
              <button class="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black px-5 py-2.5 rounded-full text-xs transition shadow-lg shadow-amber-500/20">
                Masuk Penulis
              </button>
            </div>
          </div>
        </header>

        <!-- MAIN BODY -->
        <main class="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
          <!-- CARDS BENTO GRID WITH INTEGRATED HERO CARD & DENSE AUTO-PACKING -->
          <section class="space-y-6">
            <div class="flex items-center justify-between">
              <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">
                Naskah Terbaru :
              </h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 grid-flow-dense auto-rows-fr">
              ${validPage === 1 ? `
                <!-- INTEGRATED FEATURED HERO CARD (CARD #0) ON PAGE 1 -->
                <div class="md:col-span-2 lg:col-span-2 bg-gradient-to-r from-[#3b0854] via-[#2d0542] to-[#1e022b] border border-purple-500/30 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-4 shadow-2xl relative overflow-hidden">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="bg-pink-600/30 border border-pink-400/40 text-pink-200 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center space-x-1.5">
                      <span>PROGRAM PENULISAN & CO-AUTHORSHIP</span>
                    </span>
                    <span class="bg-amber-400/20 border border-amber-400/40 text-amber-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      ${totalProjects} NASKAH TERPUBLIKASI
                    </span>
                  </div>

                  <div class="space-y-2">
                    <h1 class="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                      Katalog Naskah, Ruang Kerja Penulis & Galeri Karya Terbuka
                    </h1>
                    <p class="text-purple-200/90 text-xs sm:text-sm leading-relaxed font-medium">
                      Selamat datang di Studio Buku — wadah penulisan dan penerbitan naskah kolaboratif.
                    </p>
                  </div>

                  <div class="pt-3 border-t border-purple-500/20 flex items-center justify-between text-xs text-purple-300 font-bold">
                    <span>Co-Authorship Penulisan Buku</span>
                    <span class="text-amber-400 font-black">Studio Buku • 2026</span>
                  </div>
                </div>
              ` : ''}

              ${projectCardsHtml}
            </div>

            <!-- Crawlable Pagination Links for Search Crawlers -->
            ${paginationNavHtml}
          </section>
        </main>

        <!-- FOOTER -->
        <footer class="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 space-y-3 font-sans">
          <div class="flex flex-wrap items-center justify-center gap-4 text-slate-600 font-medium">
            <a href="/terms" class="hover:text-amber-600 transition">Syarat & Ketentuan</a>
            <span>•</span>
            <a href="/privacy" class="hover:text-amber-600 transition">Kebijakan Privasi</a>
            <span>•</span>
            <a href="/pricing" class="hover:text-amber-600 transition">Biaya & Donasi</a>
          </div>
          <p class="font-semibold text-slate-700">
            Studio Buku • Hak Cipta 2026 Studio.Buku.Biz.ID
          </p>
          <p class="text-[11px] text-slate-400">Platform Penulisan Buku Kolaboratif Indonesia</p>
        </footer>
      </div>
    </div>

    <!-- React SPA Entry point -->
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
  }

  // ROOT FRONTPAGE SEO ENDPOINT
  app.get("/", async (req, res, next) => {
    // If request asks for html
    if (req.headers.accept?.includes("text/html") || req.headers.accept === "*/*" || !req.headers.accept) {
      const db = readDb();
      const pageNum = parseInt(req.query.page as string, 10) || 1;
      let html = renderFrontpageServerHtml(db, pageNum);
      if (vite) {
        try {
          html = await vite.transformIndexHtml(req.url, html);
        } catch (err) {
          console.warn("Vite transformIndexHtml warning:", err);
        }
      }
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(html);
    }
    next();
  });

  // 1. PUBLIC SEO DOMAIN ENDPOINTS: https://studio.buku.biz/p/:projectSlug/:chapterSlug
  app.get("/p/:projectSlug/:chapterSlug", (req, res) => {
    const db = readDb();
    const html = renderPublicPreviewHtml(db, req.params.projectSlug, req.params.chapterSlug);
    res.send(html);
  });

  app.get("/buku/:projectSlug/:chapterSlug", (req, res) => {
    const db = readDb();
    const html = renderPublicPreviewHtml(db, req.params.projectSlug, req.params.chapterSlug);
    res.send(html);
  });

  // 2. PUBLIC SEO DOMAIN ENDPOINTS FOR FULL BOOK: https://studio.buku.biz/p/:projectSlug
  app.get("/p/:projectSlug", (req, res) => {
    const db = readDb();
    const html = renderPublicPreviewHtml(db, req.params.projectSlug);
    res.send(html);
  });

  app.get("/buku/:projectSlug", (req, res) => {
    const db = readDb();
    const html = renderPublicPreviewHtml(db, req.params.projectSlug);
    res.send(html);
  });

  // 3. LEGACY ENDPOINTS WITH REDIRECT / CANONICAL MATCHING
  app.get("/public/chapter/:chapterId", (req, res) => {
    const db = readDb();
    const chapter = db.chapters.find(c => c.id === req.params.chapterId);
    if (!chapter) {
      return res.status(404).send("<h1>404 - Bab Tidak Ditemukan</h1>");
    }
    const project = db.projects.find(p => p.id === chapter.projectId) || db.projects[0];
    const projSlug = slugify(project.title);
    const chapSlug = slugify(chapter.title);

    const html = renderPublicPreviewHtml(db, projSlug, chapSlug);
    res.send(html);
  });

  app.get("/public/project/:projectId", (req, res) => {
    const db = readDb();
    const project = db.projects.find(p => p.id === req.params.projectId) || db.projects[0];
    const projSlug = slugify(project.title);

    const html = renderPublicPreviewHtml(db, projSlug);
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
      const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
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
  // Firebase Auth Handler Proxy for Custom Domain studio.buku.biz.id
  app.use("/__/auth", async (req, res) => {
    try {
      const targetUrl = `https://gen-lang-client-0987418952.firebaseapp.com/__/auth${req.url}`;
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          "user-agent": req.headers["user-agent"] || "",
          "accept": req.headers["accept"] || "*/*"
        }
      });
      const contentType = response.headers.get("content-type");
      if (contentType) res.setHeader("content-type", contentType);
      const body = await response.text();
      res.status(response.status).send(body);
    } catch (err: any) {
      res.status(500).send("Firebase Auth Proxy Error: " + err?.message);
    }
  });

  // Serve static assets including QRIS-DANA.jpeg
  app.get("/QRIS-DANA.jpeg", (req, res) => {
    res.sendFile(path.join(process.cwd(), "QRIS-DANA.jpeg"));
  });

  // Dynamic XML Sitemap Endpoint for Googlebot & Search Engines
  app.get("/sitemap.xml", (req, res) => {
    try {
      const db = readDb();
      const baseUrl = "https://studio.buku.biz.id";
      const publicProjects = (db.projects || []).filter(p => !p.isPrivate);

      const totalPages = Math.max(1, Math.ceil(publicProjects.length / 12));
      const staticPages = [
        { url: `${baseUrl}/`, priority: "1.0", changefreq: "daily" },
        ...Array.from({ length: totalPages - 1 }, (_, i) => ({
          url: `${baseUrl}/?page=${i + 2}`,
          priority: "0.9",
          changefreq: "daily"
        })),
        { url: `${baseUrl}/pricing`, priority: "0.8", changefreq: "weekly" },
        { url: `${baseUrl}/terms`, priority: "0.5", changefreq: "monthly" },
        { url: `${baseUrl}/privacy`, priority: "0.5", changefreq: "monthly" },
      ];

      const projectUrls: string[] = [];

      publicProjects.forEach(p => {
        const projSlug = slugify(p.title);
        const pChapters = (db.chapters || []).filter(c => c.projectId === p.id);
        const lastModDate = new Date((p as any).updatedAt || p.createdAt || Date.now()).toISOString().split("T")[0];

        // Main project detail URL
        projectUrls.push(`
  <url>
    <loc>${baseUrl}/p/${projSlug}</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`);

        // Individual chapter URLs
        pChapters.forEach(c => {
          const chapSlug = slugify(c.title);
          const chapLastMod = new Date(c.updatedAt || (c as any).createdAt || Date.now()).toISOString().split("T")[0];
          projectUrls.push(`
  <url>
    <loc>${baseUrl}/p/${projSlug}/${chapSlug}</loc>
    <lastmod>${chapLastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
        });
      });

      const staticUrlsXml = staticPages.map(page => `
  <url>
    <loc>${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join("");

      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrlsXml}${projectUrls.join("")}
</urlset>`;

      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(sitemapXml);
    } catch (err: any) {
      console.error("Error generating sitemap.xml:", err);
      res.status(500).send("Error generating sitemap");
    }
  });

  // Dynamic robots.txt Endpoint referencing Sitemap
  app.get("/robots.txt", (req, res) => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(`User-agent: *
Allow: /

Sitemap: https://studio.buku.biz.id/sitemap.xml
`);
  });

  app.use(express.static(process.cwd()));

  // Privacy Policy Route (Google Auth & AdSense Compliant - Light Corporate)
  app.get("/privacy", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Kebijakan Privasi - Studio Buku</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-50 text-slate-900 font-sans min-h-screen flex flex-col justify-between">
          <!-- NORMAL FRONTPAGE HEADER -->
          <header class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-sm">
            <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <a href="/" class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight hover:text-amber-600 transition">
                Studio Buku
              </a>
              <div class="flex items-center space-x-3">
                <a href="/" class="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-5 py-2 rounded-full text-xs transition shadow-sm">
                  Login
                </a>
              </div>
            </div>
          </header>

          <main class="max-w-4xl mx-auto w-full px-4 py-10 sm:py-12 space-y-8 flex-1">
            <div class="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
              <h1 class="text-3xl sm:text-4xl font-black text-slate-900">Kebijakan Privasi Studio Buku</h1>
              <p class="text-xs text-slate-500 font-bold">Terakhir diperbarui: 1 Oktober 2026</p>
              
              <p class="text-sm text-slate-600 leading-relaxed">
                Studio Buku (<strong>studio.buku.biz.id</strong>) berkomitmen untuk melindungi privasi dan keamanan data pengguna, penulis, dan pengunjung situs kami. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda sesuai dengan standar Google Authentication Policy dan Google AdSense Policy.
              </p>

              <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">1. Pengumpulkan Informasi & Otentikasi Google</h2>
              <p class="text-sm text-slate-600 leading-relaxed">
                Saat Anda menggunakan Studio Buku dan masuk menggunakan fitur <strong>Google Sign-In</strong>, kami mengumpulkan informasi profil dasar berikut:
              </p>
              <ul class="list-disc list-inside text-sm text-slate-600 space-y-1 pl-2">
                <li>Nama lengkap & foto profil pengguna.</li>
                <li>Alamat email resmi untuk verifikasi hak akses naskah co-authorship.</li>
                <li>Pengenal unik akun (*Google User ID*).</li>
              </ul>

              <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">2. Penggunaan Cookie & Iklan Pihak Ketiga (Google AdSense)</h2>
              <p class="text-sm text-slate-600 leading-relaxed">
                Situs web ini dapat menampilkan iklan yang dilayani oleh <strong>Google AdSense</strong> atau penyedia jaringan iklan pihak ketiga. Kebijakan cookie yang berlaku adalah sebagai berikut:
              </p>
              <ul class="list-disc list-inside text-sm text-slate-600 space-y-1 pl-2">
                <li>Vendor pihak ketiga, termasuk Google, menggunakan cookie untuk menayangkan iklan berdasarkan kunjungan sebelumnya dari pengguna ke situs web ini atau situs web lain.</li>
                <li>Penggunaan cookie periklanan oleh Google (termasuk *DART Cookie*) memungkinkan Google dan mitranya untuk menayangkan iklan kepada pengguna berdasarkan kunjungan mereka ke situs kami dan/atau situs lain di Internet.</li>
                <li>Pengguna dapat memilih keluar dari personalisasi iklan dengan mengunjungi <a href="https://adssettings.google.com" target="_blank" rel="noopener" class="text-amber-600 underline font-bold">Pengaturan Iklan Google</a>.</li>
              </ul>

              <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">3. Penggunaan & Perlindungan Data Naskah</h2>
              <p class="text-sm text-slate-600 leading-relaxed">
                Naskah dan ide cerita yang Anda tulis di Studio Buku disimpan secara aman. Kami tidak menjual, menyewakan, atau membagikan data pribadi maupun isi naskah Anda kepada pihak ketiga untuk kepentingan komersial tanpa persetujuan Anda.
              </p>

              <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">4. Hak Pengguna & Penghapusan Data (GDPR / CCPA)</h2>
              <p class="text-sm text-slate-600 leading-relaxed">
                Anda berhak meminta akses, perbaikan, atau penghapusan permanen atas data pribadi dan naskah Anda dari server kami kapan saja dengan menghubungi tim pengelola privasi kami.
              </p>

              <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">5. Kontak Pengelola Privasi</h2>
              <p class="text-sm text-slate-600 leading-relaxed">
                Jika Anda memiliki pertanyaan mengenai Kebijakan Privasi ini, silakan hubungi tim kami di:<br/>
                <strong>Email Dukungan:</strong> <a href="mailto:kontak@buku.biz.id" class="text-amber-600 underline font-bold">kontak@buku.biz.id</a><br/>
                <strong>Domain Utama:</strong> https://studio.buku.biz.id
              </p>
            </div>
          </main>

          <!-- FOOTER -->
          <footer class="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 space-y-3 font-sans">
            <div class="flex flex-wrap items-center justify-center gap-4 text-slate-600 font-medium">
              <a href="/terms" class="hover:text-amber-600 transition">Syarat & Ketentuan</a>
              <span>•</span>
              <a href="/privacy" class="hover:text-amber-600 transition font-bold text-slate-900">Kebijakan Privasi</a>
              <span>•</span>
              <a href="/pricing" class="hover:text-amber-600 transition">Biaya & Donasi</a>
            </div>
            <p class="font-semibold text-slate-700">Studio Buku • Hak Cipta 2026 Studio.Buku.Biz.ID</p>
          </footer>
        </body>
      </html>
    `);
  });

  // Terms of Service Route (Google Auth & AdSense Compliant - Light Corporate)
  app.get("/terms", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Syarat & Ketentuan Layanan - Studio Buku</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-50 text-slate-900 font-sans min-h-screen flex flex-col justify-between">
          <!-- NORMAL FRONTPAGE HEADER -->
          <header class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-sm">
            <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <a href="/" class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight hover:text-amber-600 transition">
                Studio Buku
              </a>
              <div class="flex items-center space-x-3">
                <a href="/" class="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-5 py-2 rounded-full text-xs transition shadow-sm">
                  Login
                </a>
              </div>
            </div>
          </header>

          <main class="max-w-4xl mx-auto w-full px-4 py-10 sm:py-12 space-y-8 flex-1">
            <div class="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
              <h1 class="text-3xl sm:text-4xl font-black text-slate-900">Syarat & Ketentuan Layanan</h1>
              <p class="text-xs text-slate-500 font-bold">Terakhir diperbarui: 1 Oktober 2026</p>

              <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">1. Ketentuan Umum</h2>
              <p class="text-sm text-slate-600 leading-relaxed">
                Dengan mengakses, menjelajahi, dan menggunakan Studio Buku (<strong>studio.buku.biz.id</strong>), Anda menyetujui untuk terikat oleh Syarat dan Ketentuan Layanan ini. Layanan ini disediakan untuk memfasilitasi penulisan buku kolaboratif (*co-authorship*) di Indonesia.
              </p>

              <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">2. Hak Cipta & Kepemilikan Karya</h2>
              <p class="text-sm text-slate-600 leading-relaxed">
                Seluruh hak cipta, ide cerita, dan isi naskah yang dibuat atau diunggah di Studio Buku sepenuhnya merupakan milik sah penulis / pembuat karya. Studio Buku tidak mengklaim kepemilikan atas naskah Anda.
              </p>

              <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">3. Ketentuan Pengiklanan Google AdSense</h2>
              <p class="text-sm text-slate-600 leading-relaxed">
                Pengguna memahami dan menyetujui bahwa situs ini dapat menampilkan iklan digital dari Google AdSense untuk membantu membiayai operasional server. Pengguna dilarang melakukan klik tidak sah (*invalid clicks*) atau manipulasi iklan dalam bentuk apapun.
              </p>

              <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">4. Larangan Konten & Etika Penulisan</h2>
              <p class="text-sm text-slate-600 leading-relaxed">
                Pengguna dilarang menerbitkan naskah yang memuat konten ilegal, plagiarisme, pornografi, ujaran kebencian, atau pelanggaran hak cipta pihak ketiga. Naskah yang melanggar ketentuan dapat dihapus tanpa pemberitahuan sebelumnya.
              </p>

              <h2 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">5. Kontak Layanan & Bantuan</h2>
              <p class="text-sm text-slate-600 leading-relaxed">
                Pertanyaan hukum dan ketertarikan kerjasama dapat diajukan kepada pengelola melalui:<br/>
                <strong>Email Layanan:</strong> <a href="mailto:kontak@buku.biz.id" class="text-amber-600 underline font-bold">kontak@buku.biz.id</a>
              </p>
            </div>
          </main>

          <!-- FOOTER -->
          <footer class="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 space-y-3 font-sans">
            <div class="flex flex-wrap items-center justify-center gap-4 text-slate-600 font-medium">
              <a href="/terms" class="hover:text-amber-600 transition font-bold text-slate-900">Syarat & Ketentuan</a>
              <span>•</span>
              <a href="/privacy" class="hover:text-amber-600 transition">Kebijakan Privasi</a>
              <span>•</span>
              <a href="/pricing" class="hover:text-amber-600 transition">Biaya & Donasi</a>
            </div>
            <p class="font-semibold text-slate-700">Studio Buku • Hak Cipta 2026 Studio.Buku.Biz.ID</p>
          </footer>
        </body>
      </html>
    `);
  });

  // Pricing & Donation Route (Light Corporate)
  app.get("/pricing", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Biaya & Dukungan Donasi - Studio Buku</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-50 text-slate-900 font-sans min-h-screen flex flex-col justify-between">
          <!-- NORMAL FRONTPAGE HEADER -->
          <header class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-sm">
            <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <a href="/" class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight hover:text-amber-600 transition">
                Studio Buku
              </a>
              <div class="flex items-center space-x-3">
                <a href="/" class="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-5 py-2 rounded-full text-xs transition shadow-sm">
                  Login
                </a>
              </div>
            </div>
          </header>

          <main class="max-w-4xl mx-auto w-full px-4 py-10 sm:py-12 space-y-8 flex-1">
            <div class="text-center space-y-3">
              <span class="bg-amber-100 text-amber-900 border border-amber-300 px-3.5 py-1 rounded-full text-xs font-bold inline-block">
                100% Gratis Untuk Penulis & Pembaca
              </span>
              <h1 class="text-3xl sm:text-5xl font-black text-slate-900">Biaya & Wadah Dukungan Studio Buku</h1>
              <p class="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                Studio Buku (<strong>studio.buku.biz.id</strong>) beroperasi secara penuh tanpa memungut biaya pendaftaran maupun langganan dari para penulis dan pembaca di Indonesia.
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              <div class="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
                <span class="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                  Akses Utama (Rp 0)
                </span>
                <h2 class="text-xl font-bold text-slate-900">Akses Bebas Biaya</h2>
                <ul class="list-disc list-inside text-xs text-slate-600 space-y-2 leading-relaxed font-medium">
                  <li>Pembuatan proyek naskah kolaboratif (*co-authorship*) tanpa batasan jumlah.</li>
                  <li>Akses penuh ke editor bab, papan ide, log revisi, dan ekspor dokumen.</li>
                  <li>Publikasi otomatis ke Galeri Naskah Publik & halaman pratinjau HTML.</li>
                </ul>
              </div>

              <div class="bg-white border-2 border-amber-300 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm text-center">
                <span class="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                  Dukungan Sukarela
                </span>
                <h2 class="text-xl font-bold text-slate-900">Donasi Operasional Server</h2>
                <p class="text-xs text-slate-600 leading-relaxed font-medium">
                  Scan QRIS di bawah untuk membantu biaya server, domain, dan infrastruktur gratis platform:
                </p>
                <div class="bg-slate-50 border border-slate-200 p-4 rounded-2xl inline-block mx-auto">
                  <p class="text-xs font-bold text-slate-800 mb-2">Scan QRIS (DANA / ShopeePay / GoPay / OVO / BCA / Mandiri)</p>
                  <img src="/QRIS-DANA.jpeg" alt="QRIS Donasi Studio Buku" class="w-44 h-auto rounded-xl border border-slate-300 shadow-sm mx-auto bg-white p-1" />
                </div>
              </div>
            </div>
          </main>

          <!-- FOOTER -->
          <footer class="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 space-y-3 font-sans">
            <div class="flex flex-wrap items-center justify-center gap-4 text-slate-600 font-medium">
              <a href="/terms" class="hover:text-amber-600 transition">Syarat & Ketentuan</a>
              <span>•</span>
              <a href="/privacy" class="hover:text-amber-600 transition">Kebijakan Privasi</a>
              <span>•</span>
              <a href="/pricing" class="hover:text-amber-600 transition font-bold text-slate-900">Biaya & Donasi</a>
            </div>
            <p class="font-semibold text-slate-700">Studio Buku • Hak Cipta 2026 Studio.Buku.Biz.ID</p>
          </footer>
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
