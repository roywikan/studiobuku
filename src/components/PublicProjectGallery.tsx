import React, { useState } from "react";
import { Project, Chapter } from "../types";
import { Search, Globe, ChevronLeft, ChevronRight, BookOpen, User, Calendar, Sparkles } from "lucide-react";

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

export const PublicProjectGallery: React.FC<PublicProjectGalleryProps> = ({
  projects,
  chapters,
  onSelectPublicProject,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
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

  return (
    <div className="w-full space-y-6">
      
      {/* GALLERY HEADER & FILTER BAR - CLEAN CORPORATE LIGHT */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Globe className="w-4 h-4 text-emerald-600" />
              <span>Eksplorasi Naskah Publik Studio Buku</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center space-x-2">
              <span>📚 Naskah Terbaru</span>
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {totalItems} Naskah Terpublikasi
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Daftar karya naskah terbuka yang dipublikasikan oleh para penulis. Bebas dibaca oleh publik dan terindeks oleh Googlebot.
            </p>
          </div>

          {/* Quick Page Info */}
          <div className="flex items-center space-x-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 font-bold shrink-0">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Halaman {validPage} dari {totalPages} ({totalItems} Karya)</span>
          </div>
        </div>

        {/* SEARCH & GENRE FILTER */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari judul naskah, sinopsis, atau nama penulis..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-medium transition"
            />
          </div>

          <div className="w-full sm:w-auto shrink-0">
            <select
              value={selectedGenre}
              onChange={(e) => {
                setSelectedGenre(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-bold focus:outline-none transition"
            >
              {genresList.map((g) => (
                <option key={g} value={g}>
                  Genre: {g}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* CARDS GRID - 12 CARDS PER PAGE - CORPORATE LIGHT CARDS */}
      {current12Cards.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-sm">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Tidak Ada Naskah Yang Cocok</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Coba ubah kata kunci pencarian atau ganti pilihan filter genre naskah di atas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {current12Cards.map((project) => {
            const projSlug = slugify(project.title);
            const projChapters = chapters.filter((c) => c.projectId === project.id);
            const wordCount = projChapters.reduce(
              (acc, c) => acc + (c.content ? c.content.split(/\s+/).length : 0),
              0
            );

            return (
              <article
                key={project.id}
                className="bg-white border border-slate-200 hover:border-amber-400 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                      {project.genre || "Fiksi"}
                    </span>
                    <span className="text-[11px] text-slate-500 font-semibold flex items-center space-x-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{project.ownerName || "Penulis Studio"}</span>
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition leading-snug">
                    <a href={`/p/${projSlug}`}>{project.title}</a>
                  </h3>

                  {project.subtitle && (
                    <p className="text-xs text-slate-500 italic font-serif leading-relaxed">
                      {project.subtitle}
                    </p>
                  )}

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {project.synopsis}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                    <span className="flex items-center space-x-1">
                      <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                      <span>{projChapters.length} Bab Terbit</span>
                    </span>
                    <span>📝 {wordCount.toLocaleString("id-ID")} Kata</span>
                  </div>

                  <a
                    href={`/p/${projSlug}`}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-sm text-center"
                  >
                    <span>📖 Baca Naskah Lengkap</span>
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600 font-medium">
            Menampilkan <span className="font-bold text-slate-900">{startIndex + 1}</span> -{" "}
            <span className="font-bold text-slate-900">
              {Math.min(startIndex + ITEMS_PER_PAGE, totalItems)}
            </span>{" "}
            dari <span className="font-bold text-slate-900">{totalItems}</span> karya
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={validPage === 1}
              className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  pageNum === validPage
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={validPage === totalPages}
              className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
