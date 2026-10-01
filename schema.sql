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
-- SEED DATA AWAL (12+ PROYEK NASKAH BUKU DENGAN STATUS PUBLIK/PRIVAT)
-- ==========================================================

INSERT OR IGNORE INTO projects (id, title, subtitle, genre, synopsis, createdAt, isPrivate, ownerId, ownerName, coAuthors)
VALUES 
(
  'proj_1',
  'Gema Di Ujung Senja',
  'Novel Fiksi Psikologis & Perjalanan Dua Jiwa',
  'Fiksi / Drama',
  'Kisah tentang dua sahabat masa kecil yang terpisah selama satu dekade dan dipertemukan kembali dalam proyek restorasi arsip tua di Yogyakarta.',
  '2026-09-30T10:00:00.000Z',
  0,
  'auth_1',
  'Rian Hidayat',
  '["auth_2", "Kirana Maharani"]'
),
(
  'proj_2',
  'Lembayung Kotabaru',
  'Misteri Berkas Tua 1965',
  'Misteri & Detektif',
  'Detektif swasta dan juru arsip membongkar brankas rahasia peninggalan kolonial Belanda di loteng Kotabaru.',
  '2026-09-29T14:30:00.000Z',
  0,
  'auth_2',
  'Kirana Maharani',
  '["auth_1", "Rian Hidayat"]'
),
(
  'proj_3',
  'Sandi Dibalik Candi',
  'Perjalanan Arkeologis Di Lembah Progo',
  'Akademik & Riset',
  'Catatan lapangan dan hipotesis prasasti batu hitam yang terpendam di lereng bukit Menoreh.',
  '2026-09-28T09:15:00.000Z',
  0,
  'auth_1',
  'Rian Hidayat',
  '[]'
),
(
  'proj_4',
  'Bunga Rumput Samudra',
  'Antologi Puisi & Narasi Pesisir',
  'Biografi / Antologi',
  'Kumpulan prosa dan refleksi filosofis kehidupan nelayan di pesisir selatan Jawa.',
  '2026-09-27T16:20:00.000Z',
  0,
  'auth_2',
  'Kirana Maharani',
  '[]'
),
(
  'proj_5',
  'Pelaut Malam Dan Bintang',
  'Novel Fiksi Sejarah Bahari',
  'Fiksi / Novel',
  'Kisah kapal pinisi nusantara yang menembus badai samudera hindia membawa muatan rempah langka.',
  '2026-09-26T11:45:00.000Z',
  0,
  'auth_1',
  'Rian Hidayat',
  '[]'
),
(
  'proj_6',
  'Cahaya Di Balik Kabut',
  'Pengembangan Diri & Ketenangan Jiwa',
  'Non-Fiksi / Pengembangan Diri',
  'Panduan reflektif menemukan kedamaian batin di tengah hiruk pikuk kehidupan modern.',
  '2026-09-25T08:00:00.000Z',
  0,
  'auth_2',
  'Kirana Maharani',
  '[]'
),
(
  'proj_7',
  'Detektif Batavia 1920',
  'Penyelidikan Kota Tua',
  'Misteri & Detektif',
  'Inspektur muda mengurai teka-teki hilangnya lukisan cat minyak di pelabuhan Sunda Kelapa.',
  '2026-09-24T13:10:00.000Z',
  0,
  'auth_1',
  'Rian Hidayat',
  '[]'
),
(
  'proj_8',
  'Catatan Penjelajah Rimba',
  'Antologi Eksplorasi Gunung Dan Hutan',
  'Biografi / Antologi',
  'Perjalanan menembus kanopi hutan hujan tropis Kalimantan dan kearifan lokal suku pedalaman.',
  '2026-09-23T15:00:00.000Z',
  0,
  'auth_2',
  'Kirana Maharani',
  '[]'
),
(
  'proj_9',
  'Harmoni Di Tepian Progo',
  'Roman Pedesaan & Alunan Musik Klasik',
  'Fiksi Remaja / Romance',
  'Pemain biola muda menemukan inspirasi komposisi lagu baru di tepian sungai berbatu.',
  '2026-09-22T10:30:00.000Z',
  0,
  'auth_1',
  'Rian Hidayat',
  '[]'
),
(
  'proj_10',
  'Surat Surat Senja',
  'Kumpulan Korespondensi Dua Sahabat',
  'Biografi / Antologi',
  'Koleksi surat fisik berisi renungan sastra, seni, dan epistemologi kebudayaan.',
  '2026-09-21T17:40:00.000Z',
  0,
  'auth_2',
  'Kirana Maharani',
  '[]'
),
(
  'proj_11',
  'Seruling Di Puncak Merapi',
  'Mitos Dan Realitas Lereng Vulkanik',
  'Fiksi / Novel',
  'Kisah juru kunci muda yang merawat harmoni alam di bawah naungan awan panas gunung api.',
  '2026-09-20T12:00:00.000Z',
  0,
  'auth_1',
  'Rian Hidayat',
  '[]'
),
(
  'proj_12',
  'Bayang Bayang Malioboro',
  'Kisah Komunitas Seni Malam Hari',
  'Fiksi / Novel',
  'Dinamika kehidupan seniman jalanan, pemusik angklung, dan pelukis sketsa trotoar Yogya.',
  '2026-09-19T19:25:00.000Z',
  0,
  'auth_2',
  'Kirana Maharani',
  '[]'
),
(
  'proj_13',
  'Catatan Rahasia Juru Kunci',
  'Proyek Khusus Terkunci (Dokumen Internal)',
  'Fiksi / Drama',
  'Naskah privat yang masih dalam draf tertutup dan belum dipublikasikan.',
  '2026-09-18T21:00:00.000Z',
  1,
  'auth_1',
  'Rian Hidayat',
  '[]'
);

-- Sample Chapters
INSERT OR IGNORE INTO chapters (id, projectId, title, subtitle, content, "order", status, lastEditedBy, updatedAt)
VALUES 
(
  'chap_1',
  'proj_1',
  'Bab 1: Stasiun Tugu Pukul Empat Sore',
  'Pertemuan setelah sepuluh tahun berlalu',
  'Kereta rel listrik berdecit pelan saat memasuki peron jalur tiga Stasiun Tugu. Aroma uap panas bercampur bau khas stasiun tua menyambut kedatangan sore itu.',
  1,
  'final',
  'Rian Hidayat',
  '2026-09-30T10:00:00.000Z'
),
(
  'chap_2',
  'proj_1',
  'Bab 2: Arsip yang Terlupakan',
  'Menemukan kotak kayu berdebu di loteng',
  'Rumah kakek di kawasan Kotabaru menyimpan lorong waktu tersendiri. Debu lembut menari di bawah sorotan cahaya matahari yang menembus genting kaca.',
  2,
  'review',
  'Kirana Maharani',
  '2026-09-30T11:00:00.000Z'
);
