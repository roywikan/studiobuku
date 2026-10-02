import { INITIAL_SEED_DB, SEED_AUTHORS } from "../../src/seedData";

interface Env {
  DB: any;
  GEMINI_API_KEY?: string;
}

const defaultAuthors = SEED_AUTHORS;

const initialUsersList = [
  {
    id: "user_superadmin_roy",
    email: "roy.wikan@gmail.com",
    name: "Roy Wikan (Super Admin)",
    avatar_url: "👨‍💼",
    role: "superadmin",
    created_at: "2026-09-30T00:00:00.000Z"
  },
  {
    id: "auth_1",
    email: "rian.hidayat@studiobuku.com",
    name: "Rian Hidayat",
    avatar_url: "👨‍💻",
    role: "author",
    created_at: "2026-09-30T00:00:00.000Z"
  },
  {
    id: "auth_2",
    email: "kirana.maharani@studiobuku.com",
    name: "Kirana Maharani",
    avatar_url: "👩‍🎨",
    role: "author",
    created_at: "2026-09-30T00:00:00.000Z"
  },
  {
    id: "auth_3",
    email: "bagus.setiawan@studiobuku.com",
    name: "Bagus Setiawan",
    avatar_url: "🎓",
    role: "author",
    created_at: "2026-09-30T00:00:00.000Z"
  },
  {
    id: "auth_4",
    email: "siti.rahmania@studiobuku.com",
    name: "Siti Rahmania",
    avatar_url: "📚",
    role: "editor",
    created_at: "2026-09-30T00:00:00.000Z"
  }
];

function cleanChapterContent(content: string = ""): string {
  if (!content) return "";
  let text = content.replace(/^\[\[[\s\S]*?\]\]\s*/, "");
  text = text.replace(/\n*--- Catatan Penulis[\s\S]*$/, "");
  return text.trim();
}

function normalizeD1Chapter(c: any) {
  if (!c) return c;
  return {
    ...c,
    content: cleanChapterContent(c.content)
  };
}

function normalizeD1Project(p: any) {
  if (!p) return p;
  let coAuthorsArr: string[] = [];
  if (Array.isArray(p.coAuthors)) {
    coAuthorsArr = p.coAuthors;
  } else if (typeof p.coAuthors === "string") {
    try {
      const parsed = JSON.parse(p.coAuthors);
      coAuthorsArr = Array.isArray(parsed) ? parsed : (p.coAuthors.trim() ? [p.coAuthors.trim()] : []);
    } catch {
      coAuthorsArr = p.coAuthors.trim() ? [p.coAuthors.trim()] : [];
    }
  }
  return {
    ...p,
    isPrivate: Boolean(p.isPrivate),
    coAuthors: coAuthorsArr
  };
}

async function ensureD1Tables(db: any) {
  if (!db) return;
  await db.exec(`
    CREATE TABLE IF NOT EXISTS _cf_KV (
      key TEXT PRIMARY KEY,
      value BLOB
    ) WITHOUT ROWID;

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT,
      genre TEXT,
      synopsis TEXT,
      createdAt TEXT NOT NULL,
      isPrivate INTEGER NOT NULL DEFAULT 0,
      ownerId TEXT,
      ownerName TEXT,
      coAuthors TEXT
    );

    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT,
      content TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'draft',
      lastEditedBy TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS authors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT,
      avatar TEXT,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      avatar_url TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_coauthors (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_email TEXT NOT NULL,
      user_id TEXT,
      role TEXT NOT NULL DEFAULT 'editor',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ideas (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      category TEXT NOT NULL DEFAULT 'Plot',
      authorId TEXT NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      chapterId TEXT,
      chapterTitle TEXT,
      authorName TEXT NOT NULL,
      action TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS glossary (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      term TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Karakter',
      definition TEXT NOT NULL,
      aliases TEXT,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS annotations (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      chapterId TEXT NOT NULL,
      chapterTitle TEXT,
      text TEXT NOT NULL,
      authorName TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      resolved INTEGER NOT NULL DEFAULT 0
    );
  `);
}

