# Panduan Resmi: Memperoleh, Mengonfigurasi, dan Membayar Gemini API di Studio.Buku

Dokumen ini dirangkum untuk membantu Anda memahami cara menggunakan Gemini API secara **gratis**, batasan penggunaannya (*Rate Limits*), serta panduan lengkap metode pembayaran resmi bagi pengguna di **Indonesia**.

---

## 1. Cara Menggunakan Gemini API Secara Gratis (Free Tier)

Google menyediakan akses **Free Tier** yang sangat royal bagi pengembang melalui [Google AI Studio](https://aistudio.google.com). 

### Ketentuan Free Tier:
- **Biaya:** Rp 0 (Sepenuhnya gratis).
- **Model yang Tersedia:** Model efisien dan cepat seperti `gemini-flash-latest`, `gemini-3.1-flash-lite`, dan `gemini-3.8-flash`.
- **Cara Mengaktifkan:**
  1. Buka [Google AI Studio](https://aistudio.google.com).
  2. Masuk menggunakan akun Google (Gmail) Anda.
  3. Klik **"Get API key"** dan buat kunci baru.
  4. Masukkan kunci tersebut ke variabel `GEMINI_API_KEY` di proyek Anda.

### Batasan Penting (Rate Limits) Free Tier:
Berikut adalah rincian batasan (*Rate Limits*) untuk penggunaan **Free Tier** di [Google AI Studio](https://aistudio.google.com):

* **RPM (Requests Per Minute):** Maksimal **15 permintaan per menit**.
* **TPM (Tokens Per Minute):** Maksimal **1.000.000 token per menit** (mencakup total teks input dan output).
* **RPD (Requests Per Day):** Maksimal **1.500 permintaan per hari**.

---

### Catatan Penting Mengenai Layanan Gratis:
* **Penggunaan Data:** Pada tingkat *Free Tier*, data/prompt yang dikirimkan dapat digunakan oleh Google untuk perbaikan dan pengembangan model (dengan proses anonimisasi). Jika memerlukan kerahasiaan data tingkat tinggi (*privacy mode*), disarankan beralih ke layanan *Pay-as-you-go*.
* **Penanganan Limit di Aplikasi:** Jika aplikasi melebihi batasan tersebut, API akan mengembalikan respons kode error `429 (Too Many Requests)`.

---

## 2. Berbagai Cara Bayar / Beli Paket AI Google untuk Pengguna di Indonesia

Jika aplikasi Anda berkembang dan membutuhkan kuota tanpa batas (*Pay-as-you-go* atau model *Pro* tingkat lanjut), Anda dapat beralih ke paket berbayar resmi melalui **Google Cloud Billing**. 

Google menyediakan sistem penagihan berbasis pemakaian (*Pay-as-you-go*), di mana Anda hanya membayar sesuai jumlah token yang dikonsumsi (tidak ada biaya langganan bulanan tetap yang mahal).

### Metode Pembayaran yang Didukung untuk Pengguna di Indonesia:

1. **Kartu Kredit & Kartu Debit Berlogo Visa / MasterCard / JCB:**
   - Bank lokal Indonesia seperti **BCA (Mastercard/Visa), Mandiri (Visa), BNI (Mastercard/Visa), BRI (Mastercard/Visa), Permata, Danamon**, serta bank digital seperti **Bank Jago, Jenius (BTPN), Blu by BCA Digital**, dan **Seabank** yang mendukung transaksi internasional (*online/e-commerce* aktif).
   - *Catatan:* Pastikan fitur transaksi luar negeri (*international transaction*) di aplikasi perbankan Anda aktif.

2. **PayPal:**
   - Anda dapat menautkan akun PayPal Anda ke metode pembayaran Google Cloud Billing (pastikan akun PayPal memiliki saldo atau sumber dana dari kartu debit/kredit yang terhubung).

3. **Google Play Billing / Saldo Google Play (untuk Kasus Tertentu):**
   - Sebagian layanan konsumen Google mendukung metode pembayaran lokal Indonesia seperti **GoPay, DANA, OVO, ShopeePay**, atau **Pulsa seluler (Telkomsel, Indosat, XL)** melalui Google Play. Namun, untuk **Google Cloud Console / Google AI Studio (API Enterprise/Paid)**, metode utama yang diterima adalah Kartu Kredit/Debit berlogo internasional atau PayPal.

### Cara Upgrade ke Berbayar (Pay-as-you-go):
1. Masuk ke [Google Cloud Console](https://console.cloud.google.com/) atau melalui menu penagihan di Google AI Studio.
2. Buat profil penagihan (*Billing Profile*).
3. Pilih Negara: **Indonesia**.
4. Masukkan informasi kartu debit/kredit berlogo Visa/Mastercard atau akun PayPal Anda.
5. Google akan melakukan verifikasi saldo kecil (biasanya langsung dikembalikan otomatis) untuk memastikan kartu aktif.

---

## 3. Pemasangan & Keamanan API Key di  Studio.Buku

Untuk memasang API key (baik gratis maupun berbayar) di aplikasi ini:

1. Buka file `.env` di akar proyek:
   ```env
   GEMINI_API_KEY="AIzaSyYourApiKeyHere..."
   ```
2. Server backend Express (`server.ts`) secara otomatis membaca kunci ini dan melayani permintaan AI dari frontend dengan aman.
