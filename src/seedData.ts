import { Project, Chapter, Author, DB } from "./types";

export function slugify(text: string): string {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "naskah";
}

export const SEED_AUTHORS: Author[] = [
  { id: "auth_1", name: "Rian Hidayat", role: "Penulis Utama", avatar: "👨‍💻", color: "bg-emerald-500" },
  { id: "auth_2", name: "Kirana Maharani", role: "Penulis Studio", avatar: "👩‍🎨", color: "bg-indigo-500" },
  { id: "auth_3", name: "Bagus Setiawan", role: "Riset & Peneliti", avatar: "🎓", color: "bg-amber-500" },
  { id: "auth_4", name: "Siti Rahmania", role: "Editor Naskah", avatar: "📚", color: "bg-rose-500" }
];

const RAW_PROJECT_LIST = [
  { title: "Gema Di Ujung Senja", subtitle: "Novel Fiksi Psikologis & Perjalanan Dua Jiwa", genre: "Fiksi / Drama", owner: "Rian Hidayat", ownerId: "auth_1" },
  { title: "Lembayung Kotabaru", subtitle: "Misteri Berkas Tua 1965", genre: "Misteri & Detektif", owner: "Kirana Maharani", ownerId: "auth_2" },
  { title: "Sandi Dibalik Candi", subtitle: "Perjalanan Arkeologis Di Lembah Progo", genre: "Akademik & Riset", owner: "Rian Hidayat", ownerId: "auth_1" },
  { title: "Bunga Rumput Samudra", subtitle: "Antologi Puisi & Narasi Pesisir", genre: "Biografi & Memoar", owner: "Kirana Maharani", ownerId: "auth_2" },
  { title: "Pelaut Malam Dan Bintang", subtitle: "Novel Fiksi Sejarah Bahari", genre: "Fiksi / Sejarah", owner: "Rian Hidayat", ownerId: "auth_1" },
  { title: "Cahaya Di Balik Kabut", subtitle: "Pengembangan Diri & Ketenangan Jiwa", genre: "Pengembangan Diri", owner: "Kirana Maharani", ownerId: "auth_2" },
  { title: "Detektif Batavia 1920", subtitle: "Penyelewengan Di Pelabuhan Tanjung Priok", genre: "Misteri & Detektif", owner: "Rian Hidayat", ownerId: "auth_1" },
  { title: "Riset Kecerdasan Buatan & Etika", subtitle: "Tinjauan Etis AI Dalam Pendidikan Tinggi", genre: "Sains & Teknologi", owner: "Bagus Setiawan", ownerId: "auth_3" },
  { title: "Jejak Langkah Di Pasar Beringharjo", subtitle: "Etnografi Sosial Pedagang Jamu Tradisional", genre: "Sosiologi & Budaya", owner: "Siti Rahmania", ownerId: "auth_4" },
  { title: "Rahasia Kedai Kopi Tua", subtitle: "Perbincangan Hangat Di Sudut Kota", genre: "Fiksi / Drama", owner: "Rian Hidayat", ownerId: "auth_1" },

  { title: "Babad Serayu Dan Sungai Jiwa", subtitle: "Kisah Peradaban Lembah Sungai Serayu", genre: "Sejarah & Kebudayaan", owner: "Kirana Maharani", ownerId: "auth_2" },
  { title: "Menulis Tanpa Rasa Takut", subtitle: "Panduan Menembus Blok Kreatif Penulis Naskah", genre: "Pengembangan Diri", owner: "Rian Hidayat", ownerId: "auth_1" },
  { title: "Bayang-Bayang Di Atas Candi Prambanan", subtitle: "Teka-Teki Arsitektur Zaman Mataram Kuno", genre: "Misteri & Detektif", owner: "Bagus Setiawan", ownerId: "auth_3" },
  { title: "Logika Dan Logika Hati", subtitle: "Dialektika Filsafat Modern Dan Realitas", genre: "Filsafat & Riset", owner: "Rian Hidayat", ownerId: "auth_1" },
  { title: "Jejak Pengembara Parahyangan", subtitle: "Memoar Perjalanan Di Pegunungan Bandung Selatan", genre: "Biografi & Memoar", owner: "Kirana Maharani", ownerId: "auth_2" },
  { title: "Nyanyian Angin Kotagede", subtitle: "Antologi Prosa Liris Pengrajin Perak", genre: "Puisi & Prosa", owner: "Siti Rahmania", ownerId: "auth_4" },
  { title: "Dilema Dosen Muda", subtitle: "Catatan Humoris Di Ruang Dosen Dan Kelas", genre: "Komedi & Satir", owner: "Bagus Setiawan", ownerId: "auth_3" },
  { title: "Penjaga Gerbang Merapi", subtitle: "Kisah Mitos Dan Sains Di Lereng Gunung", genre: "Fantasi & Folklor", owner: "Rian Hidayat", ownerId: "auth_1" },
  { title: "Peta Harta Karun Banda Neira", subtitle: "Petualangan Rempah Dan Jejak Benteng Nassau", genre: "Petualangan Sejarah", owner: "Kirana Maharani", ownerId: "auth_2" },
  { title: "Seni Fokus Di Era Distraksi", subtitle: "Strategi Menjaga Atensi Dan Produktivitas", genre: "Pengembangan Diri", owner: "Rian Hidayat", ownerId: "auth_1" },

  { title: "Jejak Sandi Di Keraton Ngayogyakarta", subtitle: "Misteri Lembaran Surat Utusan Belanda", genre: "Misteri & Detektif", owner: "Bagus Setiawan", ownerId: "auth_3" },
  { title: "Sepiring Nasi Kucing Dan Mitos Kota", subtitle: "Etnografi Kuliner Angkringan Malam", genre: "Sosiologi & Budaya", owner: "Siti Rahmania", ownerId: "auth_4" },
  { title: "Jurnal Pengamatan Bintang Menoreh", subtitle: "Catatan Astronomi Amatir Di Ketinggian", genre: "Sains & Teknologi", owner: "Rian Hidayat", ownerId: "auth_1" },
  { title: "Melodi Terakhir Di Bangsal Srimimpi", subtitle: "Kisah Pemusik Keroncong Dan Kenangan Tua", genre: "Fiksi / Drama", owner: "Kirana Maharani", ownerId: "auth_2" },
  { title: "Bunga Kamboja Di Tepi Danau Toba", subtitle: "Kisah Romansa Dan Janji Di Tepi Air", genre: "Fiksi / Romansa", owner: "Siti Rahmania", ownerId: "auth_4" },
  { title: "Filosofi Batik Tulis & Garis Hidup", subtitle: "Simbolisme Motif Parang Dan Kawung", genre: "Sejarah & Kebudayaan", owner: "Kirana Maharani", ownerId: "auth_2" },
  { title: "Ekosistem Hutan Mangrove Pesisir", subtitle: "Riset Ketahanan Pantai Dan Keanekaragaman Hayati", genre: "Akademik & Riset", owner: "Bagus Setiawan", ownerId: "auth_3" },
  { title: "Catatan Harian Guru Di Pelosok Asmat", subtitle: "Perjuangan Literasi Di Tepian Sungai", genre: "Biografi & Memoar", owner: "Rian Hidayat", ownerId: "auth_1" },
  { title: "Misteri Manuskrip Daun Lontar Bali", subtitle: "Teka-Teki Aksara Kawi Yang Hilang", genre: "Misteri & Detektif", owner: "Bagus Setiawan", ownerId: "auth_3" },
  { title: "Algoritma Jiwa Dan Kesadaran Digital", subtitle: "Eksplorasi Filsafat Teknologi Masa Depan", genre: "Sains & Teknologi", owner: "Rian Hidayat", ownerId: "auth_1" },

  { title: "Kerajaan Air Di Lembah Bogowonto", subtitle: "Kisah Legenda Dan Penjaga Sungai", genre: "Fantasi & Folklor", owner: "Kirana Maharani", ownerId: "auth_2" },
  { title: "Sketsa Kota Tua Batavia", subtitle: "Arsitektur Bangunan Kolonial Dan Restorasi", genre: "Sejarah & Kebudayaan", owner: "Bagus Setiawan", ownerId: "auth_3" },
  { title: "Skripsi Lima Tahun Dan Kopi Dingin", subtitle: "Kisah Suka Duka Mahasiswa Tingkat Akhir", genre: "Komedi & Satir", owner: "Siti Rahmania", ownerId: "auth_4" },
  { title: "Jejak Perdagangan Rempah Di Maluku", subtitle: "Analisis Historis Jalur Pelayaran Nusantara", genre: "Sejarah & Kebudayaan", owner: "Bagus Setiawan", ownerId: "auth_3" },
  { title: "Rahasia Rumah Panggung Bugis", subtitle: "Kajian Konstruksi Kayu Dan Ketahanan Gempa", genre: "Akademik & Riset", owner: "Rian Hidayat", ownerId: "auth_1" },
  { title: "Metode Penelitian Kualitatif Kritis", subtitle: "Panduan Praktis Untuk Mahasiswa Dan Peneliti", genre: "Akademik & Riset", owner: "Bagus Setiawan", ownerId: "auth_3" },
  { title: "Harmoni Gong Dan Angklung Parahyangan", subtitle: "Pelestarian Seni Pertunjukan Tradisional", genre: "Sejarah & Kebudayaan", owner: "Kirana Maharani", ownerId: "auth_2" },
  { title: "Melintasi Garis Khatulistiwa Pontianak", subtitle: "Catatan Perjalanan Di Tepian Sungai Kapuas", genre: "Biografi & Memoar", owner: "Rian Hidayat", ownerId: "auth_1" },
  { title: "Kisah Pendaki Di Puncak Rinjani", subtitle: "Petualangan Persahabatan Dan Survival", genre: "Fiksi / Petualangan", owner: "Kirana Maharani", ownerId: "auth_2" },
  { title: "Komunikasi Interpersonal Di Era Siber", subtitle: "Dampak Media Sosial Terhadap Hubungan Manusia", genre: "Sosiologi & Budaya", owner: "Siti Rahmania", ownerId: "auth_4" },

  { title: "Senandung Hujan Di Lembah Harau", subtitle: "Kisah Pertemuan Dua Peneliti Geologi", genre: "Fiksi / Romansa", owner: "Rian Hidayat", ownerId: "auth_1" },
  { title: "Hukum Adat Dan Keadilan Pesisir", subtitle: "Kajian Normatif Kesepakatan Nelayan Lokal", genre: "Akademik & Riset", owner: "Bagus Setiawan", ownerId: "auth_3" },
  { title: "Bintang Fajar Di Atas Bukit Sikunir", subtitle: "Inspirasi Perjalanan Menemukan Impian", genre: "Pengembangan Diri", owner: "Siti Rahmania", ownerId: "auth_4" },
  { title: "Antologi Cerita Rakyat Nusantara", subtitle: "Warisan Lisan Dari Sabang Sampai Merauke", genre: "Fantasi & Folklor", owner: "Kirana Maharani", ownerId: "auth_2" },
  { title: "Psikologi Menulis Dan Hambatan Kreatif", subtitle: "Memahami Pikiran Dan Alur Ide Penulis", genre: "Pengembangan Diri", owner: "Rian Hidayat", ownerId: "auth_1" },
  { title: "Catatan Dokter Di Rumah Sakit Lapangan", subtitle: "Kisah Duka Dan Harapan Di Daerah Bencana", genre: "Biografi & Memoar", owner: "Siti Rahmania", ownerId: "auth_4" },
  { title: "Jejak Arsitektur Kolonial Di Surabaya", subtitle: "Penelusuran Bangunan Bersejarah Kota Pahlawan", genre: "Sejarah & Kebudayaan", owner: "Bagus Setiawan", ownerId: "auth_3" },
  { title: "Teka-Teki Di Perpustakaan Nasional", subtitle: "Investigasi Pencurian Dokumen Langka", genre: "Misteri & Detektif", owner: "Rian Hidayat", ownerId: "auth_1" },
  { title: "Astronomi Tradisional Dan Pranata Mangsa", subtitle: "Kearifan Lokal Petani Jawa Menghitung Musim", genre: "Sains & Kebudayaan", owner: "Bagus Setiawan", ownerId: "auth_3" },
  { title: "Menemukan Makna Di Usia Dewasa Muda", subtitle: "Navigasi Karir Dan Kesehatan Mental", genre: "Pengembangan Diri", owner: "Siti Rahmania", ownerId: "auth_4" },

  { title: "Jejak Kereta Api Tua Jalur Bedono", subtitle: "Sejarah Lokomotif Uap Dan Jalur Bergigi", genre: "Sejarah & Kebudayaan", owner: "Rian Hidayat", ownerId: "auth_1" },
  { title: "Kopi Hujan Dan Kalimat Belum Selesai", subtitle: "Kumpulan Cerita Pendek Kehidupan", genre: "Fiksi / Prosa", owner: "Kirana Maharani", ownerId: "auth_2" },
  { title: "Etika Kedokteran Dan Masa Depan Bioteknologi", subtitle: "Analisis Kebijakan Kesehatan Modern", genre: "Akademik & Riset", owner: "Bagus Setiawan", ownerId: "auth_3" },
  { title: "Misteri Lonceng Kapal VOC Yang Hilang", subtitle: "Penyelidikan Artefak Laut Jawa", genre: "Misteri & Detektif", owner: "Rian Hidayat", ownerId: "auth_1" },
  { title: "Tata Kelola Kota Berkelanjutan", subtitle: "Strategi Ruang Hijau Dan Transportasi Publik", genre: "Akademik & Riset", owner: "Bagus Setiawan", ownerId: "auth_3" },
  { title: "Kumpulan Esai Kebudayaan Kontemporer", subtitle: "Refleksi Perubahan Sosial Dan Otentisitas", genre: "Sosiologi & Budaya", owner: "Siti Rahmania", ownerId: "auth_4" },
  { title: "Kisah Pengrajin Keramik Plered", subtitle: "Tradisi Gerabah Kayu Dan Daya Tahan Ekspor", genre: "Sejarah & Kebudayaan", owner: "Kirana Maharani", ownerId: "auth_2" },
  { title: "Menembus Kabut Gunung Bromo", subtitle: "Petualangan Fotografer Alam Di Kaldera", genre: "Petualangan", owner: "Rian Hidayat", ownerId: "auth_1" },
  { title: "Sosiologi Pasar Tradisional Di Era Digital", subtitle: "Pergeseran Pola Transaksi Dan Ikatan Sosial", genre: "Sosiologi & Budaya", owner: "Siti Rahmania", ownerId: "auth_4" },
  { title: "Lorong Waktu Di Kampung Cyber Jogja", subtitle: "Novel Fiksi Spekulatif Teknologi Dan Tradisi", genre: "Fiksi / Spekulatif", owner: "Rian Hidayat", ownerId: "auth_1" }
];

