# Studio Buku (Nulis Buku Bareng)
# Dokumentasi Fitur Studio.Buku.biz.id
 
---
## Bab 1: Sistem Navigasi Utama (Header Bar)


Dokumentasi teknis fitur yang terdapat pada aplikasi web **Studio Buku ("Nulis Bareng")**:



### **Sistem Navigasi Utama (Header Bar)**

* **Identitas & Status**: Menampilkan logo/nama aplikasi "Studio Buku", sub-judul "Nulis Bareng", serta indikator status penyimpanan (*Saved*).
* **Modul Utama**:
* **Bab & Editor**: Modul navigasi struktur bab dan pengeditan teks utama.
* **Papan Gagasan**: Area perancangan ide/ideasi cerita.
* **Log Revisi**: Catatan riwayat perubahan naskah.
* **Pratinjau Buku**: Fitur peninjauan tampilan naskah sebelum dipublikasikan/diunduh.
* **Asisten AI**: Modul kecerdasan buatan terintegrasi untuk membantu proses penulisan.


* **Fitur Kolaborasi & Manajemen Aset**:
* **Manajemen Profil/Sesi**: Terintegrasi dengan akun pengguna aktif (misal: *Velvet Plum*).
* **Pintasan Pembuatan Bab Baru (`+ Bab Baru`)**: Tombol pintas untuk menambahkan bab naskah.
* **Impor & Undang**: Fitur untuk mengunggah berkas luar dan mengundang kolaborator dalam proyek naskah.





### **Panel Manajemen Struktur Naskah (Sidebar Kiri)**

* **Navigasi Tab**: Pengelompokan tampilan berdasarkan **Bab** dan **Glosarium**.
* **Kontrol Tambah (`+ Tambah`)**: Menambahkan elemen baru sesuai tab yang aktif.
* **Daftar Bab (Chapter List)**:
* Menampilkan daftar bab terstruktur lengkap dengan nomor urut, judul, deskripsi/sub-judul, serta penulis bab tersebut.
* **Label Status Workflow**: Menandai status bab (*FINAL*, *REVIEW*, atau *DRAFT*).
* **Aksi Cepat**: Tersedia tombol hapus/sumber daya pada tiap item bab.


* **Status Penyimpanan Otomatis**: Indikator status *AUTO-SAVE ON* beserta informasi Penulis Studio yang sedang aktif.



### **Bilah Alat Editor & Bantuan AI (Editor Toolbar)**

* **Aksi Utama**:
* **Statistik**: Panel *collapsible* untuk melihat serta mengatur performa dan target penulisan.
* **Selektor Status Bab**: Dropdown untuk mengubah status pengerjaan bab (misal dari *Review* ke *Final*).
* **Lanjutkan AI**: Generasi teks otomatis menggunakan bantuan AI berdasarkan teks yang sudah ada.
* **Proofread**: Pemeriksaan tata bahasa dan ejaan otomatis.
* **Simpan**: Tombol penyimpanan manual.





### **Panel Statistik & Target Penulisan (Dashboard Analytics)**

* **Pencapaian Target Penulisan**:
* Pilihan cakupan target: **Harian** atau **Proyek**.
* Visualisasi *Progress Bar* persentase pencapaian kata (misal: 108 / 1.000 kata = 11%) serta sisa kata yang harus dicapai.
* **Preset Target Cepat**: Tombol konfigurasi target harian (500, 1k, 2k, 3k kata).


* **Ringkasan Proyek**:
* **Jumlah Bab Proyek**: Informasi total bab, rata-rata kata/bab, serta rincian status (Final, Review, Draft).
* **Waktu Penulisan Proyek**: Melacak total durasi penulisan, estimasi waktu baca naskah, dan timer durasi sesi aktif saat ini.





### **Area Editor Teks Utama (Workspace)**

* **Status Bar Terintegrasi**: Informasi *real-time* jumlah kata bab aktif, total kata proyek, total bab, estimasi baca, serta stempel waktu *Tersimpan otomatis*.
* **Canvas Penulisan**: Editor naskah berformat teks kaya (*rich text*) yang mendukung tata letak paragraf dan dialog cerita secara langsung.

 
 ---
 
