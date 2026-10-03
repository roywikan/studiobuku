import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { INITIAL_SEED_DB } from "../seedData";
import { Project, Chapter, Idea, RevisionLog, Author, Annotation, GlossaryItem, UserRecord, ProjectCoAuthor } from "../types";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "studiobuku-db.sqlite");
const JSON_BACKUP = path.join(DATA_DIR, "db.json");

// Initialize SQLite connection conforming to Cloudflare D1 studiobuku-db
export const d1 = new DatabaseSync(DB_PATH);

// Enable WAL mode & foreign keys for high-performance and relational integrity
d1.exec("PRAGMA journal_mode = WAL;");
d1.exec("PRAGMA foreign_keys = ON;");

/**
 * Cloudflare D1 DDL Definitions for studiobuku-db
 */
export function initD1Schema() {
  d1.exec(`
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
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS authors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT,
      avatar TEXT,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS glossary (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      term TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Karakter',
      definition TEXT NOT NULL,
      aliases TEXT,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ideas (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      category TEXT NOT NULL DEFAULT 'Plot',
      authorId TEXT NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      chapterId TEXT,
      chapterTitle TEXT,
      authorName TEXT NOT NULL,
      action TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS annotations (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      chapterId TEXT NOT NULL,
      chapterTitle TEXT,
      text TEXT NOT NULL,
      authorName TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      resolved INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    );

    -- Multi-User Authentication & Profiles in Cloudflare D1
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      avatar_url TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL
    );

    -- Co-Authorship & Collaborative Access Management in Cloudflare D1
    CREATE TABLE IF NOT EXISTS project_coauthors (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_email TEXT NOT NULL,
      user_id TEXT,
      role TEXT NOT NULL DEFAULT 'editor',
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);
}

/**
 * MIGRASI OTOMATIS: Authors Lama -> Tabel Users di Cloudflare D1
 * Memastikan semua author di tabel authors terdaftar di tabel users
 * dengan ID asli (auth_1, auth_2, dll) dan email canonical studio
 * sehingga relasi kepemilikan naskah (projects.ownerId) tetap 100% konsisten.
 */
export function migrateExistingAuthorsToUsers() {
  const authors = d1.prepare("SELECT * FROM authors").all() as any[];
  const insertUser = d1.prepare(`
    INSERT OR IGNORE INTO users (id, email, name, avatar_url, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const canonicalEmails: Record<string, string> = {
    auth_1: "rian.hidayat@studiobuku.com",
    auth_2: "kirana.maharani@studiobuku.com",
    auth_3: "bagus.setiawan@studiobuku.com",
    auth_4: "siti.rahmania@studiobuku.com",
  };

  for (const a of authors) {
    const defaultEmail = canonicalEmails[a.id] || `${a.name.toLowerCase().replace(/[^a-z0-9]/g, ".")}@studiobuku.com`;
    const userRole = a.role && a.role.toLowerCase().includes("editor") ? "editor" : "author";
    insertUser.run(
      a.id,
      defaultEmail,
      a.name,
      a.avatar || "👨‍💻",
      userRole,
      "2026-09-30T00:00:00.000Z"
    );
  }

  // Super Admin: roy.wikan@gmail.com
  const existingSuperAdmin = d1.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)").get("roy.wikan@gmail.com") as any;
  if (!existingSuperAdmin) {
    d1.prepare(`
      INSERT INTO users (id, email, name, avatar_url, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      "user_superadmin_roy",
      "roy.wikan@gmail.com",
      "Roy Wikan (Super Admin)",
      "👨‍💼",
      "superadmin",
      "2026-09-30T00:00:00.000Z"
    );
  } else if (existingSuperAdmin.role !== "superadmin") {
    d1.prepare("UPDATE users SET role = 'superadmin' WHERE LOWER(email) = LOWER(?)").run("roy.wikan@gmail.com");
  }

  console.log(`[Cloudflare D1] 👥 Migrasi authors -> users selesai. Total user: ${(d1.prepare("SELECT COUNT(*) as count FROM users").get() as any).count}`);
}

/**
 * MIGRASI OTOMATIS: Projects.coAuthors (JSON) -> Tabel project_coauthors di D1
 * Memetakan setiap nama co-author dari 60 naskah ke tabel relasi relasional D1.
 */
export function migrateCoAuthorsToProjectCoauthors() {
  const projects = d1.prepare("SELECT id, coAuthors, createdAt FROM projects").all() as any[];
  const allUsers = d1.prepare("SELECT id, email, name FROM users").all() as any[];
  
  // Mapping nama / email ke user
  const userMap = new Map<string, { id: string; email: string }>();
  for (const u of allUsers) {
    userMap.set(u.name.toLowerCase(), { id: u.id, email: u.email });
    userMap.set(u.email.toLowerCase(), { id: u.id, email: u.email });
  }

  const insertCoauthor = d1.prepare(`
    INSERT OR IGNORE INTO project_coauthors (id, project_id, user_email, user_id, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let countMigrated = 0;
  for (const p of projects) {
    if (!p.coAuthors) continue;
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
      const matched = userMap.get(cleanCa.toLowerCase());
      const userEmail = matched ? matched.email : (cleanCa.includes("@") ? cleanCa.toLowerCase() : `${cleanCa.toLowerCase().replace(/[^a-z0-9]/g, ".")}@studiobuku.com`);
      const userId = matched ? matched.id : null;
      const coauthorId = `coauth_mig_${p.id}_${(userId || cleanCa).replace(/[^a-z0-9]/gi, "_")}`;

      insertCoauthor.run(
        coauthorId,
        p.id,
        userEmail,
        userId,
        "editor",
        p.createdAt || new Date().toISOString()
      );
      countMigrated++;
    }
  }

  console.log(`[Cloudflare D1] 🤝 Migrasi co-authors selesai (${countMigrated} relasi co-author di D1).`);
}

/**
 * Helper to escape multi-line string into single-line Cloudflare D1 safe SQL
 */
function toSqlString(str: string | undefined | null): string {
  if (!str) return "''";
  const lines = str.split("\n");
  if (lines.length === 1) {
    return `'${lines[0].replace(/'/g, "''")}'`;
  }
  return lines.map((line) => `'${line.replace(/'/g, "''")}'`).join(" || char(10) || ");
}

/**
 * AUTO UPDATE FILE schema.sql & d1-sql/
 * Mengekspor seluruh skema dan data terbaru dari Cloudflare D1 ke file schema.sql
 * sehingga file SQL selalu mutakhir dan siap dijalankan via Wrangler CLI (`npx wrangler d1 execute`).
 */
export function exportD1SchemaSql() {
  try {
    const tableDefinitions = `-- ==========================================================
-- STUDIO BUKU DATABASE SCHEMA & SEED DATA (Cloudflare D1)
-- Database Name: studiobuku-db
-- Auto-generated: ${new Date().toISOString()}
-- ==========================================================

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
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS authors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  avatar TEXT,
  color TEXT
);

CREATE TABLE IF NOT EXISTS glossary (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  term TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Karakter',
  definition TEXT NOT NULL,
  aliases TEXT,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT NOT NULL DEFAULT 'Plot',
  authorId TEXT NOT NULL,
  pinned INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  chapterId TEXT,
  chapterTitle TEXT,
  authorName TEXT NOT NULL,
  action TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS annotations (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  chapterId TEXT NOT NULL,
  chapterTitle TEXT,
  text TEXT NOT NULL,
  authorName TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
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
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
`;

    // 1. Users
    const users = getAllD1Users();
    let usersSql = `\n-- ==========================================================\n-- USERS (SUPER ADMIN & MIGRATED AUTHORS)\n-- ==========================================================\n`;
    for (const u of users) {
      usersSql += `INSERT OR REPLACE INTO users (id, email, name, avatar_url, role, created_at) VALUES (${toSqlString(u.id)}, ${toSqlString(u.email)}, ${toSqlString(u.name)}, ${toSqlString(u.avatar_url)}, ${toSqlString(u.role)}, ${toSqlString(u.created_at)});\n`;
    }

    // 2. Authors
    const authors = d1.prepare("SELECT * FROM authors").all() as any[];
    let authorsSql = `\n-- ==========================================================\n-- AUTHORS (STUDIO WRITERS)\n-- ==========================================================\n`;
    for (const a of authors) {
      authorsSql += `INSERT OR REPLACE INTO authors (id, name, role, avatar, color) VALUES (${toSqlString(a.id)}, ${toSqlString(a.name)}, ${toSqlString(a.role)}, ${toSqlString(a.avatar)}, ${toSqlString(a.color)});\n`;
    }

    // 3. Projects
    const projects = d1.prepare("SELECT * FROM projects ORDER BY datetime(createdAt) DESC").all() as any[];
    let projectsSql = `\n-- ==========================================================\n-- PROJECTS (${projects.length} NASKAH BUKU)\n-- ==========================================================\n`;
    for (const p of projects) {
      projectsSql += `INSERT OR REPLACE INTO projects (id, title, subtitle, genre, synopsis, createdAt, isPrivate, ownerId, ownerName, coAuthors) VALUES (${toSqlString(p.id)}, ${toSqlString(p.title)}, ${toSqlString(p.subtitle)}, ${toSqlString(p.genre)}, ${toSqlString(p.synopsis)}, ${toSqlString(p.createdAt)}, ${p.isPrivate ? 1 : 0}, ${toSqlString(p.ownerId)}, ${toSqlString(p.ownerName)}, ${toSqlString(p.coAuthors)});\n`;
    }

    // 4. Project Co-Authors
    const coauthors = d1.prepare("SELECT * FROM project_coauthors").all() as any[];
    let coauthorsSql = `\n-- ==========================================================\n-- PROJECT COAUTHORS (${coauthors.length} RELASI KOLABORASI)\n-- ==========================================================\n`;
    for (const ca of coauthors) {
      coauthorsSql += `INSERT OR REPLACE INTO project_coauthors (id, project_id, user_email, user_id, role, created_at) VALUES (${toSqlString(ca.id)}, ${toSqlString(ca.project_id)}, ${toSqlString(ca.user_email)}, ${toSqlString(ca.user_id)}, ${toSqlString(ca.role)}, ${toSqlString(ca.created_at)});\n`;
    }

    // 5. Chapters
    const chapters = d1.prepare('SELECT * FROM chapters ORDER BY "order" ASC').all() as any[];
    const chapterStatements: string[] = [];
    for (const c of chapters) {
      chapterStatements.push(
        `INSERT OR REPLACE INTO chapters (id, projectId, title, subtitle, content, "order", status, lastEditedBy, updatedAt) VALUES (${toSqlString(c.id)}, ${toSqlString(c.projectId)}, ${toSqlString(c.title)}, ${toSqlString(c.subtitle)}, ${toSqlString(c.content)}, ${c.order}, ${toSqlString(c.status)}, ${toSqlString(c.lastEditedBy)}, ${toSqlString(c.updatedAt)});`
      );
    }
    const chaptersSql = `\n-- ==========================================================\n-- CHAPTERS (${chapters.length} BAB NASKAH)\n-- ==========================================================\n` + chapterStatements.join("\n") + "\n";

    // Combine Full SQL
    const fullSql = tableDefinitions + usersSql + authorsSql + projectsSql + coauthorsSql + chaptersSql;

    // Write to root schema.sql and public/schema.sql
    fs.writeFileSync(path.join(process.cwd(), "schema.sql"), fullSql, "utf-8");
    const publicDir = path.join(process.cwd(), "public");
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(path.join(publicDir, "schema.sql"), fullSql, "utf-8");

    // Write to d1-sql/ folder
    const d1Dir = path.join(process.cwd(), "d1-sql");
    const publicD1Dir = path.join(publicDir, "d1-sql");
    if (!fs.existsSync(d1Dir)) fs.mkdirSync(d1Dir, { recursive: true });
    if (!fs.existsSync(publicD1Dir)) fs.mkdirSync(publicD1Dir, { recursive: true });

    const part1Sql = tableDefinitions + usersSql + authorsSql + projectsSql + coauthorsSql;
    fs.writeFileSync(path.join(d1Dir, "01_tables_and_60_projects.sql"), part1Sql, "utf-8");
    fs.writeFileSync(path.join(publicD1Dir, "01_tables_and_60_projects.sql"), part1Sql, "utf-8");

    console.log(`[Cloudflare D1] 📝 File schema.sql berhasil di-update otomatis (${projects.length} proyek, ${chapters.length} bab, ${users.length} pengguna, ${coauthors.length} co-author).`);
  } catch (err) {
    console.error("[Cloudflare D1] ❌ Gagal meng-update schema.sql:", err);
  }
}

/**
 * Seed initial catalog from seedData if empty
 */
export function seedInitialCatalog() {
  console.log("[Cloudflare D1] 📦 Seeding catalog into D1 SQLite (studiobuku-db)...");

  // Authors
  const insertAuthor = d1.prepare(`
    INSERT OR REPLACE INTO authors (id, name, role, avatar, color)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const author of INITIAL_SEED_DB.authors) {
    insertAuthor.run(author.id, author.name, author.role, author.avatar, author.color);
  }

  // Projects
  const insertProj = d1.prepare(`
    INSERT OR REPLACE INTO projects (id, title, subtitle, genre, synopsis, createdAt, isPrivate, ownerId, ownerName, coAuthors)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const p of INITIAL_SEED_DB.projects) {
    const coAuthorsStr = typeof p.coAuthors === "string" ? p.coAuthors : JSON.stringify(p.coAuthors || []);
    insertProj.run(
      p.id,
      p.title,
      p.subtitle || "",
      p.genre || "Fiksi",
      p.synopsis || "",
      p.createdAt || new Date().toISOString(),
      p.isPrivate ? 1 : 0,
      p.ownerId || "auth_1",
      p.ownerName || "Rian Hidayat",
      coAuthorsStr
    );
  }

  // Chapters
  const insertChap = d1.prepare(`
    INSERT OR REPLACE INTO chapters (id, projectId, title, subtitle, content, "order", status, lastEditedBy, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const c of INITIAL_SEED_DB.chapters) {
    insertChap.run(
      c.id,
      c.projectId,
      c.title,
      c.subtitle || "",
      c.content || "",
      c.order || 1,
      c.status || "draft",
      c.lastEditedBy || "Penulis",
      c.updatedAt || new Date().toISOString()
    );
  }

  // Ideas
  const insertIdea = d1.prepare(`
    INSERT OR REPLACE INTO ideas (id, projectId, title, content, category, authorId, pinned, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const idea of INITIAL_SEED_DB.ideas) {
    insertIdea.run(
      idea.id,
      idea.projectId,
      idea.title,
      idea.content || "",
      idea.category || "Plot",
      idea.authorId || "auth_1",
      idea.pinned ? 1 : 0,
      idea.createdAt || new Date().toISOString()
    );
  }

  // Logs
  const insertLog = d1.prepare(`
    INSERT OR REPLACE INTO logs (id, projectId, chapterId, chapterTitle, authorName, action, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const log of INITIAL_SEED_DB.logs) {
    insertLog.run(
      log.id,
      log.projectId,
      log.chapterId || null,
      log.chapterTitle || null,
      log.authorName || "Penulis",
      log.action || "Menyunting",
      log.timestamp || new Date().toISOString()
    );
  }

  // Glossary
  if (INITIAL_SEED_DB.glossary) {
    const insertGlossary = d1.prepare(`
      INSERT OR REPLACE INTO glossary (id, projectId, term, category, definition, aliases, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const g of INITIAL_SEED_DB.glossary) {
      insertGlossary.run(
        g.id,
        g.projectId,
        g.term,
        g.category || "Karakter",
        g.definition,
        g.aliases || "",
        g.updatedAt || new Date().toISOString()
      );
    }
  }

  // Run migrations
  migrateExistingAuthorsToUsers();
  migrateCoAuthorsToProjectCoauthors();

  // Export JSON backup and schema.sql
  syncToJsonBackup();
  exportD1SchemaSql();
  console.log("[Cloudflare D1] ✅ Catalog successfully seeded into D1 SQLite!");
}

/**
 * MEKANISME BOOTSTRAP OTOMATIS KE CLOUDFLARE D1
 * Dijalankan saat startup atau dipanggil via API/CLI
 */
export function autoBootstrapD1() {
  console.log("[Cloudflare D1] 🚀 Menjalankan bootstrap otomatis ke D1 (studiobuku-db)...");
  
  // 1. Inisialisasi DDL tabel
  initD1Schema();

  // 2. Cek apakah proyek naskah sudah ada
  const countRow = d1.prepare("SELECT COUNT(*) as count FROM projects").get() as any;
  if (!countRow || countRow.count === 0) {
    seedInitialCatalog();
    // 3. Update seed chapters and project synopses with new bespoke opening texts
    const updateChapter = d1.prepare(`
      UPDATE chapters SET content = ?, title = ? WHERE id = ?
    `);
    const updateProject = d1.prepare(`
      UPDATE projects SET synopsis = ? WHERE id = ?
    `);
    for (const p of INITIAL_SEED_DB.projects) {
      updateProject.run(p.synopsis, p.id);
    }
    for (const c of INITIAL_SEED_DB.chapters) {
      updateChapter.run(c.content, c.title, c.id);
    }

    // 4. Lakukan migrasi data authors -> users
    migrateExistingAuthorsToUsers();
    // 5. Lakukan migrasi co-authors -> project_coauthors
    migrateCoAuthorsToProjectCoauthors();
    // 6. Update schema.sql secara otomatis
    exportD1SchemaSql();
    syncToJsonBackup();
  }

  // 7. Pastikan riwayat log revisi terisi jika masih kosong
  const logCountCheck = (d1.prepare("SELECT COUNT(*) as count FROM logs").get() as any)?.count || 0;
  if (logCountCheck === 0 && INITIAL_SEED_DB.logs && INITIAL_SEED_DB.logs.length > 0) {
    console.log("[Cloudflare D1] 📝 Seeding initial revision logs into D1...");
    const insertLog = d1.prepare(`
      INSERT OR REPLACE INTO logs (id, projectId, chapterId, chapterTitle, authorName, action, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const log of INITIAL_SEED_DB.logs) {
      insertLog.run(
        log.id,
        log.projectId,
        log.chapterId || null,
        log.chapterTitle || null,
        log.authorName || "Penulis",
        log.action || "Menyunting",
        log.timestamp || new Date().toISOString()
      );
    }
    console.log(`[Cloudflare D1] ✅ Berhasil mengisi ${INITIAL_SEED_DB.logs.length} riwayat revisi awal ke D1.`);
    exportD1SchemaSql();
    syncToJsonBackup();
  }

  const userCount = (d1.prepare("SELECT COUNT(*) as count FROM users").get() as any).count;
  const projectCount = (d1.prepare("SELECT COUNT(*) as count FROM projects").get() as any).count;
  const chapterCount = (d1.prepare("SELECT COUNT(*) as count FROM chapters").get() as any).count;
  const coauthorCount = (d1.prepare("SELECT COUNT(*) as count FROM project_coauthors").get() as any).count;
  const logCount = (d1.prepare("SELECT COUNT(*) as count FROM logs").get() as any).count;

  return {
    success: true,
    message: "Cloudflare D1 (studiobuku-db) berhasil di-bootstrap secara otomatis!",
    stats: {
      users: userCount,
      projects: projectCount,
      chapters: chapterCount,
      coauthors: coauthorCount,
      logs: logCount
    }
  };
}

/**
 * Multi-User Sync: Automatically creates/updates user in Cloudflare D1
 * Super Admin roy.wikan@gmail.com is unconditionally granted 'superadmin' role.
 */
export function upsertD1User(profile: { id?: string; email: string; name: string; avatar_url?: string }): UserRecord {
  const email = (profile.email || "").trim().toLowerCase();
  const name = (profile.name || email.split("@")[0] || "Penulis").trim();
  const avatar = profile.avatar_url || "✍️";
  const isSuperAdmin = email === "roy.wikan@gmail.com";
  const defaultRole = isSuperAdmin ? "superadmin" : "user";
  const now = new Date().toISOString();

  const existing = d1.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)").get(email) as any;

  if (existing) {
    const effectiveRole = isSuperAdmin ? "superadmin" : (existing.role || "user");
    d1.prepare(`
      UPDATE users 
      SET name = ?, avatar_url = ?, role = ?
      WHERE LOWER(email) = LOWER(?)
    `).run(name, avatar, effectiveRole, email);

    // Auto update schema.sql
    exportD1SchemaSql();

    return {
      id: existing.id,
      email,
      name,
      avatar_url: avatar,
      role: effectiveRole as any,
      created_at: existing.created_at
    };
  }

  // New User Registration in Cloudflare D1
  const newUserId = profile.id || `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  d1.prepare(`
    INSERT INTO users (id, email, name, avatar_url, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(newUserId, email, name, avatar, defaultRole, now);

  // If this is a regular new user, create their first personal blank workspace project
  if (!isSuperAdmin) {
    const defaultProjId = `proj_${Date.now()}`;
    d1.prepare(`
      INSERT INTO projects (id, title, subtitle, genre, synopsis, createdAt, isPrivate, ownerId, ownerName, coAuthors)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      defaultProjId,
      `Buku Baru ${name}`,
      "Ruang Kerja Penulisan Pribadi",
      "Fiksi / Umum",
      `Naskah orisinal yang sedang dikembangkan oleh ${name} di Studio Buku.`,
      now,
      1, // Private by default for isolation
      newUserId,
      name,
      JSON.stringify([])
    );

    // Initial Chapter 1
    d1.prepare(`
      INSERT INTO chapters (id, projectId, title, subtitle, content, "order", status, lastEditedBy, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `chap_${Date.now()}`,
      defaultProjId,
      "Bab 1: Awal Mula",
      "Draf pembuka",
      `Tuliskan gagasan dan paragraf pembuka naskah Anda di sini...`,
      1,
      "draft",
      name,
      now
    );
  }

  syncToJsonBackup();
  exportD1SchemaSql();

  return {
    id: newUserId,
    email,
    name,
    avatar_url: avatar,
    role: defaultRole as any,
    created_at: now
  };
}

export function getAllD1Users(): UserRecord[] {
  const rows = d1.prepare("SELECT * FROM users ORDER BY created_at DESC").all() as any[];
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    avatar_url: r.avatar_url,
    role: r.role,
    created_at: r.created_at
  }));
}

export function updateD1UserRole(userId: string, role: string) {
  d1.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, userId);
  exportD1SchemaSql();
}

/**
 * Isolated User Projects & Collaboration Query in Cloudflare D1
 */
export function getD1ProjectsForUser(email?: string, userId?: string, isSuperAdmin?: boolean) {
  const normEmail = (email || "").trim().toLowerCase();
  const isSuper = isSuperAdmin || normEmail === "roy.wikan@gmail.com";

  const allProjectsRows = d1.prepare("SELECT * FROM projects ORDER BY datetime(createdAt) DESC").all() as any[];
  const allProjects: Project[] = allProjectsRows.map(formatProjectRow);

  // Super Admin: Bypasses isolation, has access to ALL projects!
  if (isSuper) {
    return {
      isSuperAdmin: true,
      owned: allProjects,
      coauthored: [],
      all: allProjects
    };
  }

  if (!normEmail && !userId) {
    // Guest: only public projects
    const publicProjects = allProjects.filter((p) => !p.isPrivate);
    return {
      isSuperAdmin: false,
      owned: [],
      coauthored: [],
      all: publicProjects
    };
  }

  // 1. Projects Owned by User
  const owned = allProjects.filter((p) => {
    return (
      (userId && p.ownerId === userId) ||
      (normEmail && p.ownerId && p.ownerId.toLowerCase() === normEmail) ||
      (normEmail && p.ownerName && p.ownerName.toLowerCase().includes(normEmail.split("@")[0]))
    );
  });

  // 2. Co-Authored Projects from project_coauthors table or JSON coAuthors list
  const coauthorRows = normEmail
    ? (d1.prepare(`
        SELECT pc.project_id, pc.role, pc.created_at
        FROM project_coauthors pc
        WHERE LOWER(pc.user_email) = LOWER(?)
      `).all(normEmail) as any[])
    : [];

  const coauthorProjectIds = new Set(coauthorRows.map((r) => r.project_id));

  const coauthored = allProjects.filter((p) => {
    if (coauthorProjectIds.has(p.id)) return true;
    if (Array.isArray(p.coAuthors)) {
      return p.coAuthors.some((ca) => normEmail && ca.toLowerCase().includes(normEmail.split("@")[0]));
    }
    return false;
  });

  return {
    isSuperAdmin: false,
    owned,
    coauthored,
    all: [...owned, ...coauthored]
  };
}

/**
 * Co-Authoring Management via Cloudflare D1 project_coauthors table
 */
export function getD1ProjectCoAuthors(projectId: string): ProjectCoAuthor[] {
  const rows = d1.prepare(`
    SELECT * FROM project_coauthors WHERE project_id = ? ORDER BY created_at DESC
  `).all(projectId) as any[];

  return rows.map((r) => ({
    id: r.id,
    project_id: r.project_id,
    user_email: r.user_email,
    user_id: r.user_id,
    role: r.role,
    created_at: r.created_at
  }));
}

export function addD1ProjectCoAuthor(projectId: string, userEmail: string, role: string = "editor"): ProjectCoAuthor {
  const cleanEmail = userEmail.trim().toLowerCase();
  const existing = d1.prepare(`
    SELECT * FROM project_coauthors WHERE project_id = ? AND LOWER(user_email) = LOWER(?)
  `).get(projectId, cleanEmail) as any;

  if (existing) {
    d1.prepare(`
      UPDATE project_coauthors SET role = ? WHERE id = ?
    `).run(role, existing.id);
    exportD1SchemaSql();
    return {
      id: existing.id,
      project_id: projectId,
      user_email: cleanEmail,
      user_id: existing.user_id,
      role: role as any,
      created_at: existing.created_at
    };
  }

  const userMatch = d1.prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?)").get(cleanEmail) as any;
  const newId = `coauth_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const now = new Date().toISOString();

  d1.prepare(`
    INSERT INTO project_coauthors (id, project_id, user_email, user_id, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(newId, projectId, cleanEmail, userMatch ? userMatch.id : null, role, now);

  // Sync to projects.coAuthors JSON array for fast UI previews
  const proj = d1.prepare("SELECT coAuthors FROM projects WHERE id = ?").get(projectId) as any;
  if (proj) {
    let list: string[] = [];
    try {
      list = JSON.parse(proj.coAuthors || "[]");
    } catch {
      list = [];
    }
    if (!list.includes(cleanEmail)) {
      list.push(cleanEmail);
      d1.prepare("UPDATE projects SET coAuthors = ? WHERE id = ?").run(JSON.stringify(list), projectId);
    }
  }

  syncToJsonBackup();
  exportD1SchemaSql();

  return {
    id: newId,
    project_id: projectId,
    user_email: cleanEmail,
    user_id: userMatch ? userMatch.id : undefined,
    role: role as any,
    created_at: now
  };
}

export function removeD1ProjectCoAuthor(projectId: string, coauthorIdOrEmail: string) {
  d1.prepare(`
    DELETE FROM project_coauthors 
    WHERE project_id = ? AND (id = ? OR LOWER(user_email) = LOWER(?))
  `).run(projectId, coauthorIdOrEmail, coauthorIdOrEmail);

  // Sync projects.coAuthors JSON
  const proj = d1.prepare("SELECT coAuthors FROM projects WHERE id = ?").get(projectId) as any;
  if (proj) {
    let list: string[] = [];
    try {
      list = JSON.parse(proj.coAuthors || "[]");
    } catch {
      list = [];
    }
    list = list.filter((item) => item.toLowerCase() !== coauthorIdOrEmail.toLowerCase());
    d1.prepare("UPDATE projects SET coAuthors = ? WHERE id = ?").run(JSON.stringify(list), projectId);
  }

  syncToJsonBackup();
  exportD1SchemaSql();
}

/**
 * Format project row from SQLite into typed Project
 */
function formatProjectRow(row: any): Project {
  let coAuthorsList: string[] = [];
  try {
    if (typeof row.coAuthors === "string") {
      coAuthorsList = JSON.parse(row.coAuthors);
    } else if (Array.isArray(row.coAuthors)) {
      coAuthorsList = row.coAuthors;
    }
  } catch {
    coAuthorsList = row.coAuthors ? [row.coAuthors] : [];
  }

  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle || "",
    genre: row.genre || "Fiksi",
    synopsis: row.synopsis || "",
    createdAt: row.createdAt,
    isPrivate: Boolean(row.isPrivate),
    ownerId: row.ownerId || undefined,
    ownerName: row.ownerName || undefined,
    coAuthors: coAuthorsList
  };
}

/**
 * Get entire DB snapshot (for client initial hydration and public gallery)
 */
export function getFullD1Database() {
  const projects = (d1.prepare("SELECT * FROM projects ORDER BY datetime(createdAt) DESC").all() as any[]).map(formatProjectRow);
  const chapters = d1.prepare('SELECT * FROM chapters ORDER BY "order" ASC').all() as any[];
  const authors = d1.prepare("SELECT * FROM authors").all() as any[];
  const ideas = d1.prepare("SELECT * FROM ideas ORDER BY pinned DESC, datetime(createdAt) DESC").all() as any[];
  const logs = d1.prepare("SELECT * FROM logs ORDER BY datetime(timestamp) DESC LIMIT 100").all() as any[];
  const annotations = d1.prepare("SELECT * FROM annotations ORDER BY datetime(createdAt) DESC").all() as any[];
  const glossary = d1.prepare("SELECT * FROM glossary ORDER BY term ASC").all() as any[];
  const users = getAllD1Users();
  const coauthors = d1.prepare("SELECT * FROM project_coauthors").all() as any[];

  return {
    projects,
    chapters,
    authors,
    ideas: ideas.map((i) => ({ ...i, pinned: Boolean(i.pinned) })),
    logs,
    annotations: annotations.map((a) => ({ ...a, resolved: Boolean(a.resolved) })),
    glossary,
    users,
    coauthors
  };
}

export function syncToJsonBackup() {
  try {
    const full = getFullD1Database();
    fs.writeFileSync(JSON_BACKUP, JSON.stringify(full, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to sync JSON backup:", e);
  }
}

// ==========================================================
// D1 CRUD OPERATIONS (RELATIONAL PERSISTENCE IN SQLITE/D1)
// ==========================================================

export function insertD1Log(log: RevisionLog) {
  d1.prepare(`
    INSERT INTO logs (id, projectId, chapterId, chapterTitle, authorName, action, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    log.id,
    log.projectId,
    log.chapterId || null,
    log.chapterTitle || null,
    log.authorName || "Penulis",
    log.action || "Menyunting",
    log.timestamp || new Date().toISOString()
  );
  syncToJsonBackup();
}

export function insertD1Chapter(chap: Chapter) {
  d1.prepare(`
    INSERT OR REPLACE INTO chapters (id, projectId, title, subtitle, content, "order", status, lastEditedBy, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    chap.id,
    chap.projectId,
    chap.title,
    chap.subtitle || "",
    chap.content || "",
    chap.order || 1,
    chap.status || "draft",
    chap.lastEditedBy || "Penulis",
    chap.updatedAt || new Date().toISOString()
  );
  syncToJsonBackup();
}

export function updateD1Chapter(id: string, updates: Partial<Chapter>) {
  const existing = d1.prepare("SELECT * FROM chapters WHERE id = ?").get(id) as any;
  if (!existing) return null;
  const merged = { ...existing, ...updates };
  d1.prepare(`
    UPDATE chapters 
    SET title = ?, subtitle = ?, content = ?, "order" = ?, status = ?, lastEditedBy = ?, updatedAt = ?
    WHERE id = ?
  `).run(
    merged.title,
    merged.subtitle || "",
    merged.content || "",
    merged.order || 1,
    merged.status || "draft",
    merged.lastEditedBy || "Penulis",
    merged.updatedAt || new Date().toISOString(),
    id
  );
  syncToJsonBackup();
  return merged;
}

export function deleteD1Chapter(id: string) {
  d1.prepare("DELETE FROM chapters WHERE id = ?").run(id);
  syncToJsonBackup();
}

export function insertD1Project(proj: Project) {
  const coAuthorsStr = typeof proj.coAuthors === "string" ? proj.coAuthors : JSON.stringify(proj.coAuthors || []);
  d1.prepare(`
    INSERT OR REPLACE INTO projects (id, title, subtitle, genre, synopsis, createdAt, isPrivate, ownerId, ownerName, coAuthors)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    proj.id,
    proj.title,
    proj.subtitle || "",
    proj.genre || "Fiksi",
    proj.synopsis || "",
    proj.createdAt || new Date().toISOString(),
    proj.isPrivate ? 1 : 0,
    proj.ownerId || "auth_1",
    proj.ownerName || "Penulis",
    coAuthorsStr
  );
  syncToJsonBackup();
}

export function updateD1Project(id: string, updates: Partial<Project>) {
  const existing = d1.prepare("SELECT * FROM projects WHERE id = ?").get(id) as any;
  if (!existing) return null;
  const merged = { ...existing, ...updates };
  const coAuthorsStr = typeof merged.coAuthors === "string" ? merged.coAuthors : JSON.stringify(merged.coAuthors || []);
  d1.prepare(`
    UPDATE projects 
    SET title = ?, subtitle = ?, genre = ?, synopsis = ?, isPrivate = ?, ownerId = ?, ownerName = ?, coAuthors = ?
    WHERE id = ?
  `).run(
    merged.title,
    merged.subtitle || "",
    merged.genre || "Fiksi",
    merged.synopsis || "",
    merged.isPrivate ? 1 : 0,
    merged.ownerId || "auth_1",
    merged.ownerName || "Penulis",
    coAuthorsStr,
    id
  );
  syncToJsonBackup();
  return merged;
}

export function insertD1Idea(idea: Idea) {
  d1.prepare(`
    INSERT OR REPLACE INTO ideas (id, projectId, title, content, category, authorId, pinned, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    idea.id,
    idea.projectId,
    idea.title,
    idea.content || "",
    idea.category || "Plot",
    idea.authorId || "auth_1",
    idea.pinned ? 1 : 0,
    idea.createdAt || new Date().toISOString()
  );
  syncToJsonBackup();
}

export function updateD1Idea(id: string, updates: Partial<Idea>) {
  const existing = d1.prepare("SELECT * FROM ideas WHERE id = ?").get(id) as any;
  if (!existing) return null;
  const merged = { ...existing, ...updates };
  d1.prepare(`
    UPDATE ideas 
    SET title = ?, content = ?, category = ?, pinned = ?
    WHERE id = ?
  `).run(
    merged.title,
    merged.content || "",
    merged.category || "Plot",
    merged.pinned ? 1 : 0,
    id
  );
  syncToJsonBackup();
  return merged;
}

export function deleteD1Idea(id: string) {
  d1.prepare("DELETE FROM ideas WHERE id = ?").run(id);
  syncToJsonBackup();
}

export function insertD1Annotation(ann: Annotation) {
  d1.prepare(`
    INSERT OR REPLACE INTO annotations (id, projectId, chapterId, chapterTitle, text, authorName, createdAt, resolved)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    ann.id,
    ann.projectId,
    ann.chapterId,
    ann.chapterTitle,
    ann.text,
    ann.authorName,
    ann.createdAt,
    ann.resolved ? 1 : 0
  );
  syncToJsonBackup();
}

export function updateD1Annotation(id: string, updates: Partial<Annotation>) {
  const existing = d1.prepare("SELECT * FROM annotations WHERE id = ?").get(id) as any;
  if (!existing) return null;
  const merged = { ...existing, ...updates };
  d1.prepare(`
    UPDATE annotations 
    SET text = ?, resolved = ?
    WHERE id = ?
  `).run(
    merged.text,
    merged.resolved ? 1 : 0,
    id
  );
  syncToJsonBackup();
  return merged;
}

export function deleteD1Annotation(id: string) {
  d1.prepare("DELETE FROM annotations WHERE id = ?").run(id);
  syncToJsonBackup();
}

export function insertD1Glossary(g: GlossaryItem) {
  d1.prepare(`
    INSERT OR REPLACE INTO glossary (id, projectId, term, category, definition, aliases, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    g.id,
    g.projectId,
    g.term,
    g.category || "Karakter",
    g.definition,
    g.aliases || "",
    g.updatedAt || new Date().toISOString()
  );
  syncToJsonBackup();
}

export function updateD1Glossary(id: string, updates: Partial<GlossaryItem>) {
  const existing = d1.prepare("SELECT * FROM glossary WHERE id = ?").get(id) as any;
  if (!existing) return null;
  const merged = { ...existing, ...updates };
  d1.prepare(`
    UPDATE glossary 
    SET term = ?, category = ?, definition = ?, aliases = ?, updatedAt = ?
    WHERE id = ?
  `).run(
    merged.term,
    merged.category || "Karakter",
    merged.definition,
    merged.aliases || "",
    merged.updatedAt || new Date().toISOString(),
    id
  );
  syncToJsonBackup();
  return merged;
}

export function deleteD1Glossary(id: string) {
  d1.prepare("DELETE FROM glossary WHERE id = ?").run(id);
  syncToJsonBackup();
}

// Automatically bootstrap schema and migrate on load
autoBootstrapD1();