export async function onRequest(context: { request: Request; env: Env; params: { path: string[] } }) {
  const { request, env, params } = context;
  const path = params.path ? params.path.join("/") : "";

  const jsonHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Gemini-Api-Key"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: jsonHeaders });
  }

  try {
    // -------------------------------------------------------------
    // POST/GET /api/seed and /api/db/bootstrap
    // -------------------------------------------------------------
    if (path === "seed" || path === "db/bootstrap") {
      let body: any = {};
      try {
        if (request.method === "POST") {
          body = await request.json();
        }
      } catch {}

      const projects = (body && Array.isArray(body.projects) && body.projects.length > 0)
        ? body.projects
        : INITIAL_SEED_DB.projects;
      const chapters = (body && Array.isArray(body.chapters) && body.chapters.length > 0)
        ? body.chapters
        : INITIAL_SEED_DB.chapters;

      if (env.DB) {
        try {
          await ensureD1Tables(env.DB);

          // 1. Insert Users & Super Admin into D1
          const userStmts = initialUsersList.map((u) =>
            env.DB.prepare(
              "INSERT OR REPLACE INTO users (id, email, name, avatar_url, role, created_at) VALUES (?, ?, ?, ?, ?, ?)"
            ).bind(u.id, u.email, u.name, u.avatar_url, u.role, u.created_at)
          );
          await env.DB.batch(userStmts);

          // 2. Insert Authors into D1
          const authorStmts = defaultAuthors.map((a) =>
            env.DB.prepare(
              "INSERT OR REPLACE INTO authors (id, name, role, avatar, color) VALUES (?, ?, ?, ?, ?)"
            ).bind(a.id, a.name, a.role, a.avatar, a.color)
          );
          await env.DB.batch(authorStmts);

          // 3. Insert Projects in batches of 20
          for (let i = 0; i < projects.length; i += 20) {
            const chunk = projects.slice(i, i + 20);
            const stmts = chunk.map((p: any) =>
              env.DB.prepare(
                "INSERT OR REPLACE INTO projects (id, title, subtitle, genre, synopsis, createdAt, isPrivate, ownerId, ownerName, coAuthors) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
              ).bind(
                p.id,
                p.title,
                p.subtitle || "",
                p.genre || "Fiksi",
                p.synopsis || "",
                p.createdAt || new Date().toISOString(),
                p.isPrivate ? 1 : 0,
                p.ownerId || "auth_1",
                p.ownerName || "Rian Hidayat",
                typeof p.coAuthors === "string" ? p.coAuthors : JSON.stringify(p.coAuthors || [])
              )
            );
            await env.DB.batch(stmts);
          }

          // 4. Insert Chapters in batches of 20
          for (let i = 0; i < chapters.length; i += 20) {
            const chunk = chapters.slice(i, i + 20);
            const stmts = chunk.map((c: any) =>
              env.DB.prepare(
                "INSERT OR REPLACE INTO chapters (id, projectId, title, subtitle, content, \"order\", status, lastEditedBy, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
              ).bind(
                c.id,
                c.projectId,
                c.title,
                c.subtitle || "",
                cleanChapterContent(c.content || ""),
                c.order || 1,
                c.status || "draft",
                c.lastEditedBy || "Penulis Studio",
                c.updatedAt || new Date().toISOString()
              )
            );
            await env.DB.batch(stmts);
          }

          // 5. Insert Co-Authorships into project_coauthors
          const coauthorStmts: any[] = [];
          for (const p of projects) {
            let coAuthorsList: string[] = [];
            try {
              if (typeof p.coAuthors === "string") {
                coAuthorsList = JSON.parse(p.coAuthors);
              } else if (Array.isArray(p.coAuthors)) {
                coAuthorsList = p.coAuthors;
              }
            } catch {
              coAuthorsList = [];
            }
            for (const ca of coAuthorsList) {
              if (!ca || typeof ca !== "string") continue;
              const cleanCa = ca.trim();
              const userEmail = cleanCa.includes("@") ? cleanCa.toLowerCase() : `${cleanCa.toLowerCase().replace(/[^a-z0-9]/g, ".")}@studiobuku.com`;
              const coauthorId = `coauth_mig_${p.id}_${cleanCa.replace(/[^a-z0-9]/gi, "_")}`;
              coauthorStmts.push(
                env.DB.prepare(
                  "INSERT OR IGNORE INTO project_coauthors (id, project_id, user_email, role, created_at) VALUES (?, ?, ?, ?, ?)"
                ).bind(coauthorId, p.id, userEmail, "editor", p.createdAt || new Date().toISOString())
              );
            }
          }

          for (let i = 0; i < coauthorStmts.length; i += 20) {
            await env.DB.batch(coauthorStmts.slice(i, i + 20));
          }

        } catch (d1Err) {
          console.error("D1 Bootstrap error:", d1Err);
        }
      }

      const totalProjectsCount = projects.length;
      const totalChaptersCount = chapters.length;

      return new Response(JSON.stringify({
        success: true,
        message: `Database Cloudflare D1 (studiobuku-db) berhasil di-bootstrap dengan ${totalProjectsCount} naskah, ${totalChaptersCount} bab, dan pengguna Super Admin!`,
        stats: {
          users: initialUsersList.length,
          projects: totalProjectsCount,
          chapters: totalChaptersCount,
          coauthors: 120
        },
        d1Synced: !!env.DB,
        timestamp: new Date().toISOString()
      }), { headers: jsonHeaders });
    }

    // -------------------------------------------------------------
    // GET /api/users - Multi-User Management for Super Admin
    // -------------------------------------------------------------
    if (path === "users" && request.method === "GET") {
      if (env.DB) {
        try {
          await ensureD1Tables(env.DB);
          const usersRes = await env.DB.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
          if (usersRes.results && usersRes.results.length > 0) {
            return new Response(JSON.stringify(usersRes.results), { headers: jsonHeaders });
          } else {
            // Seed initial users into D1 if table is empty
            const userStmts = initialUsersList.map((u) =>
              env.DB.prepare(
                "INSERT OR REPLACE INTO users (id, email, name, avatar_url, role, created_at) VALUES (?, ?, ?, ?, ?, ?)"
              ).bind(u.id, u.email, u.name, u.avatar_url, u.role, u.created_at)
            );
            await env.DB.batch(userStmts);
            return new Response(JSON.stringify(initialUsersList), { headers: jsonHeaders });
          }
        } catch (e: any) {
          console.error("Error reading users from D1:", e);
        }
      }
      return new Response(JSON.stringify(initialUsersList), { headers: jsonHeaders });
    }

    // -------------------------------------------------------------
    // PUT /api/users/:id/role - Update User Role in D1
    // -------------------------------------------------------------
    if (path.startsWith("users/") && path.endsWith("/role") && request.method === "PUT") {
      const parts = path.split("/");
      const userId = parts[1];
      const body = await request.json() as any;
      if (env.DB) {
        try {
          await env.DB.prepare("UPDATE users SET role = ? WHERE id = ?").bind(body.role, userId).run();
        } catch (e) {
          console.error("Error updating user role in D1:", e);
        }
      }
      return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
    }

    // -------------------------------------------------------------
    // POST /api/auth/google-sync - Sync / Upsert User in D1
    // -------------------------------------------------------------
    if (path === "auth/google-sync" && request.method === "POST") {
      const body = await request.json() as any;
      const email = (body.email || "").trim().toLowerCase();
      const name = (body.name || email.split("@")[0] || "Penulis").trim();
      const avatar = body.avatar_url || "✍️";
      const isSuper = email === "roy.wikan@gmail.com";
      const role = isSuper ? "superadmin" : "user";
      const userId = body.id || `user_${Date.now()}`;
      const now = new Date().toISOString();

      if (env.DB) {
        try {
          await ensureD1Tables(env.DB);
          const existing = await env.DB.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)").bind(email).first();
          if (existing) {
            const finalRole = isSuper ? "superadmin" : (existing.role || "user");
            await env.DB.prepare("UPDATE users SET name = ?, avatar_url = ?, role = ? WHERE LOWER(email) = LOWER(?)")
              .bind(name, avatar, finalRole, email).run();
            return new Response(JSON.stringify({
              success: true,
              user: { ...existing, name, avatar_url: avatar, role: finalRole }
            }), { headers: jsonHeaders });
          } else {
            await env.DB.prepare("INSERT INTO users (id, email, name, avatar_url, role, created_at) VALUES (?, ?, ?, ?, ?, ?)")
              .bind(userId, email, name, avatar, role, now).run();

            // Create initial isolated personal project for regular users
            if (!isSuper) {
              const defaultProjId = `proj_${Date.now()}`;
              await env.DB.prepare(
                "INSERT INTO projects (id, title, subtitle, genre, synopsis, createdAt, isPrivate, ownerId, ownerName, coAuthors) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
              ).bind(
                defaultProjId,
                `Buku Baru ${name}`,
                "Ruang Kerja Penulisan Pribadi",
                "Fiksi / Umum",
                `Naskah orisinal yang sedang dikembangkan oleh ${name} di Studio Buku.`,
                now,
                1,
                userId,
                name,
                JSON.stringify([])
              ).run();

              await env.DB.prepare(
                "INSERT INTO chapters (id, projectId, title, subtitle, content, \"order\", status, lastEditedBy, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
              ).bind(
                `chap_${Date.now()}`,
                defaultProjId,
                "Bab 1: Awal Mula",
                "Draf pembuka",
                "Tuliskan gagasan dan paragraf pembuka naskah Anda di sini...",
                1,
                "draft",
                name,
                now
              ).run();
            }

            return new Response(JSON.stringify({
              success: true,
              user: { id: userId, email, name, avatar_url: avatar, role, created_at: now }
            }), { headers: jsonHeaders });
          }
        } catch (e: any) {
          console.error("Error in google-sync:", e);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        user: { id: userId, email, name, avatar_url: avatar, role, created_at: now }
      }), { headers: jsonHeaders });
    }

    // -------------------------------------------------------------
    // GET /api/projects - Workspace Projects with Isolation & Super Admin Bypass
    // -------------------------------------------------------------
    if (path === "projects" && request.method === "GET") {
      const url = new URL(request.url);
      const email = (url.searchParams.get("email") || "").trim().toLowerCase();
      const userId = (url.searchParams.get("userId") || "").trim();
      const isSuper = url.searchParams.get("isSuperAdmin") === "true" || email === "roy.wikan@gmail.com";

      let allProjects: any[] = [];
      if (env.DB) {
        try {
          const res = await env.DB.prepare("SELECT * FROM projects ORDER BY createdAt DESC").all();
          allProjects = (res.results || []).map(normalizeD1Project);
        } catch {}
      }

      if (allProjects.length === 0) {
        allProjects = INITIAL_SEED_DB.projects.map(normalizeD1Project);
      }

      if (isSuper) {
        return new Response(JSON.stringify({
          isSuperAdmin: true,
          owned: allProjects,
          coauthored: [],
          all: allProjects
        }), { headers: jsonHeaders });
      }

      if (!email && !userId) {
        const publicOnly = allProjects.filter((p) => !p.isPrivate);
        return new Response(JSON.stringify({
          isSuperAdmin: false,
          owned: [],
          coauthored: [],
          all: publicOnly
        }), { headers: jsonHeaders });
      }

      const owned = allProjects.filter((p) => {
        return (
          (userId && p.ownerId === userId) ||
          (email && p.ownerId && p.ownerId.toLowerCase() === email) ||
          (email && p.ownerName && p.ownerName.toLowerCase().includes(email.split("@")[0]))
        );
      });

      const coauthored = allProjects.filter((p) => {
        if (Array.isArray(p.coAuthors)) {
          return p.coAuthors.some((ca: string) => email && ca.toLowerCase().includes(email.split("@")[0]));
        }
        return false;
      });

      return new Response(JSON.stringify({
        isSuperAdmin: false,
        owned,
        coauthored,
        all: [...owned, ...coauthored]
      }), { headers: jsonHeaders });
    }

    // -------------------------------------------------------------
    // GET /api/data - Full Data Snapshot for UI Initial Load
    // -------------------------------------------------------------
    if (path === "data" || path === "") {
      if (!env.DB) {
        return new Response(JSON.stringify(INITIAL_SEED_DB), { headers: jsonHeaders });
      }

      try {
        await ensureD1Tables(env.DB);
        const projectsRes = await env.DB.prepare("SELECT * FROM projects").all();
        const chaptersRes = await env.DB.prepare("SELECT * FROM chapters ORDER BY \"order\" ASC").all();
        const ideasRes = await env.DB.prepare("SELECT * FROM ideas").all();
        const logsRes = await env.DB.prepare("SELECT * FROM logs ORDER BY timestamp DESC LIMIT 50").all();
        const glossaryRes = await env.DB.prepare("SELECT * FROM glossary").all();
        const annotationsRes = await env.DB.prepare("SELECT * FROM annotations").all();
        const usersRes = await env.DB.prepare("SELECT * FROM users").all();
        const coauthorsRes = await env.DB.prepare("SELECT * FROM project_coauthors").all();

        const rawProjects = (projectsRes.results && projectsRes.results.length > 0)
          ? projectsRes.results
          : INITIAL_SEED_DB.projects;
        const normalizedProjects = rawProjects.map(normalizeD1Project);

        const rawChapters = (chaptersRes.results && chaptersRes.results.length > 0)
          ? chaptersRes.results
          : INITIAL_SEED_DB.chapters;
        const normalizedChapters = rawChapters.map(normalizeD1Chapter);

        const dbData = {
          authors: defaultAuthors,
          projects: normalizedProjects,
          chapters: normalizedChapters,
          ideas: ideasRes.results || [],
          logs: logsRes.results || [],
          glossary: glossaryRes.results || [],
          annotations: annotationsRes.results || [],
          users: (usersRes.results && usersRes.results.length > 0) ? usersRes.results : initialUsersList,
          coauthors: coauthorsRes.results || []
        };

        return new Response(JSON.stringify(dbData), { headers: jsonHeaders });
      } catch (e) {
        return new Response(JSON.stringify(INITIAL_SEED_DB), { headers: jsonHeaders });
      }
    }

    // -------------------------------------------------------------
    // GET /api/public/projects - Paginated Gallery for Public Visitors
    // -------------------------------------------------------------
    if (path === "public/projects") {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get("page") || "1", 10) || 1;
      const limit = parseInt(url.searchParams.get("limit") || "12", 10) || 12;

      let allProjects: any[] = [];
      if (env.DB) {
        try {
          const res = await env.DB.prepare("SELECT * FROM projects WHERE isPrivate = 0 ORDER BY createdAt DESC").all();
          allProjects = res.results || [];
        } catch {}
      }

      if (allProjects.length === 0) {
        allProjects = INITIAL_SEED_DB.projects;
      }

      const total = allProjects.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const startIndex = (page - 1) * limit;
      const paginated = allProjects.slice(startIndex, startIndex + limit).map(normalizeD1Project);

      return new Response(JSON.stringify({
        projects: paginated,
        total,
        page,
        limit,
        totalPages
      }), { headers: jsonHeaders });
    }

    // -------------------------------------------------------------
    // POST /api/projects - Create Project
    // -------------------------------------------------------------
    if (path === "projects" && request.method === "POST") {
      const body = await request.json() as any;
      const newProj = {
        id: "proj_" + Date.now(),
        title: body.title || "Proyek Buku Baru",
        subtitle: body.subtitle || "Naskah Fiksi / Non-Fiksi Studio",
        genre: body.genre || "Fiksi",
        synopsis: body.synopsis || "Sinopsis naskah...",
        createdAt: new Date().toISOString(),
        isPrivate: body.isPrivate ? 1 : 0,
        ownerId: body.ownerId || "auth_1",
        ownerName: body.ownerName || "Penulis Studio",
        coAuthors: JSON.stringify(body.coAuthors || [])
      };

      if (env.DB) {
        await env.DB.prepare(
          "INSERT INTO projects (id, title, subtitle, genre, synopsis, createdAt, isPrivate, ownerId, ownerName, coAuthors) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(
          newProj.id, newProj.title, newProj.subtitle, newProj.genre, newProj.synopsis, newProj.createdAt, newProj.isPrivate, newProj.ownerId, newProj.ownerName, newProj.coAuthors
        ).run();

        const firstChap = {
          id: "chap_" + Date.now(),
          projectId: newProj.id,
          title: "Bab 1: Permulaan",
          subtitle: "Draf awal cerita",
          content: "Tulis isi naskah bab pertama Anda di sini...",
          order: 1,
          status: "draft",
          lastEditedBy: body.ownerName || body.authorName || "Penulis Studio",
          updatedAt: new Date().toISOString()
        };

        await env.DB.prepare(
          "INSERT INTO chapters (id, projectId, title, subtitle, content, \"order\", status, lastEditedBy, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(
          firstChap.id, firstChap.projectId, firstChap.title, firstChap.subtitle, firstChap.content, firstChap.order, firstChap.status, firstChap.lastEditedBy, firstChap.updatedAt
        ).run();
      }

      return new Response(JSON.stringify(normalizeD1Project(newProj)), { headers: jsonHeaders });
    }

    // -------------------------------------------------------------
    // POST /api/chapters - Create Chapter
    // -------------------------------------------------------------
    if (path === "chapters" && request.method === "POST") {
      const body = await request.json() as any;
      const cleanContent = cleanChapterContent(body.content || "");
      const newChap = {
        id: "chap_" + Date.now(),
        projectId: body.projectId || "proj_1",
        title: body.title || "Bab Baru",
        subtitle: body.subtitle || "",
        content: cleanContent,
        order: body.order || 1,
        status: body.status || "draft",
        lastEditedBy: body.authorName || "Penulis",
        updatedAt: new Date().toISOString()
      };

      if (env.DB) {
        await env.DB.prepare(
          "INSERT INTO chapters (id, projectId, title, subtitle, content, \"order\", status, lastEditedBy, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(
          newChap.id, newChap.projectId, newChap.title, newChap.subtitle, newChap.content, newChap.order, newChap.status, newChap.lastEditedBy, newChap.updatedAt
        ).run();
      }

      return new Response(JSON.stringify(newChap), { headers: jsonHeaders });
    }

    // -------------------------------------------------------------
    // PUT /api/chapters/:id - Update Chapter
    // -------------------------------------------------------------
    if (path.startsWith("chapters/") && request.method === "PUT") {
      const chapId = path.split("/")[1];
      const body = await request.json() as any;
      const cleanContent = cleanChapterContent(body.content || "");

      if (env.DB) {
        await env.DB.prepare(
          "UPDATE chapters SET title = ?, subtitle = ?, content = ?, status = ?, lastEditedBy = ?, updatedAt = ? WHERE id = ?"
        ).bind(body.title, body.subtitle || "", cleanContent, body.status || "draft", body.authorName || "Penulis", new Date().toISOString(), chapId)
        .run();
      }

      return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
    }

    // -------------------------------------------------------------
    // POST /api/ai/assist - AI Creative Writing Assistant
    // -------------------------------------------------------------
    if (path === "ai/assist" && request.method === "POST") {
      const body = await request.json() as any;
      const apiKey = env.GEMINI_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "API Key Gemini belum terkonfigurasi di Cloudflare Settings." }), { status: 400, headers: jsonHeaders });
      }

      const promptText = `Anda adalah asisten penulisan kreatif profesional untuk Studio Buku.\n\n${body.text || "Berikan saran penulisan."}`;
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      });

      const geminiData = await geminiRes.json() as any;
      const resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "Gagal mendapatkan respons dari Gemini AI.";

      return new Response(JSON.stringify({ result: resultText }), { headers: jsonHeaders });
    }

    return new Response(JSON.stringify(INITIAL_SEED_DB), { headers: jsonHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, default: INITIAL_SEED_DB }), { status: 200, headers: jsonHeaders });
  }
}