## Bab 2: Papan Gagasan Studio (Scratchpad)
 

Dokumentasi teknis fitur yang terdapat pada halaman **Papan Gagasan Studio (Scratchpad)** di platform **Studio Buku ("Nulis Bareng")**:






### **Fitur Utama Papan Gagasan Studio (Scratchpad)**

* **Sistem Penyaringan Ide (Category Filter)**
Tersedia tab filter cepat untuk mengelompokkan atau menampilkan catatan gagasan berdasarkan kategori:
* **Semua** (menampilkan total catatan, misal: *1*)
* **Plot**
* **Karakter**
* **Riset**
* **Dialog**
* **Lainnya**


* **Formulir Pembuatan Gagasan Baru (`+ Tambah Catatan Gagasan Baru`)**
* **Input Judul**: Kolom teks untuk memasukkan nama ide atau topik (misal: *Latar Belakang Tokoh...*).
* **Selektor Kategori**: Menu *dropdown* untuk memilih jenis ide (*Plot, Karakter, Riset, Dialog, Lainnya*).
* **Editor Detail**: Area input multi-baris (*text area*) untuk menuangkan detail sketsa, alur cerita, atau dialog.
* **Tombol Aksi**: Tombol `Simpan ke Papan Ide` untuk menambahkan catatan baru ke dalam daftar.


* **Kartu Ide/Gagasan (Idea Card Stream)**
Tampilan kartu berisi ide-ide yang sudah disimpan oleh tim:
* **Tag Kategori**: Label visual penanda kategori (misal: *Plot*).
* **Atribusi Penulis**: Keterangan pembuat catatan (misal: *Oleh Rian Hidayat*).
* **Judul & Isi Gagasan**: Menampilkan pokok ide (misal: *Simbol Kunci Inggris Tua*) beserta deskripsi/detail penjelasnya.
* **Stempel Waktu (Timestamp)**: Catatan waktu pembuatan atau pembaruan terakhir (misal: *1 Jan, 07.00*).

---
## Bab 3: Log Revisi & Aktivitas Studio