const CHAPTER_TEMPLATES = [
  {
    title: "Bab 1: Awal Mula Dan Suasana Pagi",
    subtitle: "Langkah Pertama Di Pintu Masuk",
    content: `Pagi itu, kabut tipis masih menggantung rendah di atas pepohonan tua. Suara dentang lonceng gereja tua di kejauhan terdengar samar, berpadu dengan deru mesin sepeda motor tua yang melintas pelan di jalan berbatu.

Saya menatap lembaran kertas kusam di atas meja kayu. Aromanya khas—perpaduan antara kertas lapuk, tinta cina tua, dan sedikit aroma kelembapan tanah yang tersisa dari hujan semalam. Di sinilah semuanya bermula. Sebuah perjalanan panjang yang tidak pernah saya bayangkan sebelumnya.

"Apakah kamu yakin berkas ini asli?" tanya Broto sambil mengembuskan asap rokok kreteknya. Matanya yang sembab menatap tajam ke arah stempel merah pudar di sudut kanan bawah dokumen.

"Stempel ini menggunakan tinta pigmen merah raksasa zaman kolonial," jawabku pelan. "Hanya ada tiga instansi di Jawa Tengah yang menggunakan stempel unik ini pada tahun 1930-an. Kita tidak sedang memegang dokumen biasa, Broto."

Dia terdiam sejenak. Tangannya yang kasar menyentuh pinggiran kertas dengan sangat hati-hati, seolah takut lembaran sejarah itu akan hancur menjadi debu jika tersentuh terlalu keras.`
  },
  {
    title: "Bab 2: Jejak Pertama Dan Pengamatan",
    subtitle: "Menelusuri Bukti Yang Tersisa",
    content: `Menelusuri jejak masa lalu membutuhkan kesabaran yang luar biasa. Kami melangkah menyusuri lorong sempit di belakang kompleks bangunan tua Kotabaru. Dinding-dinding bata tebal berwarna putih kusam tampak terkelupas di beberapa bagian, memperlihatkan susunan bata merah tua buatan pabrik lokal zaman kolonial.

Di sudut lorong, seorang lelaki tua sedang merapikan lembaran koran bekas. Ia mengamati kedatangan kami dengan pandangan curiga. Di kota seperti ini, kehadiran dua orang asing yang membawa buku catatan tebal dan kamera tua selalu memancing pertanyaan.

"Pak, apakah Bapak ingat siapa yang dulu tinggal di rumah sudut itu sebelum tahun 1970?" tanyaku dengan nada sehalus mungkin, sambil menyodorkan sebotol minuman hangat.

Lelaki tua itu membetulkan letak kacamata tebalnya. "Rumah itu dulu milik Meneer Van Der Berg. Tapi setelah peristiwa pertengahan dekade enam puluhan, rumah itu dikosongkan. Banyak dokumen yang dibakar di halaman belakang, tapi konon ada satu peti yang dimasukkan ke dalam sumur tua."

Pernyataan itu membuat jantungku berdegup lebih kencang. Peti di sumur tua!`
  },
  {
    title: "Bab 3: Dialektika Dan Rahasia Tersembunyi",
    subtitle: "Membuka Lembaran Baru",
    content: `Diskusi malam itu berlangsung hangat di kedai kopi kecil tak jauh dari stasiun. Di bawah pendar lampu kuning remang-remang, kami membentangkan peta topografi wilayah Progo tahun 1928.

"Jika kita melihat garis kontur ini," kataku sambil menunjuk garis meliuk warna cokelat tua, "aliran sungai zaman dulu berbelok tepat di sebelah barat bukit. Artinya, lokasi candi yang hilang tidak mungkin berada di lembah utara."

Siti, kawan peneliti kami dari bidang arkeologi, mengangguk setuju. "Data epigrafi yang saya baca dari prasasti batu hitam mendukung analisis itu. Ada sebutan 'Watang Anum' yang merujuk pada pemukiman di tepi barat sungai, bukan di lembah."

Saling silang argumen akademis ini menjadi bahan bakar utama proyek penulisan kami. Setiap fakta tidak langsung diterima begitu saja. Harus ada verifikasi lapangan, pembandingan dokumen silang, dan wawancara dengan sesepuh desa setempat.

"Menulis naskah seperti ini," ujar Siti sambil menyeruput kopi gayo hangatnya, "bukan sekadar merangkai kata indah, melainkan menyusun kembali puzzle kehidupan manusia yang sempat terputus oleh waktu."`
  },
  {
    title: "Bab 4: Konflik Dan Ketegangan Lapangan",
    subtitle: "Titik Balik Penyelidikan",
    content: `Siang hari di pertengahan musim hujan. Hujan deras tiba-tiba mengguyur lereng bukit, mengubah jalan tanah menjadi lumpur lengket yang menyulitkan langkah kami. Sepeda motor kami terpaksa ditinggalkan di pinggir warung warga.

Saat kami mendekati lokasi sumur tua di belakang bangunan kosong, kami menyadari ada jejak kaki segar di atas tanah berlumpur. Seseorang telah mendahului kami!

"Hati-hati," bisik Broto sambil memegang kayu jati lapuk di tangannya. 

Penutup kayu sumur tua itu sudah bergeser. Tali tambang tebal tergantung menjuntai ke dalam lubang sumur yang gelap dan berbau lembap. Dari dalam kedalaman sumur, terdengar gesekan besi yang samar.

"Siapa di dalam?" teriakku dengan suara lantang yang memecah kesunyian hujan.

Seketika itu juga, sesosok bayangan meloncat keluar dari balik reruntuhan tembok samping. Tanpa sepatah kata pun, orang berjaket hitam itu berlari cepat menembus semak-semak bambu, meninggalkan sebuah tas kulit tua yang terjatuh di pinggir sumur.`
  },
  {
    title: "Bab 5: Puncak Penemuan Berkas",
    subtitle: "Membuka Brankas Terlarang",
    content: `Tas kulit tua yang tertinggal itu basah oleh air hujan. Dengan tangan gemetar, kami membuka ritsleting besinya yang sudah berkarat. Di dalamnya terdapat sebuah kotak logam berukuran sedang dengan gembok kuningan tebal.

Kami membawa kotak itu kembali ke ruang kerja di studio. Lampu meja dinyalakan terang. Dengan bantuan perkakas kecil dan sedikit minyak pelumas, gembok tua itu akhirnya berbunyi 'klik' dan terbuka.

Isi kotak itu membuat kami terpana.

Bukan perhiasan atau uang tua, melainkan puluhan lembar foto hitam-putih berukuran besar, buku catatan harian bertinta biru bertuliskan tangan rapi, serta Peta Rahasia Jalur Kereta Api Kompartemen Zaman Kolonial yang belum pernah dipublikasikan di arsip nasional manapun.

"Lihat foto ini," bisik Siti. "Ini adalah foto pertemuan para tokoh pergerakan nasional di Jogja pada tahun 1928. Wajah-wajah di foto ini... sebagian besar belum pernah masuk dalam buku sejarah sekolah!"`
  },
  {
    title: "Bab 6: Pembuktian Dan Analisis Komparatif",
    subtitle: "Menyusun Kembali Cerita",
    content: `Hari-hari berikutnya dihabiskan di depan layar monitor dan tumpukan buku referensi. Kami membandingkan tulisan tangan di buku harian dengan arsip otentik milik Perpustakaan Nasional dan Arsip Daerah.

Metode pengujian tingkat keasaman kertas (pH test) dan analisis gaya bahasa mengonfirmasi bahwa naskah ini memang ditulis secara berkala antara tahun 1928 hingga 1935 oleh seorang juru ketik keraton yang juga menjadi anggota rahasia pergerakan.

"Setiap paragraf di sini memiliki ritme narasi yang jujur," catatku dalam log revisi studio. "Penulisnya tidak berusaha mendramatisir keadaan. Dia mencatat harga beras, harga tiket kereta, kecemasan warga saat patroli malam, hingga obrolan hangat di warung kopi."

Inilah kekuatan dari penulisan berbasis fakta dan pengalaman nyata manusia. Tulisan seperti ini memiliki 'jiwa' yang tidak akan pernah bisa ditiru oleh mesin atau algoritma generatif buatan.`
  },
  {
    title: "Bab 7: Refleksi Dan Rekonstruksi Naskah",
    subtitle: "Menuju Draf Final",
    content: `Proses kolaborasi penulisan naskah ini telah memasuki tahap penyuntingan akhir. Draf bab demi bab kami kaji bersama di ruang kerja Studio Buku. Setiap anggota tim memberikan catatan kritis pada papan bab.

"Bagian deskripsi latar di Bab 4 perlu kita pertebal," saran Siti. "Pembaca harus bisa merasakan dinginnya angin lereng bukit dan bau tanah basah saat hujan menyiram lereng."

"Setuju," sahut Broto. "Dan di Bab 5, kutipan dari buku catatan harian harus kita tampilkan dalam format khusus agar otentisitase naskah aslinya tetap terjaga."

Proses 'nulis bareng' ini membuktikan bahwa dua atau tiga kepala yang berpikir bersama mampu melahirkan karya yang jauh lebih kaya, berkedalaman, dan bernyawa dibandingkan penulisan tunggal yang terisolasi.`
  },
  {
    title: "Bab 8: Epilog Dan Harapan Baru",
    subtitle: "Warisan Untuk Masa Depan",
    content: `Naskah buku ini akhirnya siap dipersembahkan kepada publik. Dari sebuah dokumen kusam berstempel merah pudar di lemari tua, kini telah menjelma menjadi sebuah karya buku utuh yang siap dibaca oleh ribuan generasi mendatang.

Sejarah dan karya literasi bukan sekadar deretan angka tahun atau nama tokoh yang harus dihafalkan. Literatur adalah jembatan emosional yang menghubungkan rasa kemanusiaan kita dengan orang-orang yang pernah hidup, berjuang, dan bermimpi di atas tanah yang sama puluhan tahun lalu.

Terima kasih kepada seluruh tim co-author, peneliti lapangan, dan pembaca setia di Studio Buku yang telah mengawal perjalanan naskah ini dari draf awal hingga terbit.

Semoga naskah ini menjadi penyala api literasi dan inspirasi bagi lahirnya buku-buku kolaboratif berikutnya di Indonesia.`
  }
];

