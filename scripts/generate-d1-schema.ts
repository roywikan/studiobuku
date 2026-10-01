import fs from "fs";
import path from "path";
import { INITIAL_SEED_DB } from "../src/seedData";

function cleanChapterContent(content: string = ""): string {
  if (!content) return "";
  let text = content.replace(/^\[\[[\s\S]*?\]\]\s*/, "");
  text = text.replace(/\n*--- Catatan Penulis[\s\S]*$/, "");
  return text.trim();
}

function toSqlString(str: string | undefined | null): string {
  if (!str) return "''";
  const lines = str.split("\n");
  if (lines.length === 1) {
    return `'${lines[0].replace(/'/g, "''")}'`;
  }
  return lines.map((line) => `'${line.replace(/'/g, "''")}'`).join(" || char(10) || ");
}

function generateSqlFiles() {
  const { projects, chapters, authors } = INITIAL_SEED_DB;

  const tableDefinitions = `-- ==========================================================
-- STUDIO BUKU DATABASE SCHEMA & SEED DATA (Cloudflare D1)
-- Database Name: studiobuku-db
-- Total Projects: ${projects.length} | Total Chapters: ${chapters.length}
-- ==========================================================

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

-- ==========================================================
-- SEED DATA PENULIS (4 PENULIS)
-- ==========================================================
`;

  let authorsSql = "";
  authors.forEach((a) => {
    authorsSql += `INSERT OR REPLACE INTO authors (id, name, role, avatar, color) VALUES (${toSqlString(a.id)}, ${toSqlString(a.name)}, ${toSqlString(a.role)}, ${toSqlString(a.avatar)}, ${toSqlString(a.color)});\n`;
  });

  let projectsSql = `-- ==========================================================\n-- SEED DATA 60 PROYEK NASKAH\n-- ==========================================================\n`;
  projects.forEach((p) => {
    const coAuthorsJson = JSON.stringify(p.coAuthors || []);
    projectsSql += `INSERT OR REPLACE INTO projects (id, title, subtitle, genre, synopsis, createdAt, isPrivate, ownerId, ownerName, coAuthors) VALUES (${toSqlString(p.id)}, ${toSqlString(p.title)}, ${toSqlString(p.subtitle)}, ${toSqlString(p.genre)}, ${toSqlString(p.synopsis)}, ${toSqlString(p.createdAt)}, ${p.isPrivate ? 1 : 0}, ${toSqlString(p.ownerId)}, ${toSqlString(p.ownerName)}, ${toSqlString(coAuthorsJson)});\n`;
  });

  const chapterStatements: string[] = [];
  chapters.forEach((c) => {
    const cleanContent = cleanChapterContent(c.content);
    chapterStatements.push(
      `INSERT OR REPLACE INTO chapters (id, projectId, title, subtitle, content, "order", status, lastEditedBy, updatedAt) VALUES (${toSqlString(c.id)}, ${toSqlString(c.projectId)}, ${toSqlString(c.title)}, ${toSqlString(c.subtitle)}, ${toSqlString(cleanContent)}, ${c.order}, ${toSqlString(c.status)}, ${toSqlString(c.lastEditedBy)}, ${toSqlString(c.updatedAt)});`
    );
  });

  const fullSql = tableDefinitions + authorsSql + "\n" + projectsSql + "\n-- ==========================================================\n-- SEED DATA 480 BAB NASKAH (SINGLE-LINE SAFE)\n-- ==========================================================\n" + chapterStatements.join("\n") + "\n";

  // 1. Tulis schema.sql utama
  fs.writeFileSync(path.join(process.cwd(), "schema.sql"), fullSql, "utf-8");
  fs.writeFileSync(path.join(process.cwd(), "public/schema.sql"), fullSql, "utf-8");

  // 2. Tulis folder d1-sql/
  const d1Dir = path.join(process.cwd(), "d1-sql");
  const publicD1Dir = path.join(process.cwd(), "public/d1-sql");
  fs.mkdirSync(d1Dir, { recursive: true });
  fs.mkdirSync(publicD1Dir, { recursive: true });

  const part1Sql = tableDefinitions + authorsSql + "\n" + projectsSql;
  fs.writeFileSync(path.join(d1Dir, "01_tables_and_60_projects.sql"), part1Sql, "utf-8");
  fs.writeFileSync(path.join(publicD1Dir, "01_tables_and_60_projects.sql"), part1Sql, "utf-8");

  const part2Sql = "-- BAB 1 SAMPAI 240 (SINGLE-LINE D1 COMPATIBLE)\n" + chapterStatements.slice(0, 240).join("\n") + "\n";
  fs.writeFileSync(path.join(d1Dir, "02_chapters_part1.sql"), part2Sql, "utf-8");
  fs.writeFileSync(path.join(publicD1Dir, "02_chapters_part1.sql"), part2Sql, "utf-8");

  const part3Sql = "-- BAB 241 SAMPAI 480 (SINGLE-LINE D1 COMPATIBLE)\n" + chapterStatements.slice(240).join("\n") + "\n";
  fs.writeFileSync(path.join(d1Dir, "03_chapters_part2.sql"), part3Sql, "utf-8");
  fs.writeFileSync(path.join(publicD1Dir, "03_chapters_part2.sql"), part3Sql, "utf-8");

  // Buat juga batch kecil per 120 bab
  const chunksDir = path.join(d1Dir, "chunks");
  const publicChunksDir = path.join(publicD1Dir, "chunks");
  fs.mkdirSync(chunksDir, { recursive: true });
  fs.mkdirSync(publicChunksDir, { recursive: true });

  for (let i = 0; i < 4; i++) {
    const chunkStatements = chapterStatements.slice(i * 120, (i + 1) * 120);
    const chunkContent = `-- CHUNK ${i + 1}: BAB ${i * 120 + 1} SAMPAI ${(i + 1) * 120}\n` + chunkStatements.join("\n") + "\n";
    const filename = `chunk_${i + 1}_bab_${i * 120 + 1}_sd_${(i + 1) * 120}.sql`;
    fs.writeFileSync(path.join(chunksDir, filename), chunkContent, "utf-8");
    fs.writeFileSync(path.join(publicChunksDir, filename), chunkContent, "utf-8");
  }

  console.log(`Generated single-line D1-safe SQL files: ${projects.length} projects, ${chapters.length} chapters.`);
}

generateSqlFiles();
