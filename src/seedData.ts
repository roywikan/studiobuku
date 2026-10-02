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

export const RAW_PROJECT_LIST = [
  {
    title: "Gema Di Ujung Senja",
    subtitle: "Novel Fiksi Psikologis & Perjalanan Dua Jiwa",
    genre: "Fiksi / Drama",
    owner: "Rian Hidayat",
    ownerId: "auth_1",
    openingText: "Di tepian jendela lantai dua yang menghadap ke arah barat, Danu menyaksikan semburat jingga perlahan memudar ditelan malam. Di genggamannya, sebuah surat tanpa nama pengirim dengan cap pos usang membangkitkan kembali memori sepuluh tahun silam yang telah ia kubur dalam-dalam di sudut jiwanya."
  },
  {
    title: "Lembayung Kotabaru",
    subtitle: "Misteri Berkas Tua 1965",
    genre: "Misteri & Detektif",
    owner: "Kirana Maharani",
    ownerId: "auth_2",
    openingText: "Dinding bata tebal bangunan kolonial di sudut Kotabaru itu masih menyimpan aroma mesiu dan kelembapan masa lalu. Lemari besi tua di lantai bawah tanah yang baru saja berhasil dibongkar paksa menyingkap sebuah map cokelat bersegel lilin merah rahasia negara."
  },
  {
    title: "Sandi Dibalik Candi",
    subtitle: "Perjalanan Arkeologis Di Lembah Progo",
    genre: "Akademik & Riset",
    owner: "Rian Hidayat",
    ownerId: "auth_1",
    openingText: "Pahat batu andesit di pelataran barat candi itu menunjukkan guratan aksara Jawa Kuno yang tak lazim. Guru besar arkeologi itu mengusap debu lumut dengan kuas halus, menyadari bahwa apa yang mereka temukan bukanlah sekadar relief hiasan, melainkan peta jalan rahasia menuju peradaban tersembunyi."
  },
  {
    title: "Bunga Rumput Samudra",
    subtitle: "Antologi Puisi & Narasi Pesisir",
    genre: "Biografi & Memoar",
    owner: "Kirana Maharani",
    ownerId: "auth_2",
    openingText: "Angin asin dari laut selatan menerpa wajah para nelayan yang menanti fajar di bibir pantai berpasir hitam. Riak ombak menghempaskan serpihan kayu perahu tua, menyanyikan kidung sunyi tentang ketabahan orang-orang pesisir yang menggantungkan nasib pada luasnya samudra."
  },
  {
    title: "Pelaut Malam Dan Bintang",
    subtitle: "Novel Fiksi Sejarah Bahari",
    genre: "Fiksi / Sejarah",
    owner: "Rian Hidayat",
    ownerId: "auth_1",
    openingText: "Layar pinisi terkembang gagah menantang badai Selat Makassar di kegelapan tengah malam. Nakhoda juragan Kasim memegang kemudi kayu jati dengan tatapan terpaku pada konstelasi Bintang Pari di ufuk selatan, mencari celah karang berbahaya."
  },
  {
    title: "Cahaya Di Balik Kabut",
    subtitle: "Pengembangan Diri & Ketenangan Jiwa",
    genre: "Pengembangan Diri",
    owner: "Kirana Maharani",
    ownerId: "auth_2",
    openingText: "Kerap kali badai terbesar dalam hidup bukanlah peristiwa yang terjadi di luar sana, melainkan gemuruh pikiran kita sendiri yang tak kunjung hening. Menemukan kembali kedamaian batin dimulai saat kita berani berhenti sejenak dan mendengarkan bisikan nurani terdalam."
  },
  {
    title: "Detektif Batavia 1920",
    subtitle: "Penyelewengan Di Pelabuhan Tanjung Priok",
    genre: "Misteri & Detektif",
    owner: "Rian Hidayat",
    ownerId: "auth_1",
    openingText: "Asap cerutu Meneer De Vries mengepul tebal di ruang kantor pabean pelabuhan Tanjung Priok yang pengap. Detektif Mas Danuredjo menatap tajam manifesto muatan kapal kargo Hindia Belanda yang penuh dengan kejanggalan angka dan stempel palsu."
  },
  {
    title: "Riset Kecerdasan Buatan & Etika",
    subtitle: "Tinjauan Etis AI Dalam Pendidikan Tinggi",
    genre: "Sains & Teknologi",
    owner: "Bagus Setiawan",
    ownerId: "auth_3",
    openingText: "Revolusi model bahasa komputasi skala besar telah mengubah lanskap integritas akademik di seluruh perguruan tinggi. Pertanyaan mendasar bukan lagi seberapa cerdas mesin mampu memproduksi teks ilmiah, melainkan bagaimana kita menjaga martabat pemikiran orisinal manusia."
  },
  {
    title: "Jejak Langkah Di Pasar Beringharjo",
    subtitle: "Etnografi Sosial Pedagang Jamu Tradisional",
    genre: "Sosiologi & Budaya",
    owner: "Siti Rahmania",
    ownerId: "auth_4",
    openingText: "Sejak pukul empat dini hari, los jamu di lantai dasar Pasar Beringharjo telah semarak oleh aroma rimpang kencur segar, jahe emprit, dan temulawak. Mbah Marto menuang racikan beras kencur hangat ke dalam gelas kaca, menjaga resep leluhur yang diwariskan turun-temurun."
  },
  {
    title: "Rahasia Kedai Kopi Tua",
    subtitle: "Perbincangan Hangat Di Sudut Kota",
    genre: "Fiksi / Drama",
    owner: "Rian Hidayat",
    ownerId: "auth_1",
    openingText: "Dentang cangkir keramik tebal beradu dengan sendok kuningan di kedai kopi sudut jalan Malioboro itu tak pernah berubah sejak tahun lima puluhan. Tiga sahabat pensiunan mulai memperdebatkan manuskrip puisi kuno yang tak sengaja ditemukan di loteng pasar loak."
  },
  {
    title: "Babad Serayu Dan Sungai Jiwa",
    subtitle: "Kisah Peradaban Lembah Sungai Serayu",
    genre: "Sejarah & Kebudayaan",
    owner: "Kirana Maharani",
    ownerId: "auth_2",
    openingText: "Air kecokelatan Sungai Serayu mengalir tenang membelah lembah Banyumas, membawa endapan lumpur vulkanik subur dari kaki Gunung Slamet. Di tepian aliran inilah, dongeng tentang rakit bambu purba dan para tetua desa bermula ratusan tahun silam."
  },
  {
    title: "Menulis Tanpa Rasa Takut",
    subtitle: "Panduan Menembus Blok Kreatif Penulis Naskah",
    genre: "Pengembangan Diri",
    owner: "Rian Hidayat",
    ownerId: "auth_1",
    openingText: "Musuh terbesar seorang penulis bukanlah halaman kosong di layar komputer, melainkan suara kritikus batin yang membisikkan bahwa kata-katamu tidak cukup berharga. Menulis adalah tindakan keberanian untuk membiarkan draf pertamamu bernapas tanpa penghakiman."
  },
  {
    title: "Bayang-Bayang Di Atas Candi Prambanan",
    subtitle: "Teka-Teki Arsitektur Zaman Mataram Kuno",
    genre: "Misteri & Detektif",
    owner: "Bagus Setiawan",
    ownerId: "auth_3",
    openingText: "Saat senja merayap di pelataran Candi Siwa, bayangan menara runcing menjulang memanjang ke arah barat daya. Seorang peneliti batu menemukan bahwa pada tanggal tertentu setiap tahun, bayangan puncak candi menunjuk tepat ke sebuah ceruk batu tersembunyi."
  },
  {
    title: "Logika Dan Logika Hati",
    subtitle: "Dialektika Filsafat Modern Dan Realitas",
    genre: "Filsafat & Riset",
    owner: "Rian Hidayat",
    ownerId: "auth_1",
    openingText: "Filsafat sering kali dituduh terlalu mengawang di langit abstrak pemikiran rasional. Namun saat tragedi kemanusiaan menghantam di depan mata, kita menyadari bahwa logika rasional tanpa kompas empati hati hanyalah mekanisme dingin yang hampa."
  },
  {
    title: "Jejak Pengembara Parahyangan",
    subtitle: "Memoar Perjalanan Di Pegunungan Bandung Selatan",
    genre: "Biografi & Memoar",
    owner: "Kirana Maharani",
    ownerId: "auth_2",
    openingText: "Kabut sejuk menyelimuti perkebunan teh Malabar saat matahari pagi perlahan menyapa pucuk-pucuk daun hijau. Langkah kaki pengembara ini menyusuri makam tua Karel Bosscha, mengenang dedikasi seorang perintis yang mendedikasikan hidupnya bagi ilmu pengetahuan."
  },
  {
    title: "Nyanyian Angin Kotagede",
    subtitle: "Antologi Prosa Liris Pengrajin Perak",
    genre: "Puisi & Prosa",
    owner: "Siti Rahmania",
    ownerId: "auth_4",
    openingText: "Ketukan palu kecil berirama konstan menempa lempengan perak murni di bengkel kerja sempit berlantai terakota. Di bawah pendar cahaya lampu minyak, guratan filigri halus menjelma menjadi motif bunga teratai yang memesona mata dunia."
  },
  {
    title: "Dilema Dosen Muda",
    subtitle: "Catatan Humoris Di Ruang Dosen Dan Kelas",
    genre: "Komedi & Satir",
    owner: "Bagus Setiawan",
    ownerId: "auth_3",
    openingText: "Menjadi dosen baru di fakultas teknik ternyata jauh dari bayangan film-film intelektual. Pagi ini dimulai dengan tumpukan proposal skripsi mahasiswa yang judulnya lebih panjang daripada paragraf pendahuluan, ditambah proyektor kelas yang mendadak mogok berasap."
  },
  {
    title: "Penjaga Gerbang Merapi",
    subtitle: "Kisah Mitos Dan Sains Di Lereng Gunung",
    genre: "Fantasi & Folklor",
    owner: "Rian Hidayat",
    ownerId: "auth_1",
    openingText: "Gemuruh pelan dari perut Gunung Merapi selalu direspons secara berbeda oleh pos pemantau seismik dan sesepuh juru kunci lereng. Di titik temu antara data seismometer dan kearifan tanda-tanda alam inilah keselamatan ribuan warga dipertaruhkan."
  },
  {
    title: "Peta Harta Karun Banda Neira",
    subtitle: "Petualangan Rempah Dan Jejak Benteng Nassau",
    genre: "Petualangan Sejarah",
    owner: "Kirana Maharani",
    ownerId: "auth_2",
    openingText: "Aroma buah pala matang merebak di udara tropis Kepulauan Banda saat kapal feri kecil merapat di dermaga Neira. Di sudut perpustakaan benteng Belanda tua, sebuah lembaran peta maritim bertulisan tangan Portugis memicu ekspedisi penyelaman penuh risiko."
  },
  {
    title: "Seni Fokus Di Era Distraksi",
    subtitle: "Strategi Menjaga Atensi Dan Produktivitas",
    genre: "Pengembangan Diri",
    owner: "Rian Hidayat",
    ownerId: "auth_1",
    openingText: "Dentingan notifikasi ponsel pintar adalah pencuri atensi paling canggih dalam sejarah peradaban modern. Belajar mempertahankan fokus mendalam selama dua jam tanpa terputus kini menjadi keahlian langka yang membedakan pencipta karya bermutu dari sekadar konsumen pasif."
  },
  {
    title: "Jejak Sandi Di Keraton Ngayogyakarta",
    subtitle: "Misteri Lembaran Surat Utusan Belanda",
    genre: "Misteri & Detektif",
    owner: "Bagus Setiawan",
    ownerId: "auth_3",
    openingText: "Di ruang arsip wewengkon njeron beteng, sepucuk surat bertarikh 1890 tertulis dengan sandi huruf Jawa terbalik. Abdi dalem panyerat sandi keraton zaman itu sengaja menyembunyikan isi instruksi pertahanan dari mata mata-mata residen kolonial."
  },
  {
    title: "Sepiring Nasi Kucing Dan Mitos Kota",
    subtitle: "Etnografi Kuliner Angkringan Malam",
    genre: "Sosiologi & Budaya",
    owner: "Siti Rahmania",
    ownerId: "auth_4",
    openingText: "Asap arang dari ceret wedang jahe mengepul di bawah tenda terpal oranye di trotoar jalan malam. Di bangku kayu panjang angkringan, seorang tukang becak, mahasiswa rantau, dan pejabat kantor duduk sejajar menikmati nasi kucing tanpa sekat kasta sosial."
  },
  {
    title: "Jurnal Pengamatan Bintang Menoreh",
    subtitle: "Catatan Astronomi Amatir Di Ketinggian",
    genre: "Sains & Teknologi",
    owner: "Rian Hidayat",
    ownerId: "auth_1",
    openingText: "Teleskop reflektor manual kami arahkan ke langit gelap di punggung Perbukitan Menoreh yang bebas dari polusi cahaya kota. Nebula Orion tampak berpendar kehijauan di balik lensa okuler, membuktikan bahwa sains observasi antariksa dapat dijangkau dari pelosok desa."
  },
  {
    title: "Melodi Terakhir Di Bangsal Srimimpi",
    subtitle: "Kisah Pemusik Keroncong Dan Kenangan Tua",
    genre: "Fiksi / Drama",
    owner: "Kirana Maharani",
    ownerId: "auth_2",
    openingText: "Petikan dawai cuk dan cak dari alat musik keroncong tua milik Pak Gondo melantunkan nada-nada rindu yang syahdu di serambi rumah tua. Setiap akor membawa kembali kenangan manis saat ia mengiringi biduan legendaris menyanyikan lagu Bengawan Solo di panggung kota."
  },
  {
    title: "Bunga Kamboja Di Tepi Danau Toba",
    subtitle: "Kisah Romansa Dan Janji Di Tepi Air",
    genre: "Fiksi / Romansa",
    owner: "Siti Rahmania",
    ownerId: "auth_4",
    openingText: "Air Danau Toba yang biru membentang luas berpagarkan tebing-tebing hijau Pulau Samosir. Di bawah rindang pohon kamboja berbunga putih harum, dua sejoli kembali dipertemukan setelah tujuh musim berpisah demi menyelesaikan studi magister di tanah seberang."
  },
  {
    title: "Filosofi Batik Tulis & Garis Hidup",
    subtitle: "Simbolisme Motif Parang Dan Kawung",
    genre: "Sejarah & Kebudayaan",
    owner: "Kirana Maharani",
    ownerId: "auth_2",
    openingText: "Canting tembaga yang berisi malam panas menggores kain mori putih dengan kelenturan jemari yang luar biasa. Garis miring motif Parang Rusak bukan sekadar dekorasi visual, melainkan ajaran spiritual tentang ombak perjuangan hidup yang tak pernah padam."
  },
  {
    title: "Ekosistem Hutan Mangrove Pesisir",
    subtitle: "Riset Ketahanan Pantai Dan Keanekaragaman Hayati",
    genre: "Akademik & Riset",
    owner: "Bagus Setiawan",
    ownerId: "auth_3",
    openingText: "Akar tunjang pohon bakau mencengkeram kuat endapan lumpur muara, menjadi benteng alami terdepan yang meredam abrasi gelombang samudra. Kajian lapangan tim biologi kelautan kami mendokumentasikan puluhan spesies kepiting bakau dan burung migran yang bergantung padanya."
  },
  {
    title: "Catatan Harian Guru Di Pelosok Asmat",
    subtitle: "Perjuangan Literasi Di Tepian Sungai",
    genre: "Biografi & Memoar",
    owner: "Rian Hidayat",
    ownerId: "auth_1",
    openingText: "Perahu kayu bermesin tempel membelah rawa-rawa pasang surut di pedalaman Asmat, membawa tumpukan buku cerita bergambar sumbangan donatur. Binar mata anak-anak suku tepi sungai saat mengeja huruf pertama mereka adalah kebahagiaan terbesar seorang pendidik perintis."
  },
  {
    title: "Misteri Manuskrip Daun Lontar Bali",
    subtitle: "Teka-Teki Aksara Kawi Yang Hilang",
    genre: "Misteri & Detektif",
    owner: "Bagus Setiawan",
    ownerId: "auth_3",
    openingText: "Lembaran daun lontar tua bertulisan aksara Bali Kawi itu diikat rapat dengan tali benang merah di dalam kotak kayu cendana wangi. Penggores aksara ratusan tahun lalu sengaja menyembunyikan ramalan pengobatan herbal yang kini diburu oleh peneliti farmasi internasional."
  },
  {
    title: "Algoritma Jiwa Dan Kesadaran Digital",
    subtitle: "Eksplorasi Filsafat Teknologi Masa Depan",
    genre: "Sains & Teknologi",
    owner: "Rian Hidayat",
    ownerId: "auth_1",
    openingText: "Ketika jaringan syaraf tiruan mampu meniru respons emosi manusia dengan presisi 99%, di manakah batas sejati antara kecerdasan kalkulatif dan kesadaran spiritual? Buku ini mengeksplorasi garis batas ontologis antara algoritma silikon dan jiwa biologis manusia."
  },
  {
    title: "Kerajaan Air Di Lembah Bogowonto",
    subtitle: "Kisah Legenda Dan Penjaga Sungai",
    genre: "Fantasi & Folklor",
    owner: "Kirana Maharani",
    ownerId: "auth_2",
    openingText: "Sungai Bogowonto yang berhulu di lereng Gunung Sumbing mengalirkan kisah mistis tentang putri air yang menjaga kedung terdalam. Setiap kali bulan purnama tiba di bulan Sura, tetua desa mempersembahkan sesaji kembang setaman di bawah pohon beringin tua."
  },
  {
    title: "Sketsa Kota Tua Batavia",
    subtitle: "Arsitektur Bangunan Kolonial Dan Restorasi",
    genre: "Sejarah & Kebudayaan",
    owner: "Bagus Setiawan",
    ownerId: "auth_3",
    openingText: "Kusen jendela berdaun ganda dari kayu jati solid dan tegel semen bermotif geometris menghiasi gedung peninggalan VOC di kawasan Kota Tua Jakarta. Tim arsitektur konservasi kami membedah metode pemugaran fasad tanpa merusak material asli abad ke-18."
  },
  {
    title: "Skripsi Lima Tahun Dan Kopi Dingin",
    subtitle: "Kisah Suka Duka Mahasiswa Tingkat Akhir",
    genre: "Komedi & Satir",
    owner: "Siti Rahmania",
    ownerId: "auth_4",
    openingText: "Pukul dua dini hari di kos-kosan mahasiswa, layar laptop masih menampilkan Bab IV yang belum tuntas direvisi dosen pembimbing. Dengan persediaan mi instan yang menipis dan secangkir kopi hitam yang mendingin, tekad wisuda tahun ini tetap menyala."
  },
  {
    title: "Jejak Perdagangan Rempah Di Maluku",
    subtitle: "Analisis Historis Jalur Pelayaran Nusantara",
    genre: "Sejarah & Kebudayaan",
    owner: "Bagus Setiawan",
    ownerId: "auth_3",
    openingText: "Cengkih dari Ternate dan Tidore pernah bernilai setara emas batangan di pasar Eropa pada abad penjelajahan samudra. Catatan pelayaran nakhoda armada kora-kora lokal membuktikan dominasi maritim suku-suku Maluku dalam mengontrol perniagaan rempah dunia."
  },
  {
    title: "Rahasia Rumah Panggung Bugis",
    subtitle: "Kajian Konstruksi Kayu Dan Ketahanan Gempa",
    genre: "Akademik & Riset",
    owner: "Rian Hidayat",
    ownerId: "auth_1",
    openingText: "Konstruksi pasak kayu tanpa paku besi pada rumah panggung tradisional suku Bugis memiliki elastisitas luar biasa dalam meredam guncangan gempa bumi. Riset teknik sipil kami memodelkan sambungan sendi kayu ulin yang terbukti tangguh selama ratusan tahun."
  },
  {
    title: "Metode Penelitian Kualitatif Kritis",
    subtitle: "Panduan Praktis Untuk Mahasiswa Dan Peneliti",
    genre: "Akademik & Riset",
    owner: "Bagus Setiawan",
    ownerId: "auth_3",
    openingText: "Penelitian kualitatif bukanlah sekadar meringkas transkrip wawancara dengan informan, melainkan membongkar struktur kekuasaan dan relasi wacana yang melatarbelakangi realitas sosial. Buku ini menjadi panduan metodologis lapangan yang aplikatif."
  },
  {
    title: "Harmoni Gong Dan Angklung Parahyangan",
    subtitle: "Pelestarian Seni Pertunjukan Tradisional",
    genre: "Sejarah & Kebudayaan",
    owner: "Kirana Maharani",
    ownerId: "auth_2",
    openingText: "Getaran tabung bambu angklung yang berpadu dengan denting saron gong melahirkan harmoni pentatonis yang menyejukkan sanubari di Saung Udjo. Seniman muda Sunda kini membawa alat musik tradisional ini ke panggung orkestra internasional."
  },
  {
    title: "Melintasi Garis Khatulistiwa Pontianak",
    subtitle: "Catatan Perjalanan Di Tepian Sungai Kapuas",
    genre: "Biografi & Memoar",
    owner: "Rian Hidayat",
    ownerId: "auth_1",
    openingText: "Tugu Khatulistiwa berdiri tegak di titik nol derajat lintang bumi di tepi aliran Sungai Kapuas yang legendaris. Menyaksikan kapal motor kayu hilir mudik membawa hasil bumi mengingatkan kita pada keragaman budaya di jantung Kalimantan Barat."
  },
  {
    title: "Kisah Pendaki Di Puncak Rinjani",
    subtitle: "Petualangan Persahabatan Dan Survival",
    genre: "Fiksi / Petualangan",
    owner: "Kirana Maharani",
    ownerId: "auth_2",
    openingText: "Danau Segara Anak beriak tenang di kawah kaldera raksasa Gunung Rinjani saat fajar merah saga menyembul di horizon. Empat sahabat yang kehabisan bekal air minum di jalur letter E saling menyemangati untuk menggapai puncak tertinggi Lombok."
  },
  {
    title: "Komunikasi Interpersonal Di Era Siber",
    subtitle: "Dampak Media Sosial Terhadap Hubungan Manusia",
    genre: "Sosiologi & Budaya",
    owner: "Siti Rahmania",
    ownerId: "auth_4",
    openingText: "Emotikon jempol dan pesan instan kini menggantikan tatap mata dan getar suara dalam komunikasi sehari-hari. Penelitian sosiologi kami menelaah fenomena kesepian massal di tengah keramaian koneksi internet 24 jam tanpa henti."
  },
  {
    title: "Senandung Hujan Di Lembah Harau",
    subtitle: "Kisah Pertemuan Dua Peneliti Geologi",
    genre: "Fiksi / Romansa",
    owner: "Rian Hidayat",
    ownerId: "auth_1",
    openingText: "Tebing granit tegak setinggi ratusan meter di Lembah Harau Payakumbuh menjulang megah di balik tirai hujan sore hari. Dua geolog muda yang sedang meneliti formasi batuan sedimen purba terpaksa berteduh di sebuah dangau sawah beratap rumbia."
  },
  {
    title: "Hukum Adat Dan Keadilan Pesisir",
    subtitle: "Kajian Normatif Kesepakatan Nelayan Lokal",
    genre: "Akademik & Riset",
    owner: "Bagus Setiawan",
    ownerId: "auth_3",
    openingText: "Tradisi Sasi laut di Maluku dan Awig-Awig di pesisir Lombok adalah bukti nyata bahwa hukum adat masyarakat lokal jauh lebih efektif menjaga kelestarian terumbu karang dibandingkan regulasi birokrasi pemerintah pusat yang kaku."
  },
  {
    title: "Bintang Fajar Di Atas Bukit Sikunir",
    subtitle: "Inspirasi Perjalanan Menemukan Impian",
    genre: "Pengembangan Diri",
    owner: "Siti Rahmania",
    ownerId: "auth_4",
    openingText: "Suhu udara lima derajat Celsius di Bukit Sikunir Dieng tak menyurutkan langkah ratusan pendaki yang menanti fenomena golden sunrise. Menatap matahari terbit di atas lautan awan mengajarkan kita tentang harapan yang selalu hadir setelah malam tergelap."
  },
  {
    title: "Antologi Cerita Rakyat Nusantara",
    subtitle: "Warisan Lisan Dari Sabang Sampai Merauke",
    genre: "Fantasi & Folklor",
    owner: "Kirana Maharani",
    ownerId: "auth_2",
    openingText: "Sebelum aksara tercetak di atas kertas, nenek moyang bangsa kita merawat kearifan moral lewat dongeng pengantar tidur di sekitar perapian malam. Buku ini mengumpulkan kembali kisah-kisah lisan yang nyaris punah ditelan zaman modern."
  },
  {
    title: "Psikologi Menulis Dan Hambatan Kreatif",
    subtitle: "Memahami Pikiran Dan Alur Ide Penulis",
    genre: "Pengembangan Diri",
    owner: "Rian Hidayat",
    ownerId: "auth_1",
    openingText: "Mengapa seorang penulis handal terkadang terjebak kebuntuan ide selama berbulan-bulan? Kajian neuropsikologi kami menyingkap hubungan antara kelelahan mental, perfeksionisme berlebihan, dan strategi membuka kembali pintu imajinasi bebas."
  },
  {
    title: "Catatan Dokter Di Rumah Sakit Lapangan",
    subtitle: "Kisah Duka Dan Harapan Di Daerah Bencana",
    genre: "Biografi & Memoar",
    owner: "Siti Rahmania",
    ownerId: "auth_4",
    openingText: "Sirine ambulans membelah malam di tenda darurat pasca gempa bumi di pesisir barat Sumatra. Dengan peralatan medis terbatas dan listrik genset yang berderu, tim dokter bedah relawan berpacu dengan waktu menyelamatkan nyawa seorang ibu hamil."
  },
  {
    title: "Jejak Arsitektur Kolonial Di Surabaya",
    subtitle: "Penelusuran Bangunan Bersejarah Kota Pahlawan",
    genre: "Sejarah & Kebudayaan",
    owner: "Bagus Setiawan",
    ownerId: "auth_3",
    openingText: "Gedung Internatio di kawasan Jembatan Merah Surabaya masih menyisakan bekas lubang peluru di dinding luarnya. Arsitektur art deco dan neo-klasik kota ini menjadi saksi bisu heroisme arek-arek Suroboyo dalam mempertahankan kedaulatan kemerdekaan."
  },
  {
    title: "Teka-Teki Di Perpustakaan Nasional",
    subtitle: "Investigasi Pencurian Dokumen Langka",
    genre: "Misteri & Detektif",
    owner: "Rian Hidayat",
    ownerId: "auth_1",
    openingText: "Ruang naskah langka berpendingin khusus di lantai empat Perpustakaan Nasional mendadak digegerkan oleh hilangnya sebuah jilid manuskrip Babad Diponegoro bertinta emas. Kamera pengawas di lorong menunjukkan sosok berpakaian jas hujan yang menyelinap saat listrik padam."
  },
  {
    title: "Astronomi Tradisional Dan Pranata Mangsa",
    subtitle: "Kearifan Lokal Petani Jawa Menghitung Musim",
    genre: "Sains & Kebudayaan",
    owner: "Bagus Setiawan",
    ownerId: "auth_3",
    openingText: "Sebelum datangnya aplikasi prakiraan cuaca satelit, para petani Jawa mengamati posisi rasi bintang Waluku dan perilaku serangga untuk menentukan saat tepat menebar benih padi. Pranata Mangsa adalah sains ekologis luhur warisan leluhur."
  },
  {
    title: "Menemukan Makna Di Usia Dewasa Muda",
    subtitle: "Navigasi Karir Dan Kesehatan Mental",
    genre: "Pengembangan Diri",
    owner: "Siti Rahmania",
    ownerId: "auth_4",
    openingText: "Krisis usia seperempat abad (quarter-life crisis) sering kali melanda saat kita mulai membandingkan pencapaian diri dengan etalase keberhasilan semu di media sosial. Buku ini memandu Anda menemukan definisi sukses yang otentik dan selaras dengan nilai pribadi."
  },
  {
    title: "Jejak Kereta Api Tua Jalur Bedono",
    subtitle: "Sejarah Lokomotif Uap Dan Jalur Bergigi",
    genre: "Sejarah & Kebudayaan",
    owner: "Rian Hidayat",
    ownerId: "auth_1",
    openingText: "Deru uap panas lokomotif uap B2502 memekakkan telinga saat roda bergeriginya mulai mencengkeram rel tanjakan curam di perbukitan Ambarawa-Bedono. Jalur rel bergigi bersejarah ini adalah keajaiban teknik transportasi perkeretaapian peninggalan abad ke-19."
  },
  {
    title: "Kopi Hujan Dan Kalimat Belum Selesai",
    subtitle: "Kumpulan Cerita Pendek Kehidupan",
    genre: "Fiksi / Prosa",
    owner: "Kirana Maharani",
    ownerId: "auth_2",
    openingText: "Hujan gerimis meninggalkan jejak bulir-bulir air di kaca jendela kafe kecil di Jalan Kaliurang. Di atas buku catatan bergaris, sebuah kalimat tentang perpisahan terhenti di tanda koma, menunggu keberanian penulisnya untuk menuntaskan takdir cerita."
  },
  {
    title: "Etika Kedokteran Dan Masa Depan Bioteknologi",
    subtitle: "Analisis Kebijakan Kesehatan Modern",
    genre: "Akademik & Riset",
    owner: "Bagus Setiawan",
    ownerId: "auth_3",
    openingText: "Teknologi penyuntingan gen CRISPR dan terapi sel punca menjanjikan kesembuhan bagi penyakit genetik mematikan, namun sekaligus memicu dilema moral tentang batas rekayasa kodrat manusia. Pakar bioetika kami mengkaji regulasi hukum kesehatan nasional."
  },
  {
    title: "Misteri Lonceng Kapal VOC Yang Hilang",
    subtitle: "Penyelidikan Artefak Laut Jawa",
    genre: "Misteri & Detektif",
    owner: "Rian Hidayat",
    ownerId: "auth_1",
    openingText: "Sonar kapal survei kelautan mendeteksi anomali logam padat di dasar Laut Jawa pada kedalaman empat puluh meter. Penyelam arkeologi bawah air menemukan sebuah lonceng kapal perunggu bertuliskan VOC tahun 1742 yang telah lama dianggap mitos."
  },
  {
    title: "Tata Kelola Kota Berkelanjutan",
    subtitle: "Strategi Ruang Hijau Dan Transportasi Publik",
    genre: "Akademik & Riset",
    owner: "Bagus Setiawan",
    ownerId: "auth_3",
    openingText: "Kota masa depan yang tangguh bukanlah kota yang dipenuhi jalan layang beton bertingkat, melainkan kota yang memprioritaskan pejalan kaki, jalur sepeda aman, dan jaringan transportasi publik terintegrasi yang ramah lingkungan."
  },
  {
    title: "Kumpulan Esai Kebudayaan Kontemporer",
    subtitle: "Refleksi Perubahan Sosial Dan Otentisitas",
    genre: "Sosiologi & Budaya",
    owner: "Siti Rahmania",
    ownerId: "auth_4",
    openingText: "Di era digital yang serba cepat dan instan, kebudayaan kerap direduksi menjadi sekadar konten viral berdurasi tiga puluh detik. Kumpulan esai kritis ini mengajak kita merenungi kembali makna otentisitas karya seni dan identitas kultural bangsa."
  },
  {
    title: "Kisah Pengrajin Keramik Plered",
    subtitle: "Tradisi Gerabah Kayu Dan Daya Tahan Ekspor",
    genre: "Sejarah & Kebudayaan",
    owner: "Kirana Maharani",
    ownerId: "auth_2",
    openingText: "Putaran roda tanah liat dan kepulan asap pembakaran tungku kayu telah menjadi denyut nadi kehidupan warga Plered Purwakarta sejak berabad lalu. Keramik gerabah tangan ini kini menembus pasar dekorasi rumah di Eropa dan Amerika."
  },
  {
    title: "Menembus Kabut Gunung Bromo",
    subtitle: "Petualangan Fotografer Alam Di Kaldera",
    genre: "Petualangan",
    owner: "Rian Hidayat",
    ownerId: "auth_1",
    openingText: "Debu pasir vulkanik berbisik saat angin kencang menerpa lautan pasir kaldera Tengger di kaki Gunung Bromo. Dengan kamera lensa tele terlindungi kain khusus, sang fotografer menunggu momen magis saat kabut pagi tersingkap oleh cahaya mentari."
  },
  {
    title: "Sosiologi Pasar Tradisional Di Era Digital",
    subtitle: "Pergeseran Pola Transaksi Dan Ikatan Sosial",
    genre: "Sosiologi & Budaya",
    owner: "Siti Rahmania",
    ownerId: "auth_4",
    openingText: "Pasar tradisional bukan hanya tempat pertukaran barang komoditas dan uang rupiah, melainkan ruang interaksi sosial tempat bertukar kabar, tawar-menawar hangat, dan silaturahmi warga. Digitalisasi pasar harus mampu mempertahankan kehangatan sosial ini."
  },
  {
    title: "Lorong Waktu Di Kampung Cyber Jogja",
    subtitle: "Novel Fiksi Spekulatif Teknologi Dan Tradisi",
    genre: "Fiksi / Spekulatif",
    owner: "Rian Hidayat",
    ownerId: "auth_1",
    openingText: "Di balik mural warna-warni gang sempit Kampung Cyber Patehan Jogja, sebuah server rahasia buatan komunitas pemuda lokal memicu distorsi gelombang elektromagnetik. Seorang remaja peretas menemukan bahwa kabel serat optik bawah tanah menghubungkan kampung mereka dengan lorong waktu era Mataram Islam."
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
      synopsis: `${item.openingText} Naskah buku "${item.title}" ini dikembangkan secara kolaboratif oleh ${item.owner} bersama tim co-author di Studio Buku.`,
      createdAt: createdAtStr,
      isPrivate: false,
      ownerId: item.ownerId,
      ownerName: item.owner,
      coAuthors: coAuthorNames
    });

    // 8 Chapters tailored to the project
    const chapterTitles = [
      { t: "Bab 1: Awal Mula Dan Latar Peristiwa", sub: "Titik Tolak Perjalanan" },
      { t: "Bab 2: Jejak Pertama Dan Pengamatan Lapangan", sub: "Menelusuri Bukti Awal" },
      { t: "Bab 3: Dialektika Gagasan Dan Telaah Mendalam", sub: "Membuka Lembaran Baru" },
      { t: "Bab 4: Dinamika Konflik Dan Titik Balik", sub: "Ujian Di Lapangan" },
      { t: "Bab 5: Puncak Penemuan Dan Pembuktian", sub: "Fakta Yang Terkuak" },
      { t: "Bab 6: Analisis Komparatif Dan Pembahasan", sub: "Menyusun Kembali Rangkaian Kisah" },
      { t: "Bab 7: Refleksi Kritis Dan Rekonstruksi", sub: "Menuju Draf Final" },
      { t: "Bab 8: Epilog Dan Harapan Masa Depan", sub: "Warisan Untuk Pembaca" }
    ];

    chapterTitles.forEach((chMeta, cIdx) => {
      let chapterContent = "";
      if (cIdx === 0) {
        // Bab 1 contains the bespoke, unique opening scene!
        chapterContent = `${item.openingText}\n\n${item.subtitle}. Perjalanan penulisan naskah "${item.title}" ini bermula dari serangkaian peristiwa nyata dan diskusi intensif para penulis di Studio Buku.\n\nSetiap detail yang tercatat dalam lembaran naskah ini telah melewati proses verifikasi data, perenungan mendalam, dan kerja sama tim co-author. Di bab pembuka ini, pembaca diajak menyelami suasana awal yang melatarbelakangi lahirnya karya ini.`;
      } else {
        chapterContent = `Memasuki ${chMeta.t.toLowerCase()} dalam naskah "${item.title}".\n\n${chMeta.sub}: Pada bagian ini, pembahasan mengenai ${item.subtitle.toLowerCase()} semakin mengerucut pada temuan-temuan krusial.\n\n"Kolaborasi penulisan naskah buku seperti ini," ujar ${item.owner}, "memungkinkan kita mengurai lapisan persoalan dengan sudut pandang yang lebih luas dan berkedalaman."\n\nDiskusi dan revisi terus dilakukan untuk memastikan alur naskah mengalir jernih dan memberikan pemahaman utuh bagi setiap pembaca di Studio Buku.`;
      }

      chapters.push({
        id: `chap_${projId}_${cIdx + 1}`,
        projectId: projId,
        title: `${chMeta.t} — ${item.title}`,
        subtitle: chMeta.sub,
        content: chapterContent,
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
