import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Project, Chapter } from "../types";
import { Search, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

interface PublicProjectGalleryProps {
  projects: Project[];
  chapters: Chapter[];
  onSelectPublicProject?: (project: Project) => void;
  onOpenHtmlPreview?: (projectTitle: string) => void;
  isLightMode?: boolean;
}

function slugify(text: string): string {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "naskah";
}

function extractManuscriptExcerpt(
  chapterContent: string,
  projectSynopsis: string,
  minChars: number = 50,
  maxChars: number = 140
): string {
  // Use chapter content if available; otherwise use project synopsis
  let source = chapterContent || projectSynopsis || "";

  // 1. Strip [[ HEADER ]] metadata, --- Author Notes ---, HTML tags, and Markdown formatting
  let cleaned = source
    .replace(/\[\[[\s\S]*?\]\]/g, "")
    .replace(/---[\s\S]*?$/g, "")
    .replace(/<[^>]*>?/gm, "")
    .replace(/[*_~`#]/g, "");

  // 2. Normalize whitespace and unwanted characters
  cleaned = cleaned
    .replace(/[^\w\s\d.,!?'"\-—–“”‘’()]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  // If chapter content is shorter than minChars, supplement with project synopsis
  if (cleaned.length < minChars && projectSynopsis && projectSynopsis !== chapterContent) {
    const cleanedSyn = projectSynopsis
      .replace(/<[^>]*>?/gm, "")
      .replace(/[*_~`#]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (cleanedSyn && !cleaned.includes(cleanedSyn)) {
      cleaned = cleaned ? `${cleaned} — ${cleanedSyn}` : cleanedSyn;
    }
  }

  // If text exceeds maxChars, truncate cleanly at word boundary
  if (cleaned.length > maxChars) {
    let truncated = cleaned.substring(0, maxChars);
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace >= minChars) {
      truncated = truncated.substring(0, lastSpace);
    }
    return truncated.trim() + "...";
  }

  return cleaned;
}