Dokumentasi teknis fitur yang terdapat pada halaman **Log Revisi & Aktivitas Studio** di platform **[Studio Buku](https://studio.buku.biz.id/)**:





### **Fitur Utama Log Revisi & Aktivitas Studio**

* **Deskripsi Modul (Sub-Header)**
Penjelasan fungsi modul sebagai pusat pemantauan riwayat aktivitas penulisan, penyuntingan bab, dan pembaruan naskah yang dilakukan oleh seluruh tim Penulis Studio.
* **Daftar Riwayat Aktivitas (Activity Timeline Stream)**
Kartu entri riwayat yang mencakup elemen-elemen berikut:
* **Ikon Jenis Aktivitas**: Visualisasi penanda tipe tindakan (misal: ikon dokumen/dokumen baru).
* **Identifikasi Bab & Judul**: Menampilkan konteks bab yang diubah (misal: *Bab 1: Stasiun Tugu Pukul Empat Sore*).
* **Stempel Waktu (Timestamp)**: Waktu spesifik ketika aktivitas dilakukan (misal: *Kam, 1 Jan, 07.00*).
* **Deskripsi Perubahan**: Keterangan rinci mengenai tindakan yang diambil (misal: *Membuat bab baru dan menulis draf awal*).
* **Atribusi Penulis**: Identitas anggota tim/penulis yang melakukan perubahan tersebut (misal: *Rian Hidayat*).


---
## Bab 4: Pratinjau Buku


Dokumentasi teknis fitur yang terdapat pada halaman **Pratinjau Buku (Pratinjau Studio)** di platform **[Studio Buku](https://studio.buku.biz.id/)**:





### **Fitur Utama Pratinjau Buku (Pratinjau Studio)**

* **Bilah Informasi Proyek (Sub-Header)**
* **Judul & Status**: Menampilkan nama proyek aktif (*Gema Di Ujung Senja • Pratinjau Studio*).
* **Lencana Statistik Teks**: Indikator total kata dan jumlah bab yang dimuat (misal: *180 Kata (2 Bab)*).


* **Bilah Kontrol Tampilan & Ekspor (Toolbar)**
* **Mode Tampilan Pratinjau**: Switcher untuk memilih tata letak bacaan: **Gulir Total** (menampilkan seluruh naskah secara terus-menerus) atau **Per Bab**.
* **Toggle Anotasi**: Tombol peluncur panel catatan layar (`Anotasi (0)`).
* **Fitur Ekspor & Publikasi**:
* **Preview HTML Publik**: Membuka tampilan web naskah yang siap dipublikasikan.
* **Ekspor Word (.docx)**: Mengunduh naskah dalam format Microsoft Word.
* **Ekspor PDF**: Mengunduh naskah dalam format PDF.
* **TXT**: Mengunduh naskah berformat teks polos.
* **Cetak**: Tombol cetak dokumen secara langsung.




* **Area Peninjauan Dokumen (Document Reader)**
* **Header Metadata**: Menampilkan versi naskah (*STUDIO BUKU • STUDIO EDITION*), judul utama (*Gema Di Ujung Senja*), genre (*Novel Fiksi Psikologis & Perjalanan Dua Jiwa*), serta sinopsis naskah.
* **Pengatur Tata Letak Bab**: Menampilkan bab naskah secara terstruktur lengkap dengan penomoran bab, judul bab (misal: *Bab 1: Stasiun Tugu Pukul Empat Sore*), deskripsi singkat, dan isi paragraf cerita.
* **Input Catatan Studio per Bab**: Kolom input cepat di setiap akhir bab (`Tulis ide baru atau revisi di bab ini...`) untuk menambahkan anotasi khusus pada bab terkait.


* **Panel Samping Anotasi (Catatan Studio Side-Panel)**
* **Drawer Anotasi**: Panel terpisah di sisi kanan layar untuk melihat daftar catatan, revisi, atau anotasi layar yang telah dibuat.
* **Status Kosong**: Menampilkan indikator jika belum ada anotasi yang ditambahkan (`Belum ada catatan atau anotasi layar yang dibuat.`) beserta tombol tutup panel (`✕`).

---
## Bab 5: Asisten AI (Gemini Copilot)


Dokumentasi teknis fitur yang terdapat pada halaman **Asisten AI (Gemini Copilot)** di platform **[Studio Buku](https://studio.buku.biz.id/)**:






### **Fitur Utama Asisten AI (Gemini Copilot)**

* **Header Modul & Indikator Konfigurasi**
* **Identitas Fitur**: Menampilkan judul **Asisten AI Studio Buku (Gemini Copilot)** beserta deskripsi perannya sebagai mitra diskusi kreatif naskah.
* **Status Kunci API**: Menampilkan indikator status *API Key: Terpusat Proyek*.


* **Modul Prompt Presets (Mode Diskusi AI)**
Pilihan tombol *mode* bertema untuk memfokuskan bantuan kecerdasan buatan sesuai kebutuhan naskah:
* **Outline Bab**: Membantu merancang alur cerita per bab.
* **Konflik / Twist**: Membantu mencari ide kejutan plot atau pemicu masalah.
* **Draf Dialog**: Generasi atau penyempurnaan pertukaran kata antar tokoh.
* **Tanya AI Studio**: Fitur konsultasi umum seputar penulisan cerita.


* **Area Interaksi & Input Prompt (Workspace)**
* **Formulir Input Catatan**: Area teks (*text area*) interaktif dengan petunjuk `Premis atau Catatan Awal untuk Outline Bab:` untuk memasukkan detail/konsep awal cerita.
* **Tombol Eksekusi**: Tombol `Kirim ke Asisten AI` untuk memproses prompt dan mengirimkan permintaan ke modul AI.

