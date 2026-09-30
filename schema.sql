-- ==========================================================
-- STUDIO BUKU DATABASE SCHEMA & SEED DATA (Cloudflare D1)
-- Database Name: studiobuku-db
-- ==========================================================

-- 1. TABEL PROYEK NASKAH BUKU
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  genre TEXT,
  synopsis TEXT,
  createdAt TEXT NOT NULL
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

-- 3. TABEL GLOSARIUM & ISTILAH DUNIA (CHARACTER / LORE / LOCATION)
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

-- 4. TABEL PAPAN GAGASAN / IDE SCRATCHPAD
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

-- 5. TABEL LOG REVISI & AUDIT TRAIL
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

-- 6. TABEL ANOTASI & CATATAN EDITOR
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
-- SEED DATA AWAL (INITIAL SAMPLE DATA)
-- ==========================================================

-- Proyek Awal
INSERT OR IGNORE INTO projects (id, title, subtitle, genre, synopsis, createdAt)
VALUES (
  'proj_1',
  'Gema Di Ujung Senja',
  'Novel Fiksi Psikologis & Perjalanan Dua Jiwa',
  'Fiksi / Drama',
  'Kisah tentang dua sahabat masa kecil yang terpisah selama satu dekade dan dipertemukan kembali dalam proyek restorasi arsip tua di Yogyakarta.',
  DATETIME('now')
);

-- Bab Pertama
INSERT OR IGNORE INTO chapters (id, projectId, title, subtitle, content, "order", status, lastEditedBy, updatedAt)
VALUES (
  'chap_1',
  'proj_1',
  'Bab 1: Stasiun Tugu Pukul Empat Sore',
  'Pertemuan setelah sepuluh tahun berlalu',
  'Kereta rel listrik berdecit pelan saat memasuki peron jalur tiga Stasiun Tugu. Aroma uap panas bercampur bau khas stasiun tua menyambut kedatangan sore itu. Langit Yogyakarta tampak jingga kemerahan, menepis mendung yang menggantung sejak siang.

Arya berdiri di dekat pilar besi bercat hijau pudar. Tangannya menggenggam tiket kertas yang sudah agak kusut. Di seberangnya, seorang perempuan berjas hujan abu-abu melangkah turun dari gerbong ekonomi, membawa ransel kanvas lusuh yang sama persis seperti sepuluh tahun lalu.

''Kamu terlambat lima menit, Kiran,'' sapa Arya dengan senyum tipis.

Kirana mendengus pelan, lalu tertawa kecil. ''Kemacetan Ring Road tidak bisa diajak kompromi, Ary. Tapi setidaknya kita tepat waktu untuk memulai semua ini.''',
  1,
  'final',
  'Rian Hidayat',
  DATETIME('now')
);

-- Bab Kedua
INSERT OR IGNORE INTO chapters (id, projectId, title, subtitle, content, "order", status, lastEditedBy, updatedAt)
VALUES (
  'chap_2',
  'proj_1',
  'Bab 2: Arsip yang Terlupakan',
  'Menemukan kotak kayu berdebu di loteng',
  'Rumah kakek di kawasan Kotabaru menyimpan lorong waktu tersendiri. Debu lembut menari di bawah sorotan cahaya matahari yang menembus genting kaca.

''Di sinilah kakek menyimpan catatan harian tahun 1965,'' ujar Kirana sambil menyeka permukaan kotak kayu jati berukir melati.

Arya mendekat, membawa lampu senter kecil. Bau kertas tua semacam vanili kering dan tinta cina langsung menusuk indra penciuman mereka. Lembar demi lembar catatan itu menyimpan teka-teki keluarga yang selama ini terkubur rapat.',
  2,
  'review',
  'Kirana Maharani',
  DATETIME('now')
);

-- Glosarium Awal
INSERT OR IGNORE INTO glossary (id, projectId, term, category, definition, aliases, updatedAt)
VALUES
(
  'glos_1',
  'proj_1',
  'Arya Perkasa',
  'Karakter',
  'Tokoh utama pria, 28 tahun, konservator arsip sejarah lulusan UGM.',
  'Ary, Arya',
  DATETIME('now')
),
(
  'glos_2',
  'proj_1',
  'Kirana Maharani',
  'Karakter',
  'Tokoh utama wanita, jurnalis lepas berjiwa petualang.',
  'Kiran, Kirana',
  DATETIME('now')
),
(
  'glos_3',
  'proj_1',
  'Rumah Kotabaru',
  'Lokasi',
  'Rumah berarsitektur kolonial Belanda peninggalan kakek Arya.',
  'Rumah Kakek',
  DATETIME('now')
);

-- Papan Gagasan
INSERT OR IGNORE INTO ideas (id, projectId, title, content, category, authorId, pinned, createdAt)
VALUES (
  'idea_1',
  'proj_1',
  'Simbol Kunci Inggris Tua',
  'Kunci inggris peninggalan ayah Arya jadi metafora rekonsiliasi. Setiap bab bisa disisipkan kutipan tentang memperbaiki mesin yang macet.',
  'Plot',
  'auth_1',
  1,
  DATETIME('now')
);

-- Log Revisi
INSERT OR IGNORE INTO logs (id, projectId, chapterId, chapterTitle, authorName, action, timestamp)
VALUES (
  'log_1',
  'proj_1',
  'chap_1',
  'Bab 1: Stasiun Tugu Pukul Empat Sore',
  'Rian Hidayat',
  'Inisialisasi draf naskah awal dan skema basis data',
  DATETIME('now')
);
