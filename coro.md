# Panduan Instalasi & Deploy Studio Buku ke Cloudflare (Pages / Workers)

Dokumen ini berisi panduan resmi langkah demi langkah untuk menginstal dan mengoperasikan aplikasi **Studio Buku** dari repository GitHub `/bookstudio` ke infrastruktur **Cloudflare** menggunakan **Cloudflare D1 Database** dan domain kustom `studio.buku.biz.id`.



## 📌 Rincian Spesifikasi & Konfigurasi

| Parameter | Nilai Konfigurasi |
| :--- | :--- |
| **Repository GitHub** | `github.com/your-username/bookstudio` |
| **Domain Kustom** | `studio.buku.biz.id` |
| **Database Serverless** | Cloudflare D1 (`studiobuku-db`) |
| **Environment Variable** | `GEMINI_API_KEY` |
| **Framework Runtime** | Node.js / Vite SPA + Cloudflare Worker Proxy |

---

## 🛠️ Langkah 1: Persiapan Prasyarat (Prerequisites)

1. Pastikan Anda telah memiliki **Akun Cloudflare** aktif.
2. Install **Node.js** (v18+) dan **Git** di komputer lokal Anda.
3. Install **Wrangler CLI** (alat baris perintah resmi Cloudflare):
   ```bash
   npm install -g wrangler
   ```
4. Login ke akun Cloudflare via Wrangler:
   ```bash
   wrangler login
   ```

---

## 🗄️ Langkah 2: Membuat Database Cloudflare D1 (`studiobuku-db`)

1. Jalankan perintah berikut di terminal untuk membuat database D1 baru bernama `studiobuku-db`:
   ```bash
   npx wrangler d1 create studiobuku-db
   ```

2. Output perintah akan menampilkan rincian `database_name` dan `database_id`. **Simpan ID tersebut**. Contoh output:
   ```text
   ✅ Successfully created DB 'studiobuku-db' in region APAC
   database_name = "studiobuku-db"
   database_id = "abc12345-6789-xxxx-xxxx-xxxxxxxxxxxx"
   ```

3. **Buat File Skema SQL Awal (`schema.sql`)** pada direktori utama proyek:
   ```sql
   -- Skema Tabel Studio Buku untuk Cloudflare D1 Database
   CREATE TABLE IF NOT EXISTS projects (
     id TEXT PRIMARY KEY,
     title TEXT NOT NULL,
     subtitle TEXT,
     genre TEXT,
     synopsis TEXT,
     createdAt TEXT
   );

   CREATE TABLE IF NOT EXISTS chapters (
     id TEXT PRIMARY KEY,
     projectId TEXT NOT NULL,
     title TEXT NOT NULL,
     subtitle TEXT,
     content TEXT,
     "order" INTEGER,
     status TEXT,
     lastEditedBy TEXT,
     updatedAt TEXT
   );

   CREATE TABLE IF NOT EXISTS glossary (
     id TEXT PRIMARY KEY,
     projectId TEXT NOT NULL,
     term TEXT NOT NULL,
     category TEXT,
     definition TEXT,
     aliases TEXT,
     updatedAt TEXT
   );

   CREATE TABLE IF NOT EXISTS ideas (
     id TEXT PRIMARY KEY,
     projectId TEXT NOT NULL,
     title TEXT NOT NULL,
     content TEXT,
     category TEXT,
     authorId TEXT,
     pinned INTEGER,
     createdAt TEXT
   );

   CREATE TABLE IF NOT EXISTS logs (
     id TEXT PRIMARY KEY,
     projectId TEXT NOT NULL,
     chapterId TEXT,
     chapterTitle TEXT,
     authorName TEXT,
     action TEXT,
     timestamp TEXT
   );
   ```

4. **Eksekusi Skema SQL ke Database Cloudflare D1**:
   ```bash
   npx wrangler d1 execute studiobuku-db --remote --file=./schema.sql
   ```

---

## ⚙️ Langkah 3: Membuat Berkas `wrangler.toml`

Buat file bernama `wrangler.toml` di direktori proyek `/bookstudio`:

