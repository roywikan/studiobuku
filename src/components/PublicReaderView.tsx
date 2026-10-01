import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { DB, Chapter, Project, GlossaryItem } from "../types";
import { BookOpen, Sun, Moon, Scroll, Printer, ChevronLeft, ChevronRight, X, Mail, Globe, BookMarked, BarChart3, ChevronUp, ChevronDown } from "lucide-react";

interface PublicReaderViewProps {
  initialDb?: DB;
}

function slugify(text: string): string {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "naskah";
}

function linkifyGlossaryText(text: string, glossary: GlossaryItem[], onTermClick: (term: GlossaryItem) => void): React.ReactNode[] {
  if (!glossary || glossary.length === 0 || !text) return [text];

  const termMap = new Map<string, GlossaryItem>();
  const searchPhrases: string[] = [];

  for (const item of glossary) {
    if (item.term && item.term.trim()) {
      const mainTerm = item.term.trim();
      termMap.set(mainTerm.toLowerCase(), item);
      searchPhrases.push(mainTerm);
    }
    if (item.aliases && item.aliases.trim()) {
      const aliasList = item.aliases.split(",").map((a: string) => a.trim()).filter(Boolean);
      for (const a of aliasList) {
        if (a.length >= 3 && !termMap.has(a.toLowerCase())) {
          termMap.set(a.toLowerCase(), item);
          searchPhrases.push(a);
        }
      }
    }
  }

  if (searchPhrases.length === 0) return [text];

  searchPhrases.sort((a, b) => b.length - a.length);
  const escapedPhrases = searchPhrases.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`\\b(${escapedPhrases.join('|')})\\b`, 'gi');

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const matchedText = match[0];
    const foundItem = termMap.get(matchedText.toLowerCase());

    if (foundItem) {
      parts.push(
        <span
          key={`glos_${match.index}`}
          onClick={(e) => {
            e.stopPropagation();
            onTermClick(foundItem);
          }}
          className="bg-amber-500/20 text-amber-300 font-extrabold px-1 py-0.5 rounded cursor-pointer hover:bg-amber-400 hover:text-slate-950 transition border-b-2 border-amber-400 inline-block mx-0.5"
          title={`Glosarium: ${foundItem.term} - Klik untuk penjelasan`}
        >
          {matchedText}
        </span>
      );
    } else {
      parts.push(matchedText);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

function cleanChapterContent(content: string = ""): string {
  if (!content) return "";
  let text = content.replace(/^\[\[[\s\S]*?\]\]\s*/, "");
  text = text.replace(/\n*--- Catatan Penulis[\s\S]*$/, "");
  return text.trim();
}

export const PublicReaderView: React.FC<PublicReaderViewProps> = ({ initialDb }) => {
  const [db, setDb] = useState<DB | null>(initialDb || null);
  const [loading, setLoading] = useState<boolean>(!initialDb);
  const [readerTheme, setReaderTheme] = useState<"dark" | "sepia" | "light">("dark");
  const [activeGlossaryTerm, setActiveGlossaryTerm] = useState<GlossaryItem | null>(null);
  const [showFullGlossary, setShowFullGlossary] = useState<boolean>(false);
  const [showQrisModal, setShowQrisModal] = useState<boolean>(false);
  const [showStatsInfo, setShowStatsInfo] = useState<boolean>(false);

  // Parse path parameters
  const pathname = window.location.pathname; // e.g. /p/gema-di-ujung-senja/bab-1...
  const pathParts = pathname.split("/").filter(Boolean); // ['p', 'gema-di-ujung-senja', 'bab-1...']

  let projectSlug = "";
  let chapterSlug = "";

  if (pathParts[0] === "p" || pathParts[0] === "buku") {
    projectSlug = pathParts[1] || "";
    chapterSlug = pathParts[2] || "";
  } else if (pathParts[0] === "public") {
    if (pathParts[1] === "chapter") chapterSlug = pathParts[2] || "";
    if (pathParts[1] === "project") projectSlug = pathParts[2] || "";
  }

  useEffect(() => {
    if (!db) {
      fetch("/api/data")
        .then(res => res.json())
        .then(data => {
          setDb(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to load public reader data:", err);
          setLoading(false);
        });
    }
  }, [db]);

  if (loading || !db) {
    return (
      <div className="min-h-screen bg-slate-950 text-amber-300 flex items-center justify-center font-sans p-6 text-center">
        <div className="space-y-3">
          <BookOpen className="w-10 h-10 animate-bounce mx-auto text-amber-400" />
          <p className="text-sm font-black tracking-wider uppercase">Memuat Naskah Studio Buku...</p>
        </div>
      </div>
    );
  }

  // Find project
  const cleanProjSlug = projectSlug.toLowerCase();
  let project = db.projects.find(p => p.id === projectSlug || slugify(p.title) === cleanProjSlug);
  
  if (!project && chapterSlug) {
    const cleanChapSlug = chapterSlug.toLowerCase();
    const foundChap = db.chapters.find(c => c.id === chapterSlug || slugify(c.title) === cleanChapSlug);
    if (foundChap) {
      project = db.projects.find(p => p.id === foundChap.projectId);
    }
  }

  if (!project) project = db.projects[0];

  const projChapters = db.chapters
    .filter(c => c.projectId === project.id)
    .sort((a, b) => a.order - b.order);

  const projGlossary = (db.glossary || []).filter(g => g.projectId === project.id);

  let activeChapter: Chapter | undefined;
  if (chapterSlug) {
    const cleanChapSlug = chapterSlug.toLowerCase();
    activeChapter = projChapters.find(c => c.id === chapterSlug || slugify(c.title) === cleanChapSlug);
  }

  const isFullBook = !activeChapter;
  const currentChapter = activeChapter || projChapters[0];

  const currentChapterIndex = projChapters.findIndex(c => c.id === currentChapter?.id);
  const prevChapter = projChapters[currentChapterIndex - 1];
  const nextChapter = projChapters[currentChapterIndex + 1];

  const wordCount = isFullBook
    ? projChapters.reduce((acc, c) => acc + (c.content ? c.content.trim().split(/\s+/).filter(Boolean).length : 0), 0)
    : (currentChapter?.content ? currentChapter.content.trim().split(/\s+/).filter(Boolean).length : 0);

  const readTime = Math.ceil(wordCount / 200);

  // Theme styling
  const themeClasses = {
    dark: "bg-slate-950 text-slate-100",
    sepia: "bg-[#f4ecd8] text-[#3c2f2f]",
    light: "bg-slate-50 text-slate-900"
  }[readerTheme];

  const cardClasses = {
    dark: "bg-slate-900/90 border-slate-800 text-slate-100 shadow-2xl",
    sepia: "bg-[#fbf0d9] border-[#e2d3b5] text-[#3c2f2f] shadow-lg",
    light: "bg-white border-slate-200 text-slate-900 shadow-xl"
  }[readerTheme];

  // Dynamic SEO & Metadata Calculation for Googlebot Indexing
  const currentProjSlug = slugify(project.title);
  const currentChapSlug = !isFullBook && currentChapter ? slugify(currentChapter.title) : "";

  const canonicalUrl = !isFullBook && currentChapSlug
    ? `https://studio.buku.biz.id/p/${currentProjSlug}/${currentChapSlug}`
    : `https://studio.buku.biz.id/p/${currentProjSlug}`;

  const pageTitle = !isFullBook && currentChapter
    ? `${currentChapter.title} — ${project.title} | Studio Buku`
    : `${project.title}${project.subtitle ? ` (${project.subtitle})` : ''} | Studio Buku`;

  const rawDesc = !isFullBook && currentChapter?.content
    ? cleanChapterContent(currentChapter.content).replace(/[#*`_\[\]]/g, ' ').replace(/\s+/g, ' ').trim()
    : (project.synopsis || "").replace(/\s+/g, ' ').trim();

  const metaDescription = (rawDesc.length > 155
    ? rawDesc.substring(0, 152) + "..."
    : rawDesc) || `Baca naskah ${project.title} karya ${project.ownerName || "Penulis Studio"} di Studio Buku.`;

  const bookSchema = {
    "@context": "https://schema.org",
    "@type": "Book",
    "name": project.title,
    "headline": !isFullBook && currentChapter ? currentChapter.title : project.title,
    "description": metaDescription,
    "genre": project.genre || "Fiksi",
    "inLanguage": "id",
    "url": canonicalUrl,
    "author": {
      "@type": "Person",
      "name": project.ownerName || "Penulis Studio"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Studio Buku",
      "url": "https://studio.buku.biz.id"
    }
  };

  return (
    <div className={`min-h-screen ${themeClasses} font-serif transition-colors duration-300 pb-20 select-text`}>
      {/* DYNAMIC REACT HELMET FOR UNIQUE PROJECT & CHAPTER SEO */}
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Studio Buku" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">
          {JSON.stringify(bookSchema)}
        </script>
      </Helmet>
      {/* PURE HEADER BAR - NO STUDIO EDITOR MENUS AT ALL */}
      <header className={`sticky top-0 z-40 border-b px-4 py-3 ${cardClasses} font-sans`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 truncate">
            <BookMarked className="w-5 h-5 text-amber-500 shrink-0" />
            <a
              href={`https://studio.buku.biz.id/p/${slugify(project.title)}`}
              className="text-xs sm:text-sm font-black truncate hover:text-amber-400 transition"
            >
              {project.title}
            </a>
          </div>

          {/* Reader Theme & Controls */}
          <div className="flex items-center space-x-1.5 shrink-0">
            {projGlossary.length > 0 && (
              <button
                onClick={() => setShowFullGlossary(true)}
                className="px-2.5 py-1 rounded-full border border-amber-500/40 text-[11px] font-bold text-amber-500 hover:bg-amber-500/10 transition flex items-center space-x-1"
              >
                <span>📖 Glosarium ({projGlossary.length})</span>
              </button>
            )}

            <button
              onClick={() => setReaderTheme("light")}
              className={`p-1.5 rounded-full border ${readerTheme === "light" ? "border-amber-500 text-amber-500 bg-amber-500/10" : "border-slate-700 opacity-70 hover:opacity-100"}`}
              title="Tema Terang"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setReaderTheme("sepia")}
              className={`p-1.5 rounded-full border ${readerTheme === "sepia" ? "border-amber-700 text-amber-700 bg-amber-700/10" : "border-slate-700 opacity-70 hover:opacity-100"}`}
              title="Tema Sepia"
            >
              <Scroll className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setReaderTheme("dark")}
              className={`p-1.5 rounded-full border ${readerTheme === "dark" ? "border-amber-400 text-amber-400 bg-amber-400/10" : "border-slate-700 opacity-70 hover:opacity-100"}`}
              title="Tema Gelap"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => window.print()}
              className="p-1.5 rounded-full border border-slate-700 opacity-70 hover:opacity-100 transition hidden sm:inline-flex"
              title="Cetak Naskah"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* MANUSCRIPT READING CONTAINER */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* BANNER KHUSUS AKADEMISI, INVESTOR & DONATUR NASKAH */}
        <section className="bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-indigo-500/15 border-2 border-amber-500/50 rounded-2xl p-5 font-sans space-y-3 shadow-xl">
          <div className="flex items-center space-x-2 text-amber-400 text-[11px] font-black uppercase tracking-wider">
            <Globe className="w-4 h-4" />
            <span>🎓 Ruang Peninjauan Akademisi, Investor & Donatur Naskah</span>
          </div>

          <h2 className="text-base sm:text-lg font-black">{project.title}</h2>
          <p className="text-xs leading-relaxed opacity-90">{project.synopsis}</p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href={`mailto:kontak@buku.biz.id?subject=Kontak%20Penulis%20Naskah%20${encodeURIComponent(project.title)}`}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/50 rounded-full text-xs font-black transition flex items-center space-x-1.5 shadow-md"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Kontak Penulis</span>
            </a>

            <button
              onClick={() => setShowQrisModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-full text-xs font-black transition flex items-center space-x-1.5 shadow-md cursor-pointer"
            >
              <span>💸 Donasi QRIS DANA</span>
            </button>

            {!isFullBook && (
              <a
                href={`https://studio.buku.biz.id/p/${slugify(project.title)}`}
                className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-full text-xs font-bold transition flex items-center space-x-1"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Lihat Seluruh Draf ({projChapters.length} Bab)</span>
              </a>
            )}
          </div>
        </section>

        {/* MANUSCRIPT TITLE & META */}
        <div className="space-y-3 border-b pb-6 border-slate-800">
          <h1 className="text-2xl sm:text-4xl font-black text-amber-400 leading-tight">
            {isFullBook ? project.title : currentChapter?.title}
          </h1>

          {!isFullBook && currentChapter?.subtitle && (
            <p className="text-sm sm:text-base italic opacity-80">{currentChapter.subtitle}</p>
          )}

          {isFullBook && project.subtitle && (
            <p className="text-sm sm:text-base italic opacity-80">{project.subtitle}</p>
          )}

          {/* Collapsible Info & Statistik Naskah - Collapsed by default */}
          <div className="pt-2 font-sans">
            <button
              onClick={() => setShowStatsInfo(!showStatsInfo)}
              className="inline-flex items-center space-x-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition bg-slate-900/80 hover:bg-slate-800 border border-amber-500/30 px-3.5 py-1.5 rounded-full cursor-pointer shadow-sm"
              title="Klik untuk membuka / menutup statistik naskah"
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span>📊 Info & Statistik Naskah ({wordCount.toLocaleString("id-ID")} Kata)</span>
              {showStatsInfo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showStatsInfo && (
              <div className="flex flex-wrap gap-3 text-xs font-sans opacity-90 pt-3 border-t border-slate-800/80 mt-3 bg-slate-900/40 p-3.5 rounded-xl border border-amber-500/20">
                <span>📚 <strong>Naskah:</strong> {project.title}</span>
                <span>🏷️ <strong>Genre:</strong> {project.genre}</span>
                <span>📝 <strong>Volume:</strong> {wordCount.toLocaleString("id-ID")} Kata</span>
                <span>⏱️ <strong>Estimasi Baca:</strong> ~{readTime} Menit</span>
                <span>✍️ <strong>Penulis:</strong> {project.ownerName || "Penulis Studio"}</span>
              </div>
            )}
          </div>
        </div>

        {/* TABLE OF CONTENTS FOR FULL BOOK MODE */}
        {isFullBook && (
          <div className="bg-slate-900/40 border border-amber-500/30 rounded-2xl p-5 font-sans space-y-3">
            <h3 className="text-sm font-black text-amber-400 flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4" />
              <span>Daftar Isi Naskah ({projChapters.length} Bab)</span>
            </h3>

            <ol className="list-decimal list-inside space-y-2 text-xs font-bold">
              {projChapters.map((c, idx) => (
                <li key={c.id}>
                  <a
                    href={`https://studio.buku.biz.id/p/${slugify(project.title)}/${slugify(c.title)}`}
                    className="text-amber-300 hover:underline"
                  >
                    Bab {idx + 1}: {c.title}
                  </a>
                  {c.subtitle && <span className="text-slate-400 font-normal italic ml-2">— {c.subtitle}</span>}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* GLOSSARY HINT */}
        {projGlossary.length > 0 && (
          <div className="bg-amber-500/10 border-l-4 border-amber-400 p-3 rounded-r-xl font-sans text-xs space-y-1">
            <p className="font-bold text-amber-300">💡 Petunjuk Pembaca & Peninjau:</p>
            <p className="opacity-90">
              Kata atau nama tokoh bergaris bawah kuning di dalam teks dapat diketuk untuk melihat definisi Glosarium dari penulis.
            </p>
          </div>
        )}

        {/* CHAPTER CONTENT TEXT */}
        <article className="prose prose-invert max-w-none text-base sm:text-lg leading-relaxed space-y-6">
          {isFullBook ? (
            projChapters.map((c, idx) => (
              <section key={c.id} className="pt-8 border-t border-slate-800 space-y-4">
                <div className="font-sans text-xs font-extrabold text-amber-400 uppercase tracking-widest">
                  BAB {idx + 1}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-amber-300">{c.title}</h2>
                {c.subtitle && <p className="text-sm italic opacity-80">{c.subtitle}</p>}
                
                <div className="space-y-4">
                  {cleanChapterContent(c.content).split(/\n\s*\n/).map((para, pIdx) => (
                    <p key={pIdx} className="indent-6 leading-loose">
                      {linkifyGlossaryText(para, projGlossary, term => setActiveGlossaryTerm(term))}
                    </p>
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="space-y-5">
              {cleanChapterContent(currentChapter?.content).split(/\n\s*\n/).map((para, pIdx) => (
                <p key={pIdx} className="indent-6 leading-loose">
                  {linkifyGlossaryText(para, projGlossary, term => setActiveGlossaryTerm(term))}
                </p>
              ))}
            </div>
          )}
        </article>

        {/* SINGLE CHAPTER PREV / NEXT NAVIGATION */}
        {!isFullBook && (
          <div className="flex items-center justify-between pt-8 border-t border-slate-800 font-sans text-xs font-bold gap-3">
            {prevChapter ? (
              <a
                href={`https://studio.buku.biz.id/p/${slugify(project.title)}/${slugify(prevChapter.title)}`}
                className="flex items-center space-x-1 text-amber-400 hover:underline max-w-[45%] truncate"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span className="truncate">Bab Sebelumnya: {prevChapter.title}</span>
              </a>
            ) : <span />}

            {nextChapter ? (
              <a
                href={`https://studio.buku.biz.id/p/${slugify(project.title)}/${slugify(nextChapter.title)}`}
                className="flex items-center space-x-1 text-amber-400 hover:underline max-w-[45%] truncate text-right ml-auto"
              >
                <span className="truncate">Bab Selanjutnya: {nextChapter.title}</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </a>
            ) : <span />}
          </div>
        )}

        {/* FOOTER */}
        <footer className="pt-12 border-t border-slate-800 text-center font-sans text-xs opacity-90 space-y-2">
          <p className="font-bold text-amber-300">
            Hak cipta milik : masing masing user penulisnya, Nulis Buku Bareng di{" "}
            <a href="https://Studio.Buku.Biz.ID" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-400">
              https://Studio.Buku.Biz.ID
            </a>
          </p>
          <p className="text-[11px] opacity-75">Seluruh hak cipta dilindungi undang-undang.</p>
        </footer>
      </main>

      {/* GLOSSARY TERM POPUP MODAL */}
      {activeGlossaryTerm && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans"
          onClick={() => setActiveGlossaryTerm(null)}
        >
          <div
            className="bg-slate-950 border-2 border-amber-400 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-white"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {activeGlossaryTerm.category}
                </span>
                <h3 className="text-xl font-black text-amber-300 mt-1">{activeGlossaryTerm.term}</h3>
              </div>
              <button
                onClick={() => setActiveGlossaryTerm(null)}
                className="text-slate-400 hover:text-white font-black text-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm leading-relaxed text-slate-200">{activeGlossaryTerm.definition}</p>

            {activeGlossaryTerm.aliases && (
              <p className="text-xs italic text-slate-400 border-t border-slate-800 pt-2">
                Sebutan/alias lain: {activeGlossaryTerm.aliases}
              </p>
            )}
          </div>
        </div>
      )}

      {/* FULL GLOSSARY DRAWER MODAL */}
      {showFullGlossary && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans"
          onClick={() => setShowFullGlossary(false)}
        >
          <div
            className="bg-slate-950 border-2 border-amber-400 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-white max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-amber-400 flex items-center space-x-2">
                <BookMarked className="w-5 h-5" />
                <span>📖 Glosarium Naskah ({projGlossary.length} Istilah)</span>
              </h3>
              <button
                onClick={() => setShowFullGlossary(false)}
                className="text-slate-400 hover:text-white font-black text-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {projGlossary.map(g => (
                <div key={g.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-amber-300 text-sm">{g.term}</strong>
                    <span className="text-[10px] font-black bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                      {g.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{g.definition}</p>
                  {g.aliases && <p className="text-[11px] italic text-slate-500">Alias: {g.aliases}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* QRIS DANA DONATION MODAL */}
      {showQrisModal && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans"
          onClick={() => setShowQrisModal(false)}
        >
          <div
            className="bg-slate-950 border-2 border-amber-400 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-white text-center relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQrisModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 font-black text-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-300 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              <span>💸 Donasi QRIS DANA Studio.Buku.Biz.ID</span>
            </div>

            <h3 className="text-lg font-black text-amber-300">Dukung Penulis & Proyek Naskah</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pindai / Scan QRIS DANA di bawah ini menggunakan aplikasi <strong>DANA, GoPay, OVO, ShopeePay, BCA, Mandiri, BRI, BNI</strong> atau m-banking / e-wallet lainnya.
            </p>

            <div className="bg-white p-3 rounded-xl border-2 border-amber-400 shadow-inner inline-block mx-auto max-w-[260px]">
              <img
                src="https://studio.buku.biz.id/QRIS-DANA.jpeg"
                alt="QRIS DANA Pemilik Studio.Buku.Biz.ID"
                className="w-full h-auto rounded-lg object-contain"
              />
            </div>

            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <p className="font-bold text-amber-400">Penerima QRIS DANA: Studio.Buku.Biz.ID</p>
              <p className="text-[11px] opacity-80">
                Studio Buku tidak memungut biaya apapun dari para penulisnya. Terima kasih atas donasi & dukungan Anda untuk keberlangsungan wadah gratis penulisan karya naskah ini!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
