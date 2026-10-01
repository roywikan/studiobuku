import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Project, Chapter } from "../types";
import { Search, Globe, ChevronLeft, ChevronRight, BookOpen, User, Calendar, Sparkles, ArrowUpRight } from "lucide-react";

interface PublicProjectGalleryProps {
  projects: Project[];
  chapters: Chapter[];
  onSelectPublicProject?: (project: Project) => void;
  onOpenHtmlPreview?: (projectTitle: string) => void;
}

function slugify(text: string): string {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "naskah";
}

function sanitizeManuscriptExcerpt(rawText: string, maxChars: number): string {
  if (!rawText || !rawText.trim()) return "Kisah dan narasi bermakna terukir indah dalam setiap bab naskah ini.";

  // 1. Remove [[ HEADER ]] tags, --- Author Notes ---, HTML tags, and Markdown symbols
  let cleaned = rawText
    .replace(/\[\[[\s\S]*?\]\]/g, "")
    .replace(/---[\s\S]*?$/g, "")
    .replace(/<[^>]*>?/gm, "")
    .replace(/[*_~`#]/g, "");

  // 2. Strip unwanted non-alphanumeric artifacts except standard Indonesian punctuation
  cleaned = cleaned
    .replace(/[^\w\s\d.,!?'"\-—–“”‘’()]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "Kisah dan narasi bermakna terukir indah dalam setiap bab naskah ini.";

  if (cleaned.length <= maxChars) {
    return cleaned;
  }

  // Trim at word boundary
  let truncated = cleaned.substring(0, maxChars);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > maxChars * 0.7) {
    truncated = truncated.substring(0, lastSpace);
  }
  return truncated.trim() + "...";
}

export const PublicProjectGallery: React.FC<PublicProjectGalleryProps> = ({
  projects,
  chapters,
  onSelectPublicProject,
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

  const bentoThemes = [
    // 1. Turquoise Teal Blue (Dark) - Jewel Tone Poster Style
    {
      isDark: true,
      cardBg: "bg-gradient-to-br from-[#0D9488] via-[#0077B6] to-[#03045E] text-white border border-teal-300/40 shadow-2xl",
      titleColor: "text-white group-hover:text-amber-300",
      authorColor: "text-white/95",
      subColor: "text-teal-100/90",
      synopsisColor: "text-white/80",
      metaColor: "text-amber-200/95",
      btnStyle: "bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-md"
    },
    // 2. Warm Saffron Yellow & Amber Gold (Light)
    {
      isDark: false,
      cardBg: "bg-gradient-to-br from-[#FFB300] via-[#F57C00] to-[#E65100] text-slate-950 border border-amber-300/60 shadow-2xl",
      titleColor: "text-slate-950 group-hover:text-purple-950 font-black",
      authorColor: "text-slate-950 font-black",
      subColor: "text-slate-950/90 font-bold",
      synopsisColor: "text-slate-950/85 font-medium",
      metaColor: "text-slate-950 font-black",
      btnStyle: "bg-slate-950 hover:bg-slate-900 text-amber-300 font-black shadow-md"
    },
    // 3. Deep Berry Magenta (Dark)
    {
      isDark: true,
      cardBg: "bg-gradient-to-br from-[#D81B60] via-[#C2185B] to-[#880E4F] text-white border border-pink-400/40 shadow-2xl",
      titleColor: "text-white group-hover:text-amber-300",
      authorColor: "text-white/95",
      subColor: "text-pink-100/90",
      synopsisColor: "text-white/75",
      metaColor: "text-amber-200/95",
      btnStyle: "bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-md"
    },
    // 4. Royal Violet & Deep Purple (Dark)
    {
      isDark: true,
      cardBg: "bg-gradient-to-br from-[#7E22CE] via-[#4A148C] to-[#280659] text-white border border-purple-400/40 shadow-2xl",
      titleColor: "text-white group-hover:text-pink-300",
      authorColor: "text-purple-100",
      subColor: "text-purple-200/90",
      synopsisColor: "text-white/75",
      metaColor: "text-pink-200/95",
      btnStyle: "bg-pink-500 hover:bg-pink-400 text-white font-black shadow-md"
    },
    // 5. Electric Ultramarine & Cyan (Dark)
    {
      isDark: true,
      cardBg: "bg-gradient-to-br from-[#1E88E5] via-[#1565C0] to-[#0D47A1] text-white border border-blue-400/40 shadow-2xl",
      titleColor: "text-white group-hover:text-amber-300",
      authorColor: "text-white/95",
      subColor: "text-blue-100/90",
      synopsisColor: "text-white/75",
      metaColor: "text-amber-200/95",
      btnStyle: "bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-md"
    },
    // 6. Pearl Cream Gold (Light)
    {
      isDark: false,
      cardBg: "bg-gradient-to-br from-[#FFF9C4] via-[#FFF176] to-[#FBC02D] text-slate-950 border border-amber-300/80 shadow-2xl",
      titleColor: "text-slate-950 group-hover:text-amber-900 font-black",
      authorColor: "text-slate-950 font-black",
      subColor: "text-slate-900/90 font-bold",
      synopsisColor: "text-slate-950/85 font-medium",
      metaColor: "text-slate-950 font-black",
      btnStyle: "bg-[#280540] hover:bg-[#1a022b] text-amber-300 font-black shadow-md"
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
      
      {/* GALLERY HEADER & FILTER BAR - BENTO ROYAL PURPLE */}
      <div className="bg-[#290542] border border-purple-600/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-800/50 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs tracking-wide uppercase mb-1">
              <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>KATALOG NASKAH & KARYA TERPUBLIKASI</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
              <span>Naskah Terbaru :</span>
            </h2>
            <div className="flex items-center space-x-2 text-xs text-purple-200/80 font-medium mt-1">
              <span>{totalItems} Naskah Terpublikasi</span>
              <span aria-hidden="true">·</span>
              <span>12 Naskah per Halaman</span>
              <span aria-hidden="true">·</span>
              <span>Halaman {validPage} dari {totalPages}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-pink-600/20 px-4 py-2 rounded-2xl border border-pink-500/30 text-xs text-pink-200 font-bold shrink-0">
            <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
            <span>Platform Penulisan & Co-Authorship</span>
          </div>
        </div>

        {/* SEARCH & GENRE FILTER */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-purple-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari judul naskah, sinopsis, atau nama penulis..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#180228] border border-purple-600/50 focus:border-amber-400 focus:bg-[#1f0330] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-purple-300/50 focus:outline-none font-medium transition"
            />
          </div>

          <div className="w-full sm:w-auto shrink-0">
            <select
              value={selectedGenre}
              onChange={(e) => {
                setSelectedGenre(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto bg-[#180228] border border-purple-600/50 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-purple-100 font-bold focus:outline-none transition"
            >
              {genresList.map((g) => (
                <option key={g} value={g} className="bg-[#1a022b] text-white">
                  Genre: {g}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ASYMMETRIC BENTO GRID CONTAINER WITH DYNAMIC CARD DIMENSIONS & DENSE AUTO-PACKING */}
      {current12Cards.length === 0 ? (
        <div className="bg-[#290542] border border-purple-600/40 rounded-3xl p-12 text-center space-y-3 shadow-2xl">
          <BookOpen className="w-10 h-10 text-purple-400/50 mx-auto" />
          <h3 className="text-base font-bold text-white">Tidak Ada Naskah Yang Cocok</h3>
          <p className="text-xs text-purple-200/70 max-w-md mx-auto">
            Coba ubah kata kunci pencarian atau ganti pilihan filter genre naskah di atas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 grid-flow-dense auto-rows-fr">
          {/* INTEGRATED FEATURED HERO CARD (CARD #0) ON PAGE 1 */}
          {validPage === 1 && (
            <div className="md:col-span-2 lg:col-span-2 bg-gradient-to-r from-[#3b0854] via-[#2d0542] to-[#1e022b] border border-purple-500/30 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-4 shadow-2xl relative overflow-hidden group">
              {/* Glow Deco */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-pink-600/30 border border-pink-400/40 text-pink-200 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span>PROGRAM PENULISAN & CO-AUTHORSHIP</span>
                </span>
                <span className="bg-amber-400/20 border border-amber-400/40 text-amber-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {totalItems} NASKAH TERPUBLIKASI
                </span>
              </div>

              <div className="space-y-2">
                <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                  Katalog Naskah, Ruang Kerja Penulis & Galeri Karya Terbuka
                </h1>
                <p className="text-purple-200/90 text-xs sm:text-sm leading-relaxed font-medium">
                  Selamat datang di Studio Buku — wadah penulisan dan penerbitan naskah kolaboratif. Bebas dibaca oleh publik dan terindeks penuh oleh Googlebot.
                </p>
              </div>

              <div className="pt-3 border-t border-purple-500/20 flex items-center justify-between text-xs text-purple-300 font-bold">
                <span>Co-Authorship Penulisan Buku</span>
                <span className="text-amber-400 font-black">Studio Buku • 2026</span>
              </div>
            </div>
          )}
          {current12Cards.map((project, idx) => {
            const projSlug = slugify(project.title);
            const projChapters = chapters.filter((c) => c.projectId === project.id);
            const wordCount = projChapters.reduce(
              (acc, c) => acc + (c.content ? c.content.split(/\s+/).length : 0),
              0
            );

            // Select jewel tone bento theme for this card
            const theme = bentoThemes[idx % bentoThemes.length];

            // Asymmetric Bento Grid Dimension class
            const spanClass = getCardSpanClass(idx);

            // Dynamic Font-Size Scaling per Bento Card Dimension Type
            const isFeaturedCard = idx === 0;
            const isWideCard = idx === 3 || idx === 8;

            const titleFontSizeClass = isFeaturedCard
              ? "text-2xl md:text-3xl font-extrabold"
              : isWideCard
              ? "text-lg sm:text-xl font-bold"
              : "text-base sm:text-lg font-bold";

            const excerptFontSizeClass = isFeaturedCard
              ? "text-sm md:text-base leading-relaxed"
              : isWideCard
              ? "text-xs sm:text-sm leading-relaxed"
              : "text-xs leading-relaxed";

            const subtitleFontSizeClass = isFeaturedCard
              ? "text-xs sm:text-sm"
              : "text-xs";

            // Dynamic cover placeholder seed
            const coverSeedUrl = `https://picsum.photos/seed/buku-${project.id}/400/600`;

            // Extract Manuscript Text Excerpt for Editorial Quote with Dynamic Length & Absolute Sanitization
            const maxExcerptChars = isFeaturedCard ? 360 : isWideCard ? 200 : 110;
            const rawExcerptSource = projChapters[0]?.content || project.synopsis || "";
            const manuscriptExcerpt = sanitizeManuscriptExcerpt(rawExcerptSource, maxExcerptChars);

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

            return (
              <article
                key={project.id}
                className={`${theme.cardBg} ${spanClass} rounded-3xl overflow-hidden transition-all duration-300 flex flex-col sm:flex-row shadow-2xl border border-white/10 group hover:scale-[1.01] transform`}
              >
                {/* Visual Cover Strip (Prominent Cover Thumbnail ~38% Width) */}
                <div className="relative w-full sm:w-[38%] shrink-0 min-h-[170px] sm:min-h-full overflow-hidden bg-slate-950">
                  <img
                    src={coverSeedUrl}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-85"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />
                  
                  {/* GLASSMORPHISM BADGE FOR GENRE */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <span className="bg-slate-950/85 backdrop-blur-md text-amber-300 text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border border-amber-300/40 shadow-xl">
                      {project.genre || "Fiksi"}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 text-[10px] font-bold text-white/90 flex items-center space-x-1">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Studio Buku</span>
                  </div>
                </div>

                {/* Right Side Content Panel with Whitespace & Adaptive Contrast */}
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

                    {/* Title with Dynamic Sizing per Bento Card Type */}
                    <h3 className={`${titleFontSizeClass} ${theme.titleColor} leading-snug tracking-tight transition`}>
                      <a href={`/p/${projSlug}`} className="hover:underline">
                        {project.title}
                      </a>
                    </h3>

                    {project.subtitle && (
                      <p className={`${subtitleFontSizeClass} ${theme.subColor} font-serif italic leading-relaxed line-clamp-1`}>
                        {project.subtitle}
                      </p>
                    )}

                    {/* Editorial Text Excerpt with Dynamic Sizing */}
                    <blockquote className={`${excerptFontSizeClass} font-serif italic pl-2.5 border-l-2 ${theme.isDark ? "border-amber-300/60 text-purple-100/90" : "border-slate-950/50 text-slate-950/90 font-semibold"} my-1.5`}>
                      “{manuscriptExcerpt}”
                    </blockquote>
                  </div>

                  {/* Metadata & Clean "Baca Naskah" Button with Lucide Vector Icon */}
                  <div className="pt-3 border-t border-black/10 sm:border-white/15 space-y-3">
                    <div className={`flex items-center justify-between text-[11px] font-bold ${theme.metaColor}`}>
                      <span>{projChapters.length} Bab Terbit</span>
                      <span aria-hidden="true" className="opacity-70">·</span>
                      <span className="font-mono">{wordCount.toLocaleString("id-ID")} Kata</span>
                    </div>

                    {/* Action Button: Clean "Baca Naskah" with Vector Lucide Icon */}
                    <a
                      href={`/p/${projSlug}`}
                      className={`w-full ${theme.btnStyle} rounded-full text-xs font-black flex items-center justify-center space-x-2 transition text-center transform active:scale-95 cursor-pointer py-2.5 px-4 shadow-md`}
                    >
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                      <span>Baca Naskah</span>
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* CRAWLABLE BENTO PAGINATION CONTROLS FOR GOOGLEBOT */}
      {totalPages > 1 && (
        <nav aria-label="Paginasi Naskah" className="bg-[#290542] border border-purple-600/40 rounded-3xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-purple-200/90 font-medium">
            Menampilkan <span className="font-bold text-amber-300">{startIndex + 1}</span> -{" "}
            <span className="font-bold text-amber-300">
              {Math.min(startIndex + ITEMS_PER_PAGE, totalItems)}
            </span>{" "}
            dari <span className="font-bold text-amber-300">{totalItems}</span> naskah
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Previous Page Link */}
            <a
              href={validPage > 2 ? `/?page=${validPage - 1}` : "/"}
              onClick={(e) => validPage > 1 && handlePageChange(validPage - 1, e)}
              className={`p-2.5 rounded-2xl border border-purple-600/50 bg-[#180228] text-purple-100 hover:bg-purple-800/60 transition ${
                validPage === 1 ? "opacity-40 pointer-events-none" : "cursor-pointer"
              }`}
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
                      ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30 font-black scale-105"
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
              className={`p-2.5 rounded-2xl border border-purple-600/50 bg-[#180228] text-purple-100 hover:bg-purple-800/60 transition ${
                validPage === totalPages ? "opacity-40 pointer-events-none" : "cursor-pointer"
              }`}
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
