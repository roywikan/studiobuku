import fs from "fs";
import path from "path";
import { INITIAL_SEED_DB } from "../src/seedData";

function escapeSql(str: string): string {
  return (str || "").replace(/'/g, "''");
}

function generateSqlFile() {
  const { projects, chapters, authors } = INITIAL_SEED_DB;

  let sql = `-- ==========================================================
-- STUDIO BUKU DATABASE SCHEMA & COMPLETE SEED DATA (Cloudflare D1)
-- Database Name: studiobuku-db
-- Total Projects: ${projects.length} | Total Chapters: ${chapters.length}
-- ==========================================================

-- 1. TABEL PROYEK NASKAH BUKU
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

-- 2. TABEL BAB & DRAF EDITOR
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

-- 3. TABEL PENULIS
CREATE TABLE IF NOT EXISTS authors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  avatar TEXT,
  color TEXT
);

-- 4. TABEL GLOSARIUM & ISTILAH DUNIA
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

-- 5. TABEL PAPAN GAGASAN / IDE
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

-- 6. TABEL LOG REVISI
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

-- 7. TABEL ANOTASI
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

-- ==========================================================
-- SEED DATA PENULIS
-- ==========================================================
`;

  authors.forEach((a) => {
    sql += `INSERT OR REPLACE INTO authors (id, name, role, avatar, color) VALUES ('${escapeSql(a.id)}', '${escapeSql(a.name)}', '${escapeSql(a.role)}', '${escapeSql(a.avatar)}', '${escapeSql(a.color)}');\n`;
  });

  sql += `\n-- ==========================================================\n-- SEED DATA 60 PROYEK NASKAH\n-- ==========================================================\n`;

  projects.forEach((p) => {
    const coAuthorsJson = escapeSql(JSON.stringify(p.coAuthors || []));
    sql += `INSERT OR REPLACE INTO projects (id, title, subtitle, genre, synopsis, createdAt, isPrivate, ownerId, ownerName, coAuthors) VALUES ('${escapeSql(p.id)}', '${escapeSql(p.title)}', '${escapeSql(p.subtitle)}', '${escapeSql(p.genre)}', '${escapeSql(p.synopsis)}', '${escapeSql(p.createdAt)}', ${p.isPrivate ? 1 : 0}, '${escapeSql(p.ownerId || "")}', '${escapeSql(p.ownerName || "")}', '${coAuthorsJson}');\n`;
  });

  sql += `\n-- ==========================================================\n-- SEED DATA 480 BAB NASKAH\n-- ==========================================================\n`;

  chapters.forEach((c) => {
    sql += `INSERT OR REPLACE INTO chapters (id, projectId, title, subtitle, content, "order", status, lastEditedBy, updatedAt) VALUES ('${escapeSql(c.id)}', '${escapeSql(c.projectId)}', '${escapeSql(c.title)}', '${escapeSql(c.subtitle || "")}', '${escapeSql(c.content)}', ${c.order}, '${escapeSql(c.status)}', '${escapeSql(c.lastEditedBy)}', '${escapeSql(c.updatedAt)}');\n`;
  });

  const targetPath = path.join(process.cwd(), "schema.sql");
  fs.writeFileSync(targetPath, sql, "utf-8");
  console.log(`Successfully generated schema.sql with ${projects.length} projects and ${chapters.length} chapters.`);
}

generateSqlFile();
