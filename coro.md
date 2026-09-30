# Panduan Instalasi & Deploy Studio Buku ke Cloudflare (Pages / Workers)

Dokumen ini berisi panduan resmi langkah demi langkah untuk menginstal dan mengoperasikan aplikasi **Studio Buku** dari repository GitHub `/bookstudio` ke infrastruktur **Cloudflare** menggunakan **Cloudflare D1 Database** dan domain kustom `studio.buku.biz.id`.

---

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

*Dokumen ini dibuat secara resmi untuk pengelolaan aplikasi Studio Buku (Nulis Buku Bareng Studio).*