export function generateSeedDatabase(): DB {
  const projects: Project[] = [];
  const chapters: Chapter[] = [];

  RAW_PROJECT_LIST.forEach((item, pIdx) => {
    const projId = `proj_${pIdx + 1}`;
    const dateObj = new Date(2026, 8, 30 - (pIdx % 30));
    const createdAtStr = dateObj.toISOString();

    const coAuthorNames = pIdx % 2 === 0 ? ["Kirana Maharani", "Bagus Setiawan"] : ["Rian Hidayat", "Siti Rahmania"];

    projects.push({
      id: projId,
      title: item.title,
      subtitle: item.subtitle,
      genre: item.genre,
      synopsis: `Naskah "${item.title}" — ${item.subtitle}. Dikembangkan secara kolaboratif oleh ${item.owner} bersama tim co-author Studio Buku.`,
      createdAt: createdAtStr,
      isPrivate: false,
      ownerId: item.ownerId,
      ownerName: item.owner,
      coAuthors: coAuthorNames
    });

    // Generate 8 chapters per project
    CHAPTER_TEMPLATES.forEach((tpl, cIdx) => {
      chapters.push({
        id: `chap_${projId}_${cIdx + 1}`,
        projectId: projId,
        title: `${tpl.title} — ${item.title}`,
        subtitle: tpl.subtitle,
        content: tpl.content,
        order: cIdx + 1,
        status: cIdx < 6 ? "final" : "review",
        lastEditedBy: item.owner,
        updatedAt: new Date(2026, 8, 30 - (pIdx % 30), cIdx + 1).toISOString()
      });
    });
  });

  return {
    authors: SEED_AUTHORS,
    projects,
    chapters,
    ideas: [],
    logs: [],
    annotations: [],
    glossary: []
  };
}

export const INITIAL_SEED_DB: DB = generateSeedDatabase();