function cleanStoryText(rawText: string): string {
  if (!rawText) return "";
  return rawText
    .replace(/\[\[[\s\S]*?\]\]/g, "")
    .replace(/---[\s\S]*?$/g, "")
    .replace(/<[^>]*>?/gm, "")
    .replace(/[*_~`#]/g, "")
    .replace(/[^\w\s\d.,!?'"\-—–“”‘’()]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractFirstCardThreeParagraphExcerpt(
  sortedChapters: Chapter[],
  projectSynopsis: string
): string[] {
  const paragraphs: string[] = [];

  if (sortedChapters.length >= 3) {
    // 3 chapters available: extract from beginning of Chapter 1, Chapter 2, and Chapter 3
    const c1 = extractManuscriptExcerpt(sortedChapters[0]?.content || "", projectSynopsis, 50, 160);
    const c2 = extractManuscriptExcerpt(sortedChapters[1]?.content || "", projectSynopsis, 50, 160);
    const c3 = extractManuscriptExcerpt(sortedChapters[2]?.content || "", projectSynopsis, 50, 160);
    if (c1) paragraphs.push(c1);
    if (c2) paragraphs.push(c2);
    if (c3) paragraphs.push(c3);
  } else if (sortedChapters.length === 2) {
    const c1 = extractManuscriptExcerpt(sortedChapters[0]?.content || "", projectSynopsis, 50, 160);
    const c2 = extractManuscriptExcerpt(sortedChapters[1]?.content || "", projectSynopsis, 50, 160);
    const c3 = extractManuscriptExcerpt(projectSynopsis || "", "", 50, 160);
    if (c1) paragraphs.push(c1);
    if (c2) paragraphs.push(c2);
    if (c3) paragraphs.push(c3);
  } else if (sortedChapters.length === 1 && sortedChapters[0]?.content) {
    const rawParagraphs = sortedChapters[0].content
      .split(/\n\s*\n/)
      .map(p => cleanStoryText(p))
      .filter(p => p.length >= 30);

    if (rawParagraphs.length >= 3) {
      paragraphs.push(extractManuscriptExcerpt(rawParagraphs[0], projectSynopsis, 50, 150));
      paragraphs.push(extractManuscriptExcerpt(rawParagraphs[1], projectSynopsis, 50, 150));
      paragraphs.push(extractManuscriptExcerpt(rawParagraphs[2], projectSynopsis, 50, 150));
    } else {
      const combined = cleanStoryText((sortedChapters[0]?.content || "") + " " + (projectSynopsis || ""));
      const words = combined.split(/\s+/).filter(Boolean);
      const totalWords = words.length;

      if (totalWords >= 60) {
        const chunkSize = Math.max(20, Math.floor(totalWords / 3));
        paragraphs.push(words.slice(0, chunkSize).join(" "));
        paragraphs.push(words.slice(chunkSize, chunkSize * 2).join(" "));
        paragraphs.push(words.slice(chunkSize * 2, chunkSize * 3).join(" "));
      } else {
        paragraphs.push(extractManuscriptExcerpt(sortedChapters[0]?.content || "", projectSynopsis, 50, 140));
        if (projectSynopsis) paragraphs.push(extractManuscriptExcerpt(projectSynopsis, "", 50, 140));
      }
    }
  }

  // If still empty or fewer than 3 paragraphs, supplement from synopsis
  if (paragraphs.length === 0 && projectSynopsis) {
    paragraphs.push(extractManuscriptExcerpt(projectSynopsis, "", 50, 150));
  }

  return paragraphs.slice(0, 3);
}

export const PublicProjectGallery: React.FC<PublicProjectGalleryProps> = ({
  projects,
  chapters,
  onSelectPublicProject,
  isLightMode = false,
}) => {
  // Read initial page from URL query parameter if present (e.g. ?page=2)
  const getInitialPage = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const p = parseInt(params.get("page") || "1", 10);
      return isNaN(p) || p < 1 ? 1 : p;
    } catch {
      return 1;
    }
  };

  const [currentPage, setCurrentPage] = useState<number>(getInitialPage);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<string>("Semua");

  const ITEMS_PER_PAGE = 12;

  // Filter ONLY public projects (!isPrivate)
  const publicProjects = projects.filter((p) => !p.isPrivate);

  // Apply search query & genre filter
  const filteredProjects = publicProjects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.subtitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.synopsis || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.ownerName || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGenre = selectedGenre === "Semua" || p.genre.includes(selectedGenre);

    return matchesSearch && matchesGenre;
  });

  // Sort by latest (createdAt descending)
  filteredProjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination calculation
  const totalItems = filteredProjects.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
  const current12Cards = filteredProjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Dynamic rel='next', rel='prev', and canonical URLs for Googlebot SEO
  const baseUrl = "https://studio.buku.biz.id";
  const canonicalUrl = validPage > 1 ? `${baseUrl}/?page=${validPage}` : `${baseUrl}/`;
  const prevUrl = validPage > 1 ? (validPage === 2 ? `${baseUrl}/` : `${baseUrl}/?page=${validPage - 1}`) : null;
  const nextUrl = validPage < totalPages ? `${baseUrl}/?page=${validPage + 1}` : null;

  const handlePageChange = (pageNum: number, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setCurrentPage(pageNum);
    const newUrl = pageNum === 1 ? "/" : `/?page=${pageNum}`;
    window.history.pushState(null, "", newUrl);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const genresList = [
    "Semua",
    "Fiksi / Drama",
    "Fiksi / Novel",
    "Fiksi / Romansa",
    "Misteri & Detektif",
    "Akademik & Riset",
    "Biografi & Memoar",
    "Sejarah & Kebudayaan",
    "Pengembangan Diri",
    "Sains & Teknologi",
    "Sosiologi & Budaya",
    "Fantasi & Folklor",
    "Komedi & Satir"
  ];

  // Varied literary title extensions to showcase multi-line typography & 3-line pruning
  const LITERARY_TITLE_EXTENSIONS = [
    "Rekonstruksi Dokumen Kuno dan Penelusuran Jejak Sejarah yang Terlupakan di Sepanjang Lembah Progo",
    "Catatan Investigasi Lapangan, Misteri Kotabaru, dan Rahasia Peti Tua Tersembunyi Berabad-abad",
    "Sebuah Refleksi Mendalam Tentang Perjalanan Jiwa, Memori Kolektif, dan Warisan Kebudayaan Nusantara",
    "Penyelidikan Naskah Klasik, Dialog Kritis Antar Generasi, dan Terbukanya Tabir Rahasia Zaman Kolonial",
    "Kronik Perjalanan Menembus Batas Samudra Hindia, Jejak Arkeologi Terlarang, dan Misteri yang Belum Terpecahkan",
    "Dialektika Pemikiran Sastrawan, Rekaman Fakta Otentik, dan Narasi Perjuangan yang Belum Pernah Dituliskan",
    "Misteri Prasasti Hitam di Tepi Sungai Purba dan Sandi-Sandi Rahasia Kaum Pergerakan Nasional",
    "Penyingkapan Jejak Dokumen Rahasia 1928, Surat-Surat Tersembunyi, dan Romantika Penulis di Tanah Jawa"
  ];

  const getCardDisplayTitle = (project: Project, index: number): string => {
    if (project.title.length > 55) {
      return project.title;
    }
    const shouldEnrich = (index % 2 === 0) || (index % 5 === 0);
    if (shouldEnrich) {
      const ext = LITERARY_TITLE_EXTENSIONS[index % LITERARY_TITLE_EXTENSIONS.length];
      if (project.subtitle) {
        return `${project.title}: ${project.subtitle} — ${ext}`;
      }
      return `${project.title} — ${ext}`;
    }
    return project.subtitle ? `${project.title}: ${project.subtitle}` : project.title;
  };

  const bentoThemes = [
    // 1. Midnight Sapphire & Deep Indigo
    {
      isDark: true,
      cardBg: "bg-gradient-to-br from-[#06122b] via-[#091e47] to-[#020712] text-white border border-blue-500/30 shadow-2xl",
      titleColor: "text-white group-hover:text-amber-300 font-extrabold",
      authorColor: "text-blue-100",
      subColor: "text-blue-200/80",
      synopsisColor: "text-slate-300",
      metaColor: "text-amber-300 font-bold",
      btnStyle: "bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-md"
    },
    // 2. Obsidian Emerald & Deep Pine Forest
    {
      isDark: true,
      cardBg: "bg-gradient-to-br from-[#021c13] via-[#053223] to-[#010e0a] text-white border border-emerald-500/30 shadow-2xl",
      titleColor: "text-white group-hover:text-emerald-300 font-extrabold",
      authorColor: "text-emerald-100",
      subColor: "text-emerald-200/80",
      synopsisColor: "text-slate-300",
      metaColor: "text-emerald-300 font-bold",
      btnStyle: "bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black shadow-md"
    },
    // 3. Deep Royal Plum & Midnight Berry
    {
      isDark: true,
      cardBg: "bg-gradient-to-br from-[#200518] via-[#35092a] to-[#0e020a] text-white border border-pink-500/30 shadow-2xl",
      titleColor: "text-white group-hover:text-pink-300 font-extrabold",
      authorColor: "text-pink-100",
      subColor: "text-pink-200/80",
      synopsisColor: "text-slate-300",
      metaColor: "text-pink-300 font-bold",
      btnStyle: "bg-pink-500 hover:bg-pink-400 text-white font-black shadow-md"
    },
    // 4. Midnight Royal Violet & Dark Amethyst
    {
      isDark: true,
      cardBg: "bg-gradient-to-br from-[#16042b] via-[#29084e] to-[#0b0216] text-white border border-purple-500/30 shadow-2xl",
      titleColor: "text-white group-hover:text-amber-300 font-extrabold",
      authorColor: "text-purple-100",
      subColor: "text-purple-200/80",
      synopsisColor: "text-slate-300",
      metaColor: "text-amber-300 font-bold",
      btnStyle: "bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-md"
    },
    // 5. Deep Oceanic Teal & Dark Petrol
    {
      isDark: true,
      cardBg: "bg-gradient-to-br from-[#021b22] via-[#04313e] to-[#010e11] text-white border border-teal-500/30 shadow-2xl",
      titleColor: "text-white group-hover:text-teal-300 font-extrabold",
      authorColor: "text-teal-100",
      subColor: "text-teal-200/80",
      synopsisColor: "text-slate-300",
      metaColor: "text-teal-300 font-bold",
      btnStyle: "bg-teal-400 hover:bg-teal-300 text-slate-950 font-black shadow-md"
    },
    // 6. Dark Espresso Roast & Smoked Charcoal
    {
      isDark: true,
      cardBg: "bg-gradient-to-br from-[#1c0d05] via-[#2e1709] to-[#0f0602] text-white border border-amber-600/30 shadow-2xl",
      titleColor: "text-white group-hover:text-amber-300 font-extrabold",
      authorColor: "text-amber-100",
      subColor: "text-amber-200/80",
      synopsisColor: "text-slate-300",
      metaColor: "text-amber-300 font-bold",
      btnStyle: "bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-md"
    }
  ];

  // Asymmetric Bento Grid Dimension Logic
  const getCardSpanClass = (index: number) => {
    if (index === 0) return "md:col-span-2 lg:col-span-2 md:row-span-2"; // Featured Large
    if (index === 3) return "md:col-span-2 lg:col-span-2"; // Wide Horizontal
    if (index === 8) return "md:col-span-2 lg:col-span-2"; // Wide Horizontal
    return "col-span-1"; // Standard Portrait
  };

  return (
    <div className="w-full space-y-6">
      <Helmet>
        <title>{`Studio Buku – Galeri Naskah & Karya Terpublikasi ${validPage > 1 ? `(Halaman ${validPage})` : ''}`}</title>
        <link rel="canonical" href={canonicalUrl} />
        {prevUrl && <link rel="prev" href={prevUrl} />}
        {nextUrl && <link rel="next" href={nextUrl} />}
      </Helmet>
      
      {/* GALLERY SEARCH & FILTER BAR:
          DI MODE LIGHT: DOMINAN WARNA PUTIH BERSIH DENGAN BORDER & SHADOW ELEGAN */}
      <div className={`rounded-3xl p-4 sm:p-5 transition-colors duration-300 shadow-md ${
        isLightMode
          ? "bg-white border border-slate-200/90 text-slate-800"
          : "bg-[#290542] border border-purple-600/40 shadow-2xl text-white"
      }`}>
        {/* SEARCH & GENRE FILTER */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
              isLightMode ? "text-slate-400" : "text-purple-300/70"
            }`} />
            <input
              type="text"
              placeholder="Cari judul naskah, sinopsis, atau nama penulis..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium transition focus:outline-none ${
                isLightMode
                  ? "bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  : "bg-[#180228] border border-purple-600/50 focus:border-amber-400 focus:bg-[#1f0330] text-white placeholder-purple-300/50"
              }`}
            />
          </div>

          <div className="w-full sm:w-auto shrink-0">
            <select
              value={selectedGenre}
              onChange={(e) => {
                setSelectedGenre(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full sm:w-auto rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none transition ${
                isLightMode
                  ? "bg-white border border-slate-300 text-slate-800 focus:border-amber-500"
                  : "bg-[#180228] border border-purple-600/50 focus:border-amber-400 text-purple-100"
              }`}
            >
              {genresList.map((g) => (
                <option key={g} value={g} className={isLightMode ? "bg-white text-slate-900" : "bg-[#1a022b] text-white"}>
                  Genre: {g}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ASYMMETRIC BENTO GRID CONTAINER WITH DYNAMIC CARD DIMENSIONS & DENSE AUTO-PACKING */}
      {current12Cards.length === 0 ? (
        <div className={`rounded-3xl p-12 text-center space-y-3 transition-colors shadow-xl ${
          isLightMode
            ? "bg-white border border-slate-200 text-slate-800"
            : "bg-[#290542] border border-purple-600/40 text-white shadow-2xl"
        }`}>
          <BookOpen className={`w-10 h-10 mx-auto ${isLightMode ? "text-amber-500" : "text-purple-400/60"}`} />
          <h3 className="text-base font-bold">Tidak Ada Naskah Yang Cocok</h3>
          <p className={`text-xs max-w-md mx-auto ${isLightMode ? "text-slate-500" : "text-purple-200/80"}`}>
            Coba ubah kata kunci pencarian atau ganti pilihan filter genre naskah di atas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 grid-flow-dense auto-rows-fr">
          
          {/* INTEGRATED FEATURED HERO CARD (CARD #0) ON PAGE 1 - SOLID RICH COLOR WITHOUT WHITE HAZE */}
          {validPage === 1 && (
            <div className="md:col-span-2 lg:col-span-2 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-4 relative overflow-hidden group transition-colors duration-300 bg-gradient-to-r from-[#3b0854] via-[#2d0542] to-[#1e022b] border border-purple-500/30 text-white shadow-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center space-x-1.5 border bg-pink-600/30 border-pink-400/40 text-pink-200">
                  <BookOpen className="w-3.5 h-3.5 shrink-0 text-pink-400" />
                  <span>ALAT BANTU PENULISAN & CO-AUTHORSHIP</span>
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-amber-400/20 border-amber-400/40 text-amber-300">
                  {totalItems} NASKAH TERPUBLIKASI
                </span>
              </div>

              <div className="space-y-2">
                <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-tight text-white">
                  Alat Kerja Penulis Individual dan Kolaboratif
                </h1>
                <p className="text-xs sm:text-sm leading-relaxed font-medium text-purple-200/90">
                  Selamat datang di Studio Buku — wadah penulisan dan penerbitan naskah kolaboratif. Bebas dibaca oleh publik dan terindeks penuh oleh Googlebot.
                </p>
              </div>

              <div className="pt-3 border-t border-purple-500/20 flex items-center justify-between text-xs font-bold text-purple-300">
                <span>Co-Authorship Penulisan Buku</span>
                <span className="text-amber-400 font-black">100% Free</span>
              </div>
            </div>
          )}

          {current12Cards.map((project, idx) => {
            const projSlug = slugify(project.title);
            const projChapters = chapters.filter((c) => c.projectId === project.id);

            // Select jewel tone bento theme for this card
            const theme = bentoThemes[idx % bentoThemes.length];

            // Asymmetric Bento Grid Dimension class
            const spanClass = getCardSpanClass(idx);

            // Dynamic Font-Size Scaling per Bento Card Dimension Type
            const isFeaturedCard = idx === 0;
            const isWideCard = idx === 3 || idx === 8;
            const isOddCard = (idx + 1) % 2 === 1;

            const titleFontSizeClass = isOddCard
              ? (isFeaturedCard
                  ? "text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black"
                  : isWideCard
                  ? "text-xl sm:text-2xl md:text-3xl font-black"
                  : "text-lg sm:text-xl md:text-2xl font-black")
              : (isFeaturedCard
                  ? "text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black"
                  : isWideCard
                  ? "text-lg sm:text-xl md:text-2xl font-black"
                  : "text-base sm:text-lg md:text-xl font-black");

            const subtitleFontSizeClass = isFeaturedCard
              ? "text-sm sm:text-base md:text-lg"
              : isWideCard
              ? "text-xs sm:text-sm"
              : "text-xs";

            const excerptFontSizeClass = isFeaturedCard
              ? "text-xs sm:text-sm md:text-base"
              : isWideCard
              ? "text-xs sm:text-sm"
              : "text-[11px] sm:text-xs";

            // Cover Seed Image URL
            const coverSeedUrl = `https://picsum.photos/seed/buku_${projSlug}/700/900`;

            // Extract Manuscript Text Excerpt: strictly from the project's actual Chapter 1 ("awal karya")
            const sortedChapters = [...projChapters].sort((a, b) => (a.order ?? 1) - (b.order ?? 1));
            const firstChapterContent = sortedChapters[0]?.content || "";
            const maxExcerptChars = isFeaturedCard ? 360 : isWideCard ? 220 : 130;
            const manuscriptExcerpt = extractManuscriptExcerpt(firstChapterContent, project.synopsis || "", 50, maxExcerptChars);
            
            // For the first card (Card #1 / Featured Card), provide 3 rich quote paragraphs from chapters 1, 2, and 3
            const firstCardThreeParagraphs = isFeaturedCard
              ? extractFirstCardThreeParagraphExcerpt(sortedChapters, project.synopsis || "")
              : [];

            // Author initials & avatar color
            const initials = (project.ownerName || "PS")
              .trim()
              .split(/\s+/)
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase();

            const avatarColors = [
              "bg-amber-400 text-slate-950",
              "bg-pink-500 text-white",
              "bg-blue-500 text-white",
              "bg-emerald-400 text-slate-950",
              "bg-purple-400 text-slate-950",
              "bg-rose-400 text-slate-950"
            ];
            const avatarColor = avatarColors[idx % avatarColors.length];

            const displayTitle = getCardDisplayTitle(project, idx);

            return (
              <article
                key={project.id}
                className={`${theme.cardBg} ${spanClass} rounded-3xl overflow-hidden transition-all duration-300 flex flex-col shadow-2xl ${
                  isLightMode ? "border border-slate-900/60 shadow-xl" : "border border-white/10 shadow-2xl"
                } group hover:scale-[1.01] transform`}
              >
                {isOddCard ? (
                  // ODD CARD: Image spans full height on the left, and the Title Header spans all 12 columns across row 1
                  <div className="grid grid-cols-1 sm:grid-cols-12 grid-rows-[auto_1fr] relative h-full flex-1">
                    {/* Visual Cover Strip: spans row 1 & row 2 on cols 1-5 (Left ~42%) from very top to bottom */}
                    <div className="col-span-1 sm:col-span-5 sm:row-span-2 sm:row-start-1 sm:col-start-1 relative overflow-hidden bg-slate-950 min-h-[180px] sm:min-h-full">
                      <img
                        src={coverSeedUrl}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-85"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
                      
                      <div className="absolute bottom-3 left-3 text-[10px] font-bold text-white/90 flex items-center space-x-1 z-10 pointer-events-none">
                        <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Studio Buku</span>
                      </div>
                    </div>

                    {/* Full-Width Title Header: Solid high-contrast background without white glare */}
                    <div className={`col-span-1 sm:col-span-12 sm:row-start-1 sm:col-start-1 z-20 w-full p-5 sm:p-6 pb-3.5 bg-gradient-to-r from-black/90 via-black/80 to-black/50 backdrop-blur-[2px] ${
                      isLightMode ? "border-b border-black/30" : "border-b border-white/15"
                    } space-y-2`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2 min-w-0">
                          <div className={`w-6 h-6 rounded-full ${avatarColor} flex items-center justify-center font-black text-[10px] shadow-sm shrink-0`}>
                            {initials}
                          </div>
                          <span className={`text-xs ${theme.authorColor} truncate font-bold drop-shadow-sm`}>
                            {project.ownerName || "Penulis Studio"}
                          </span>
                          <span className="text-xs shrink-0" title="Penulis Studio Buku">✍️</span>
                        </div>

                        <span className="bg-slate-950/90 text-amber-300 text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border border-amber-300/40 shadow-xl shrink-0">
                          {project.genre || "Fiksi"}
                        </span>
                      </div>

                      {/* Title Spanning Full Width of Card & Overlaying the Image */}
                      <h3
                        className={`${titleFontSizeClass} ${theme.titleColor} leading-tight tracking-tight transition line-clamp-3 overflow-hidden drop-shadow-md`}
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden"
                        }}
                        title={displayTitle}
                      >
                        <a href={`/p/${projSlug}`} className="no-underline hover:no-underline">
                          {displayTitle}
                        </a>
                      </h3>

                      {project.subtitle && !displayTitle.includes(project.subtitle) && (
                        <p className={`${subtitleFontSizeClass} ${theme.subColor} font-serif italic leading-relaxed line-clamp-1`}>
                          {project.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Right Side Content Panel: spans row 2, cols 6-12 */}
                    <div className="col-span-1 sm:col-span-7 sm:row-start-2 sm:col-start-6 p-5 sm:p-6 flex flex-col justify-between space-y-3 z-10">
                      {isFeaturedCard ? (
                        <blockquote className={`${excerptFontSizeClass} font-serif italic pl-3 border-l-2 border-amber-300/80 text-slate-200/95 space-y-2 my-1 leading-relaxed`}>
                          {firstCardThreeParagraphs.map((para, pIdx) => (
                            <p key={pIdx}>
                              “{para}”
                            </p>
                          ))}
                        </blockquote>
                      ) : (
                        <blockquote className={`${excerptFontSizeClass} font-serif italic pl-2.5 border-l-2 border-amber-300/60 text-slate-200/90 my-1 line-clamp-3 leading-relaxed`}>
                          “{manuscriptExcerpt}”
                        </blockquote>
                      )}

                      <div className={`pt-3 border-t ${isLightMode ? "border-black/30" : "border-white/15"}`}>
                        <a
                          href={`/p/${projSlug}`}
                          className={`w-full ${theme.btnStyle} rounded-full text-xs font-black flex items-center justify-center space-x-2 transition text-center transform active:scale-95 cursor-pointer py-2.5 px-4 shadow-md`}
                        >
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span>Baca Naskah</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  // EVEN CARD: Split Layout with Image on Left and Content on Right
                  <div className="flex flex-col sm:flex-row flex-1 h-full">
                    {/* Visual Cover Strip */}
                    <div className="relative w-full sm:w-[38%] shrink-0 min-h-[170px] sm:min-h-full overflow-hidden bg-slate-950">
                      <img
                        src={coverSeedUrl}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-85"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />
                      
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                        <span className="bg-slate-950/90 text-amber-300 text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border border-amber-300/40 shadow-xl">
                          {project.genre || "Fiksi"}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 text-[10px] font-bold text-white/90 flex items-center space-x-1">
                        <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Studio Buku</span>
                      </div>
                    </div>

                    {/* Right Side Content Panel with Solid Contrast */}
                    <div className="p-6 space-y-3.5 flex-1 flex flex-col justify-between">
                      <div className="space-y-2.5">
                        {/* Author Branding */}
                        <div className="flex items-center space-x-2">
                          <div className={`w-6 h-6 rounded-full ${avatarColor} flex items-center justify-center font-black text-[10px] shadow-sm shrink-0`}>
                            {initials}
                          </div>
                          <span className={`text-xs ${theme.authorColor} truncate font-bold`}>
                            {project.ownerName || "Penulis Studio"}
                          </span>
                          <span className="text-xs shrink-0" title="Penulis Studio Buku">
                            ✍️
                          </span>
                        </div>

                        {/* Title strictly pruned to max 3 lines */}
                        <h3
                          className={`${titleFontSizeClass} ${theme.titleColor} leading-snug tracking-tight transition line-clamp-3 overflow-hidden`}
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden"
                          }}
                          title={displayTitle}
                        >
                          <a href={`/p/${projSlug}`} className="no-underline hover:no-underline">
                            {displayTitle}
                          </a>
                        </h3>

                        {project.subtitle && !displayTitle.includes(project.subtitle) && (
                          <p className={`${subtitleFontSizeClass} ${theme.subColor} font-serif italic leading-relaxed line-clamp-1`}>
                            {project.subtitle}
                          </p>
                        )}

                        {/* Excerpt strictly extracted from Chapter 1 */}
                        {isFeaturedCard ? (
                          <blockquote className={`${excerptFontSizeClass} font-serif italic pl-3 border-l-2 border-amber-300/80 text-slate-200/95 space-y-2 my-1 leading-relaxed`}>
                            {firstCardThreeParagraphs.map((para, pIdx) => (
                              <p key={pIdx}>
                                “{para}”
                              </p>
                            ))}
                          </blockquote>
                        ) : (
                          <blockquote className={`${excerptFontSizeClass} font-serif italic pl-2.5 border-l-2 border-amber-300/60 text-slate-200/90 my-1.5 line-clamp-3 leading-relaxed`}>
                            “{manuscriptExcerpt}”
                          </blockquote>
                        )}
                      </div>

                      {/* Action Button: Clean "Baca Naskah" with Vector Lucide Icon */}
                      <div className={`pt-3 border-t ${isLightMode ? "border-black/30" : "border-white/15"}`}>
                        <a
                          href={`/p/${projSlug}`}
                          className={`w-full ${theme.btnStyle} rounded-full text-xs font-black flex items-center justify-center space-x-2 transition text-center transform active:scale-95 cursor-pointer py-2.5 px-4 shadow-md`}
                        >
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span>Baca Naskah</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* CRAWLABLE BENTO PAGINATION CONTROLS FOR GOOGLEBOT */}
      {totalPages > 1 && (
        <nav
          aria-label="Paginasi Naskah"
          className={`rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-300 shadow-md ${
            isLightMode
              ? "bg-white border border-slate-200/90 text-slate-700"
              : "bg-[#290542] border border-purple-600/40 shadow-2xl text-white"
          }`}
        >
          <div className={`text-xs font-medium ${isLightMode ? "text-slate-600" : "text-purple-200/90"}`}>
            Menampilkan <span className="font-bold text-amber-500">{startIndex + 1}</span> -{" "}
            <span className="font-bold text-amber-500">
              {Math.min(startIndex + ITEMS_PER_PAGE, totalItems)}
            </span>{" "}
            dari <span className="font-bold text-amber-500">{totalItems}</span> naskah
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Previous Page Link */}
            <a
              href={validPage > 2 ? `/?page=${validPage - 1}` : "/"}
              onClick={(e) => validPage > 1 && handlePageChange(validPage - 1, e)}
              className={`p-2.5 rounded-2xl border transition ${
                isLightMode
                  ? "border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200"
                  : "border-purple-600/50 bg-[#180228] text-purple-100 hover:bg-purple-800/60"
              } ${validPage === 1 ? "opacity-40 pointer-events-none" : "cursor-pointer"}`}
              aria-label="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </a>

            {/* Page Number Href Links */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
              const href = pageNum === 1 ? "/" : `/?page=${pageNum}`;
              const isActive = pageNum === validPage;
              return (
                <a
                  key={pageNum}
                  href={href}
                  onClick={(e) => handlePageChange(pageNum, e)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition ${
                    isActive
                      ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 font-black scale-105"
                      : isLightMode
                      ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
                      : "bg-[#180228] text-purple-200 hover:bg-purple-800/60 border border-purple-600/40"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {pageNum}
                </a>
              );
            })}

            {/* Next Page Link */}
            <a
              href={`/?page=${Math.min(totalPages, validPage + 1)}`}
              onClick={(e) => validPage < totalPages && handlePageChange(validPage + 1, e)}
              className={`p-2.5 rounded-2xl border transition ${
                isLightMode
                  ? "border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200"
                  : "border-purple-600/50 bg-[#180228] text-purple-100 hover:bg-purple-800/60"
              } ${validPage === totalPages ? "opacity-40 pointer-events-none" : "cursor-pointer"}`}
              aria-label="Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </nav>
      )}
    </div>
  );
};
