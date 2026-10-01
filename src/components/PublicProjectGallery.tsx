import React, { useState } from "react";
import { Project, Chapter } from "../types";
import { BookOpen, ExternalLink, ChevronLeft, ChevronRight, Search, Globe, Eye, User, Calendar, BookMarked, Sparkles } from "lucide-react";

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
  onOpenHtmlPreview,
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

  const genresList = ["Semua", "Fiksi / Novel", "Fiksi / Drama", "Fiksi Remaja / Romance", "Misteri & Detektif", "Non-Fiksi / Pengembangan Diri", "Biografi / Antologi", "Akademik & Riset"];

  return (
    <div className="w-full space-y-6">
      
      {/* GALLERY HEADER & FILTER BAR */}
      <div className="bg-slate-950 border-2 border-amber-500/50 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 font-black text-xs uppercase tracking-wider mb-1">
              <Globe className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Eksplorasi Naskah Publik Studio Buku</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center space-x-2">
              <span>📚 Galeri Naskah Publik Terbaru</span>
              <span className="bg-amber-400 text-slate-950 text-xs px-2.5 py-0.5 rounded-full font-extrabold">
                12 Cards / Halaman
              </span>
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-1">
              Daftar karya naskah terbuka yang dipublikasikan oleh para penulis. Bebas dibaca oleh publik dan terindeks oleh Googlebot.
            </p>
          </div>

          {/* Quick Page Info */}
          <div className="flex items-center space-x-2 bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800 text-xs text-amber-300 font-black shrink-0">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Halaman {validPage} dari {totalPages} ({totalItems} Karya Publik)</span>
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
              className="w-full bg-slate-900 border-2 border-slate-800 focus:border-amber-400 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none font-medium"
            />
          </div>

          <div className="w-full sm:w-auto shrink-0">
            <select
              value={selectedGenre}
              onChange={(e) => {
                setSelectedGenre(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto bg-slate-900 border-2 border-slate-800 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-amber-300 font-black focus:outline-none"
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

      {/* 12 CARDS GRID DISPLAY */}
      {current12Cards.length === 0 ? (
        <div className="bg-slate-950 border-2 border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <BookMarked className="w-10 h-10 mx-auto text-amber-400 opacity-60" />
          <h3 className="text-base font-bold text-white">Tidak Ada Naskah Publik Ditemukan</h3>
          <p className="text-xs max-w-md mx-auto">
            Coba ubah kata kunci pencarian atau filter genre untuk menemukan karya naskah lainnya.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {current12Cards.map((p) => {
            const projChapters = chapters.filter((c) => c.projectId === p.id);
            const totalWords = projChapters.reduce(
              (acc, c) => acc + (c.content ? c.content.trim().split(/\s+/).filter(Boolean).length : 0),
              0
            );

            const publicUrl = `/p/${slugify(p.title)}`;

            return (
              <div
                key={p.id}
                className="bg-slate-950 border-2 border-slate-800 hover:border-amber-500/80 rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between shadow-xl hover:shadow-2xl group hover:-translate-y-1"
              >
                <div className="space-y-3">
                  {/* BADGES & GENRE */}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-black flex items-center space-x-1">
                      <Globe className="w-3 h-3 text-emerald-400" />
                      <span>Publik</span>
                    </span>

                    <span className="bg-slate-900 text-amber-300 border border-slate-700 px-2.5 py-0.5 rounded-full font-extrabold truncate max-w-[150px]">
                      {p.genre}
                    </span>
                  </div>

                  {/* TITLE & SUBTITLE */}
                  <div>
                    <h3 className="text-base font-black text-amber-300 group-hover:text-amber-200 transition leading-snug line-clamp-2">
                      {p.title}
                    </h3>
                    {p.subtitle && (
                      <p className="text-[11px] text-slate-400 font-medium italic mt-0.5 truncate">
                        {p.subtitle}
                      </p>
                    )}
                  </div>

                  {/* AUTHOR NAME */}
                  <div className="flex items-center space-x-1.5 text-xs text-slate-300 font-bold">
                    <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{p.ownerName || "Penulis Studio"}</span>
                  </div>

                  {/* SYNOPSIS TRUNCATED */}
                  <p className="text-xs text-slate-300/90 leading-relaxed line-clamp-3 font-normal bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    {p.synopsis || "Sinopsis naskah belum ditambahkan oleh penulis."}
                  </p>

                  {/* STATS & METADATA */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold pt-1 border-t border-slate-900">
                    <span>📖 {projChapters.length} Bab ({totalWords.toLocaleString("id-ID")} Kata)</span>
                    <span className="flex items-center space-x-1 text-[10px]">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{p.createdAt ? new Date(p.createdAt).toLocaleDateString("id-ID") : "Baru"}</span>
                    </span>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex items-center gap-2 pt-4 mt-3 border-t border-slate-800/80">
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1 shadow-md"
                    title="Buka Pratinjau HTML Publik di Tab Baru"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                    <span>HTML Preview</span>
                  </a>

                  {onSelectPublicProject && (
                    <button
                      type="button"
                      onClick={() => onSelectPublicProject(p)}
                      className="bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 text-xs font-bold py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1"
                      title="Baca / Tinjau di dalam Aplikasi"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>Baca</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="bg-slate-950 border-2 border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
          <div className="text-xs text-slate-300 font-bold">
            Menampilkan Karya {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} dari {totalItems} Total Karya Publik
          </div>

          <div className="flex items-center space-x-2">
            {/* Previous Page Button */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={validPage === 1}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center space-x-1 border ${
                validPage === 1
                  ? "bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed"
                  : "bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300 shadow-md cursor-pointer"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const isActive = pageNum === validPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl text-xs font-black transition ${
                      isActive
                        ? "bg-amber-400 text-slate-950 border-2 border-amber-300 shadow-md scale-105"
                        : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Page Button */}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={validPage === totalPages}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center space-x-1 border ${
                validPage === totalPages
                  ? "bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed"
                  : "bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300 shadow-md cursor-pointer"
              }`}
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