```toml
name = "studiobuku"
main = "server.ts"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"

[[d1_databases]]
binding = "DB"
database_name = "studiobuku-db"
database_id = "GANTI_DENGAN_DATABASE_ID_ANDA"

[vars]
NODE_VERSION = "18"
```

> ⚠️ **Catatan**: Ganti `GANTI_DENGAN_DATABASE_ID_ANDA` dengan `database_id` yang didapatkan dari Langkah 2.

---

## 🚀 Langkah 4: Hubungkan Repo GitHub `/bookstudio` ke Cloudflare Pages

1. Buka **[Cloudflare Dashboard](https://dash.cloudflare.com/)**.
2. Pilih menu **Workers & Pages** -> **Create Application** -> pilih tab **Pages**.
3. Klik **Connect to Git** dan pilih repository **`bookstudio`**.
4. Masukkan **Build Settings**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
5. Klik **Save and Deploy**.

---

## 🔑 Langkah 5: Pengaturan Environment Variable (`GEMINI_API_KEY`)

1. Pada Cloudflare Dashboard, buka proyek Pages/Worker **studiobuku** yang baru dibuat.
2. Masuk ke menu **Settings** -> **Environment Variables**.
3. Tambahkan variabel baru:
   - **Variable Name**: `GEMINI_API_KEY`
   - **Value**: `AIzaSy_GANTI_DENGAN_API_KEY_GEMINI_ANDA`
4. Klik **Save**.

---

## 🌐 Langkah 6: Mengatur Domain Kustom (`studio.buku.biz.id`)

1. Di Cloudflare Dashboard, buka proyek Pages **studiobuku**.
2. Masuk ke tab **Custom Domains** -> Klik **Set up a Custom Domain**.
3. Ketikkan domain kustom Anda:
   ```text
   studio.buku.biz.id
   ```
4. Cloudflare akan secara otomatis memperbarui record DNS **CNAME** pada zona DNS `buku.biz.id`.
5. Tunggu proses aktivasi Sertifikat SSL/TLS HTTPS (biasanya membutuhkan waktu 1-3 menit).

---

## 🔐 Langkah 7: Pengaturan Authorized Domains Firebase Auth (Google Sign-In)

Untuk mengaktifkan otentikasi Google Sign-In pada domain custom (`studio.buku.biz.id`) dan domain Cloudflare Pages (`studiobuku.pages.dev`), Anda perlu menambahkan domain tersebut ke daftar **Authorized Domains** di Firebase Console:

1. **Buka Firebase Console Settings**:
   Akses langsung ke menu pengaturan otentikasi proyek Firebase Anda:
   👉 **[Firebase Auth Authorized Domains Settings](https://console.firebase.google.com/project/gen-lang-client-0987418952/authentication/settings)**

2. **Masuk ke Tab Authorized Domains**:
   - Scroll ke bagian bawah halaman di bawah opsi **Settings -> Authorized Domains**.
   - Klik tombol **"Add domain"** (atau **"Tambah Domain"**).

3. **Tambahkan Domain Kustom Anda**:
   - Masukkan `studio.buku.biz.id` -> Klik **Save**.
   - Masukkan `studiobuku.pages.dev` -> Klik **Save**.

4. **Verifikasi**:
   - Buka kembali `https://studio.buku.biz.id/` dan klik **"Masuk Otentik dengan Akun Google"**.
   - Popup Google Sign-In kini akan langsung terbuka dan memproses login Gmail secara resmi tanpa error `auth/unauthorized-domain`.

---

## ✅ Langkah 8: Verifikasi & Uji Coba Aplikasi

1. Buka browser dan kunjungi:
   ```text
   https://studio.buku.biz.id
   ```
2. Pastikan:
   - ✅ UI Studio Buku memuat naskah & editor dengan mulus.
   - ✅ Otentikasi Google Auth & Password / PIN berfungsi lancar.
   - ✅ Fitur Asisten AI Gemini berfungsi tanpa kendala.
   - ✅ Tautan Reader Publik (`https://studio.buku.biz.id/public/project/...`) dan fitur Glosarium Interaktif berjalan dengan baik.




### Variabel GEMINI_API_KEY pada proyek Studio Buku:
1. Apakah Setiap Penulis Menggunakan Key Berbeda atau 1 Key yang Sama?
👉 Rekomendasi Terbaik: 1 API Key Terpusat (Shared Server Key) + Opsi Key Pribadi Penulis
Mengapa 1 API Key Terpusat adalah yang Terbaik?
Pengalaman Pengguna (Out-of-the-Box) yang Mulus:
Seluruh tim penulis (Rian, Kirana, maupun penulis pendamping baru) dapat langsung fokus menulis buku dan menikmati fitur AI (Lanjutkan AI, Proofread EBI, Outline Bab, Draf Dialog) tanpa perlu repot mendaftar ke Google AI Studio atau mengonfigurasi API Key secara mandiri.
Keamanan Sesuai Standar Industri (Server-Side Proxy):
API Key disimpan dengan aman di server (server.ts) melalui file lingkungan .env dan tidak pernah diekspos ke publik/browser client.
2. Kemudahan Pengaturan & Fleksibilitas Dual-Mode
Untuk memberikan fleksibilitas penuh, proyek ini kini dilengkapi dengan Sistem Dual-Mode API Key:
Default — 1 Key Terpusat Studio (Server Side):
Cukup isikan variabel GEMINI_API_KEY pada file .env proyek atauSecrets di AI Studio.
Semua penulis otomatis terhubung ke layanan AI.
Opsi Key Pribadi (Custom API Key):
Jika ada penulis yang ingin menggunakan kuota API Gemini mereka sendiri (misalnya untuk menghindari batas kuota gratis saat jam sibuk), mereka dapat mengeklik tombol "API Key" di halaman Asisten AI.
Kunci pribadi tersebut hanya disimpan secara lokal di peramban masing-masing penulis dan dikirimkan secara aman via request header (x-gemini-api-key).
3. Cara Mengisikan GEMINI_API_KEY pada Proyek
File /.env.example telah disediakan di dalam proyek:
code
Env
# GEMINI_API_KEY: Wajib untuk fitur Asisten AI Gemini
GEMINI_API_KEY="AIzaSy_GANTI_DENGAN_KEY_GEMINI_ANDA"
Langkah Konfigurasi:
Dapatkan API Key gratis di Google AI Studio. https://www.google.com/url?sa=E&q=https%3A%2F%2Faistudio.google.com%2Fapp%2Fapikey
Isikan kunci tersebut ke file .env pada variabel GEMINI_API_KEY.
Aplikasi siap digunakan oleh seluruh penulis di dalam Studio Buku!
 
### Bagikan Format Virtual Account (Untuk Transfer dari Bank)
Jika pengirim ingin mengirim uang lewat Mobile Banking atau ATM ke nomor HP e-wallet Anda, berikan teks instruksi berupa Kode Virtual Account + Nomor HP Anda. Berikut adalah daftarnya:

E-Wallet	Dari Bank	Format Kode & Nomor HP	Contoh
DANA	BCA	3901 + Nomor HP	39010812345678
DANA Mandiri	89508 + Nomor HP	895080812345678
GoPay	BCA	70001 + Nomor HP	700010812345678
GoPay	Mandiri	60737 + Nomor HP	607370812345678
OVO	BCA	39358 + Nomor HP	393580812345678
OVO	Mandiri	60001 + Nomor HP	600010812345678
---



---

┌────────────────────────┐
                    │ Permintaan Penulisan AI│
                    └───────────┬────────────┘
                                │
                                ▼
         ┌────────────────────────────────────────────────────────┐
         │       LOAD BALANCER & MULTI-KEY ROTATOR POOL           │
         │   (gemini-3.8-flash dengan SDK @google/genai)          │
         └───────────┬────────────┬────────────┬────────────┬─────┘
                     │            │            │            │
                     ▼            ▼            ▼            ▼
             [Key #1: 🔑] [Key #2: 🔑] [Key #3: 🔑] [Key #4: 🔑] [Key #5: 🔑]
                     │
          (Jika Key #1 kena 429)
                     │
                     └──► Otomatis Melompat ke Key #2 ──► Berhasil!


🛠️ Komponen yang Diterapkan:
1. Modul Rotator & Fallback Terpusat (src/server/geminiPool.ts)
Membaca 5 Kunci Cloudflare Secrets / Environment:
GEMINI_API_KEY_1
GEMINI_API_KEY_2
GEMINI_API_KEY_3
GEMINI_API_KEY_4
GEMINI_API_KEY_5
(Serta fallback otomatis ke GEMINI_API_KEY default atau Kunci Kustom peramban jika diisi).
Load Balancing (Round-Robin & Acak):
Bebas dari penumpukan beban pada satu akun Google; setiap permintaan AI baru didistribusikan secara bergantian ke pool kunci yang aktif.
Otomatis Fallback HTTP 429 (Rate Limit / Quota Exceeded):
Jika sebuah kunci mencapai batas kuota per menit (RPM) atau per hari (RPD), server langsung menangkap kode status 429 / RESOURCE_EXHAUSTED, mencatat peringatan di log, dan seketika mencoba kunci berikutnya dalam pool secara transparan tanpa membuat proses pengguna gagal.
Model Terpilih:
Menggunakan gemini-3.8-flash sebagai model utama yang cepat dan cerdas untuk analisis naskah, pembuatan outline, dialog, dan evaluasi plot.
2. Endpoint Backend Terintegrasi (server.ts)
POST /api/ai/assist: Digunakan bersama oleh Asisten AI (Halaman Menu Menulis) dan Editor Bab (fitur Lanjutkan Teks & Perbaiki Ejaan).
GET /api/ai/pool-status: Menyediakan informasi jumlah kunci aktif di pool dan model yang sedang berjalan.
3. UI Asisten AI & Indikator Transparansi (AiAssistantView.tsx)
Menampilkan badge status pool: Pool: X Key Aktif (Load Balanced & Fallback 429).
Setiap respons AI menampilkan informasi kunci yang mengeksekusi (contoh: ✨ Key #2 dari 5 Pool (gemini-3.8-flash)).
Modal Pengaturan Kunci memberikan panduan pengisian rahasia di Cloudflare Environment Variables serta tetap mengizinkan penulis memasukkan API Key pribadi jika diinginkan.
4. Konfigurasi Lingkungan (.env.example)
Variabel telah didefinisikan secara rapi di .env.example:

# Cloudflare Variables & Secrets - Pool 5 Gemini API Keys
GEMINI_API_KEY_1=
GEMINI_API_KEY_2=
GEMINI_API_KEY_3=
GEMINI_API_KEY_4=
GEMINI_API_KEY_5=
GEMINI_API_KEY=


Dengan sistem ini, batas kuota Free Tier aplikasi Anda kini dapat dilipatgandakan hingga 5 kali lipat (hingga 75 RPM dan 7.500 RPD) tanpa khawatir mengalami service interruption saat lalu lintas penulisan sedang ramai!

---

Berikut adalah panduan lengkap mengenai arsitektur SQL yang benar untuk naskah buku (Author, Project, dan Chapters) sesuai standar database relasional aplikasi ini (Cloudflare D1 / SQLite), serta teknik & formula prompt AI agar menghasilkan SQL konten novel/buku lengkap tanpa terpotong atau error sintaks.
1. Rekonstruksi SQL Relasional yang Benar
Dalam aplikasi Studio Buku (Cloudflare D1 / SQLite), struktur relasional dirancang dengan prinsip Integritas Relasional (Foreign Key) & Atomic Transaction:

[ authors / users ]
       │ 1
       │ (ownerId)
       ▼ *
   [ projects ] ───────┐ 1
       │               │
       │ (projectId)   │ (projectId)
       ▼ *             ▼ *
  [ chapters ]    [ glossary / ideas ]



Aturan Kunci Konstruksi SQL:
Urutan Eksekusi (Parent ke Child):
Buat authors terlebih dahulu.
Buat projects (mengacu pada ownerId).
Buat chapters (mengacu pada projectId).
Kolom "order" adalah SQL Reserved Keyword:
Di SQL, kata order (seperti pada ORDER BY) adalah kata cadangan. Wajib dibungkus tanda kutip dua: "order".
Escaping Tanda Petik Tunggal ('):
Di SQL, dialog seperti Jum'at atau don't akan membuat query error. Karakter petik tunggal harus di-escape menjadi dua petik tunggal: '' (contoh: 'Jum''at itu gerimis...').
Gunakan BEGIN TRANSACTION & COMMIT:
Memastikan bahwa buku dan 8 babnya masuk sekaligus secara utuh (atomic).
Contoh Konstruksi SQL yang Valid:

BEGIN TRANSACTION;

-- 1. Penulis (Author)
INSERT OR IGNORE INTO authors (id, name, role, avatar, color)
VALUES (
  'auth_roy',
  'Roy Wikan',
  'Lead Author',
  '👨‍💼',
  '#3b82f6'
);

-- 2. Proyek Buku (Project)
INSERT INTO projects (
  id, title, subtitle, genre, synopsis, createdAt, isPrivate, ownerId, ownerName, coAuthors
) VALUES (
  'proj_kronik_nusantara',
  'Kronik Nusantara 2045',
  'Fajar Kebangkitan Kepulauan Megapolis',
  'Sci-Fi Nusantara',
  'Di era pasca-transisi energi 2045, seorang insinyur maritim menemukan relik komputasi kuantum kuno di kedalaman Palung Jawa...',
  '2026-10-02T10:00:00.000Z',
  0, -- 0 = Publik, 1 = Privat
  'auth_roy',
  'Roy Wikan',
  '[]'
);

-- 3. Bab-Bab (Chapters 1 s/d 8)
INSERT INTO chapters (
  id, projectId, title, subtitle, content, "order", status, lastEditedBy, updatedAt
) VALUES 
(
  'chap_kronik_01',
  'proj_kronik_nusantara',
  'Bab 1: Sinyal dari Palung Dalam',
  'Frekuensi Tak Dikenal di Laut Sunda',
  'Hujan lebat mengguyur anjungan kapal riset Baruna V saat sensor sonar mendadak merekam gelombang berulang...',
  1,
  'published',
  'Roy Wikan',
  '2026-10-02T10:00:00.000Z'
),
(
  'chap_kronik_02',
  'proj_kronik_nusantara',
  'Bab 2: Jejak Selat Sunda',
  'Dekripsi Sandi Pertama',
  'Layar monitor di ruang kendali berkedip ritmis. Deretan heksadesimal kuno itu bukan berasal dari satelit...',
  2,
  'published',
  'Roy Wikan',
  '2026-10-02T10:15:00.000Z'
);
-- ... dilanjutkan sampai Bab 8

COMMIT;

2. Tantangan AI: Mengapa Meminta 8 Bab x 1500 Kata Sekaligus Sering Gagal?
Jika Anda meminta AI menghasilkan 8 bab × 1.500 kata = 12.000 kata (±16.000 token) dalam satu kali prompt tunggal:
Batas Output Token AI: Kebanyakan model AI memiliki batas maksimal output per respons sekitar 4.096 hingga 8.192 token (setara 3.000 – 6.000 kata). AI akan terpotong di tengah jalan (truncated).
Halusinasi Peringkasan (Cheating): Karena kehabisan ruang output, AI akan "meringkas" cerita menjadi hanya 100–200 kata per bab demi menyelesaikan instruksi 8 bab.


3. Strategi Prompt yang Efektif
Gunakan 2 Langkah Terarah:
Langkah 1: Buat Kerangka Buku & Bab (Skema Dasar SQL)
Minta AI membuat struktur projects, authors, dan sinopsis/outline 8 bab.
Langkah 2: Generate Isi Cerita Panjang per Bab (atau per 2 Bab)
Setiap bab benar-benar ditulis sepanjang 1.500 kata dengan format INSERT INTO chapters.
4. Template Prompt AI yang Siap Digunakan
Salin prompt di bawah ini ke AI (ChatGPT, Claude, atau Gemini):
📝 Prompt Tahap 1: Inisialisasi Proyek & Outline 8 Bab

Kamu adalah database engineer dan novelis handal. Buatkan skrip SQL SQLite / Cloudflare D1 untuk proyek buku baru dengan skema berikut:

Tabel projects:
id (TEXT), title (TEXT), subtitle (TEXT), genre (TEXT), synopsis (TEXT), createdAt (TEXT ISO), isPrivate (INTEGER: 0), ownerId (TEXT), ownerName (TEXT), coAuthors (TEXT JSON: '[]')

Tabel authors:
id (TEXT), name (TEXT), role (TEXT), avatar (TEXT emoji), color (TEXT hex)

Ketentuan:
1. Judul buku: [TULIS JUDUL / TOPIK BUKU ANDA]
2. Genre: [CONTOH: Fiksi Sejarah / Sci-Fi / Romansa]
3. Penulis: [NAMA PENULIS]
4. Tuliskan query BEGIN TRANSACTION; lalu INSERT INTO authors dan INSERT INTO projects dengan sinopsis mendalam (minimal 200 kata).
5. Buat juga outline daftar judul Bab 1 sampai Bab 8 beserta subtitelnya dalam bentuk komentar SQL.
6. Escape tanda petik tunggal (') menjadi ('').
7. Akhiri dengan COMMIT;



📝 Prompt Tahap 2: Menghasilkan Bab dengan Narasi 1.500+ Kata (Bisa per 1 atau 2 Bab)
Lanjutkan pembuatan isi naskah untuk Bab [SEBUTKAN, MISAL: Bab 1 dan Bab 2]. 
Format output HARUS berupa query SQL INSERT INTO chapters yang valid untuk SQLite / Cloudflare D1.

Skema tabel chapters:
id, projectId, title, subtitle, content, "order", status, lastEditedBy, updatedAt

Instruksi Kritis Penulisan:
1. Kolom "content" HARUS berisi cerita novel yang utuh, mendalam, kaya dialog dan deskripsi sensorik, dengan PANJANG MINIMAL 1.500 KATA untuk bab ini. Jangan membuat ringkasan, jangan gunakan bullet point, dan jangan memotong narasi.
2. Format teks konten: Gunakan paragraf normal dengan jeda baris ganda (\n\n) untuk dialog dan alinea baru.
3. ATURAN SQL ESCAPING (SANGAT PENTING): 
   - Semua tanda petik tunggal (') dalam narasi atau dialog (seperti kata: Jum'at, tak'kan, don't, 'halo') WAJIB di-escape menjadi dua petik tunggal ('') agar query SQL tidak rusak.
   - Kolom "order" wajib dibungkus tanda kutip ganda ("order").
   - Status bernilai 'published'.
4. projectId yang digunakan: '[SESUAIKAN_ID_PROJEK]'
5. Bungkus dalam:
   BEGIN TRANSACTION;
   INSERT INTO chapters (id, projectId, title, subtitle, content, "order", status, lastEditedBy, updatedAt) VALUES (...);
   COMMIT;


5. Rekomendasi Format Teks Multiline di SQL D1

Jika Anda mengeksekusi SQL ini langsung ke terminal Cloudflare D1 (wrangler d1 execute):
Di SQLite standar, string multi-baris di dalam petik tunggal 'paragraf 1\n\nparagraf 2' didukung penuh.
Jika tool CLI Anda sensitif terhadap karakter newline mentah (breakline), Anda bisa meminta AI menggabungkan baris dengan operator || char(10) || (seperti yang digunakan di fungsi internal toSqlString aplikasi ini).
Dengan pola 2 tahap ini, Anda dijamin mendapatkan panjang narasi 1.500+ kata per bab yang kaya sastra tanpa terkena pemotongan token AI dan 100% bebas dari SQL error.

















*Dokumen ini dibuat secara resmi untuk pengelolaan aplikasi Studio Buku (Nulis Buku Bareng Studio).*




