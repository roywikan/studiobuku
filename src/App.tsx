import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { DB, Chapter, Idea, Author, Project, Annotation } from "./types";
import { WRITER_THEMES, WriterTheme } from "./theme";
import { Navbar } from "./components/Navbar";
import { ChapterEditor } from "./components/ChapterEditor";
import { IdeaScratchpad } from "./components/IdeaScratchpad";
import { RevisionLogs } from "./components/RevisionLogs";
import { BookVisualizer } from "./components/BookVisualizer";
import { AiAssistantView } from "./components/AiAssistantView";
import { ImportModal } from "./components/ImportModal";
import { InviteModal } from "./components/InviteModal";
import { LoginGate, UserSession } from "./components/LoginGate";
import { DatabaseSeedModal } from "./components/DatabaseSeedModal";
import { StudioBukuLogo } from "./components/StudioBukuLogo";
import { INITIAL_SEED_DB } from "./seedData";
import { LogIn, BookOpen } from "lucide-react";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";

// Code-splitting via React.lazy for Core Web Vitals optimization
const PublicReaderView = React.lazy(() =>
  import("./components/PublicReaderView").then(m => ({ default: m.PublicReaderView }))
);
const PublicProjectGallery = React.lazy(() =>
  import("./components/PublicProjectGallery").then(m => ({ default: m.PublicProjectGallery }))
);
const PricingView = React.lazy(() =>
  import("./components/PricingView").then(m => ({ default: m.PricingView }))
);

const LoadingFallback: React.FC = () => (
  <div className="min-h-[300px] flex items-center justify-center font-sans p-8">
    <div className="space-y-3 text-center">
      <BookOpen className="w-8 h-8 animate-bounce mx-auto text-amber-500" />
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Memuat Komponen Studio Buku...</p>
    </div>
  </div>
);

const initialDefaultDb: DB = INITIAL_SEED_DB;

function slugify(text: string): string {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "naskah";
}

function cleanChapterContent(content: string = ""): string {
  if (!content) return "";
  return content.replace(/\n*--- Catatan Penulis[\s\S]*$/, "").trim();
}

function normalizeProject(p: any): Project {
  if (!p) return p;
  let coAuthorsList: string[] = [];
  if (Array.isArray(p.coAuthors)) {
    coAuthorsList = p.coAuthors;
  } else if (typeof p.coAuthors === "string") {
    try {
      const parsed = JSON.parse(p.coAuthors);
      coAuthorsList = Array.isArray(parsed) ? parsed : (p.coAuthors.trim() ? [p.coAuthors.trim()] : []);
    } catch {
      coAuthorsList = p.coAuthors.trim() ? [p.coAuthors.trim()] : [];
    }
  }

  return {
    ...p,
    isPrivate: Boolean(p.isPrivate),
    coAuthors: coAuthorsList
  };
}

export default function App() {
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem("studio_buku_session");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [db, setDb] = useState<DB | null>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "ideas" | "logs" | "preview" | "ai" | "gallery">("editor");
  const [currentAuthor, setCurrentAuthor] = useState<Author | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [themeId, setThemeIdState] = useState<string>(() => {
    return localStorage.getItem("studio_buku_theme") || "rosequartz";
  });
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Global Auto-Save Status State for Navbar
  const [saveStatus, setSaveStatus] = useState<"idle" | "typing" | "saving" | "saved" | "error">("saved");
  const [lastSavedTime, setLastSavedTime] = useState<string>("");

  const currentTheme: WriterTheme = WRITER_THEMES[themeId] || WRITER_THEMES["rosequartz"];

  const setThemeId = (id: string) => {
    setThemeIdState(id);
    localStorage.setItem("studio_buku_theme", id);
  };

  const handleLoginSuccess = (session: UserSession) => {
    setUserSession(session);
    localStorage.setItem("studio_buku_session", JSON.stringify(session));
    if (db && db.authors) {
      setCurrentAuthor({
        id: "auth_session",
        name: session.name,
        role: "Penulis Studio",
        avatar: session.avatar || "✍️",
        color: "bg-amber-500"
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("SignOut error:", e);
    }
    setUserSession(null);
    localStorage.removeItem("studio_buku_session");
  };

  const loadData = async (targetProjectId?: string) => {
    try {
      const res = await fetch("/api/data");
      const contentType = res.headers.get("content-type") || "";

      let data: DB;
      if (res.ok && contentType.includes("application/json")) {
        data = await res.json();
        localStorage.setItem("studio_buku_db_cache", JSON.stringify(data));
      } else {
        const cached = localStorage.getItem("studio_buku_db_cache");
        data = cached ? JSON.parse(cached) : initialDefaultDb;
      }

      if (data && Array.isArray(data.projects)) {
        data.projects = data.projects.map(normalizeProject);
      }

      if (data && Array.isArray(data.chapters)) {
        data.chapters = data.chapters.map(c => ({
          ...c,
          content: cleanChapterContent(c.content)
        }));
      }

      setDb(data);

      if (data.authors && data.authors.length > 0 && !currentAuthor) {
        if (userSession) {
          setCurrentAuthor({
            id: "auth_session",
            name: userSession.name,
            role: "Penulis Studio",
            avatar: userSession.avatar || "✍️",
            color: "bg-amber-500"
          });
        } else {
          setCurrentAuthor(data.authors[0]);
        }
      }

      const projId = targetProjectId || selectedProjectId || (data.projects[0] ? data.projects[0].id : "proj_1");
      setSelectedProjectId(projId);

      const projChapters = data.chapters.filter(c => c.projectId === projId);
      if (projChapters.length > 0) {
        setSelectedChapterId(projChapters[0].id);
      } else if (data.chapters.length > 0) {
        setSelectedChapterId(data.chapters[0].id);
      }
    } catch (e) {
      console.warn("API Data non-JSON fallback triggered:", e);
      const cached = localStorage.getItem("studio_buku_db_cache");
      const data: DB = cached ? JSON.parse(cached) : initialDefaultDb;
      setDb(data);
      if (data.authors && data.authors.length > 0 && !currentAuthor) {
        setCurrentAuthor(data.authors[0]);
      }
      setSelectedProjectId(targetProjectId || data.projects[0]?.id || "proj_1");
      setSelectedChapterId(data.chapters[0]?.id || "chap_1");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pathname = window.location.pathname;
  const isPublicRoute =
    pathname.startsWith("/p/") ||
    pathname.startsWith("/buku/") ||
    pathname.startsWith("/public/");

  const [showPricingView, setShowPricingView] = useState(pathname === "/pricing");

  if (pathname === "/pricing" || showPricingView) {
    return (
      <React.Suspense fallback={<LoadingFallback />}>
        <PricingView
          onBack={() => setShowPricingView(false)}
          onOpenLogin={() => setIsLoginModalOpen(true)}
        />
      </React.Suspense>
    );
  }

  if (isPublicRoute) {
    return (
      <React.Suspense fallback={<LoadingFallback />}>
        <PublicReaderView initialDb={db || undefined} />
      </React.Suspense>
    );
  }

  const getGalleryPageInfo = () => {
    let page = 1;
    try {
      const search = window.location.search;
      const params = new URLSearchParams(search);
      const parsed = parseInt(params.get("page") || "1", 10);
      if (!isNaN(parsed) && parsed > 0) page = parsed;
    } catch {
      page = 1;
    }

    const publicCount = (db?.projects || initialDefaultDb.projects).filter((p) => !p.isPrivate).length;
    const totalPages = Math.max(1, Math.ceil(publicCount / 12));
    const validPage = Math.min(Math.max(1, page), totalPages);

    const baseUrl = "https://studio.buku.biz.id";
    const canonical = validPage > 1 ? `${baseUrl}/?page=${validPage}` : `${baseUrl}/`;
    const prev = validPage > 1 ? (validPage === 2 ? `${baseUrl}/` : `${baseUrl}/?page=${validPage - 1}`) : null;
    const next = validPage < totalPages ? `${baseUrl}/?page=${validPage + 1}` : null;

    return { validPage, totalPages, canonical, prev, next };
  };

  const galleryPageInfo = getGalleryPageInfo();

  if (!userSession) {
    return (
      <div className="min-h-screen bg-[#1f0330] text-slate-100 flex flex-col font-sans select-none md:select-text">
        <Helmet>
          <title>{`Studio Buku – Platform Penulisan Naskah Buku ${galleryPageInfo.validPage > 1 ? `(Halaman ${galleryPageInfo.validPage})` : ''}`}</title>
          <meta name="description" content="Studio Buku (studio.buku.biz.id): Platform penulisan dan penerbitan naskah kolaboratif. Jelajahi 60+ naskah novel, jurnal akademis, dan fiksi/non-fiksi karya penulis Indonesia." />
          <meta property="og:title" content="Studio Buku – Platform Kolaborasi Penulisan Naskah Buku" />
          <meta property="og:description" content="Jelajahi puluhan naskah novel, jurnal akademis, dan karya fiksi/non-fiksi terpublikasi karya para penulis di Studio Buku." />
          <meta property="og:type" content="website" />
          <meta property="og:url" content={galleryPageInfo.canonical} />
          <meta property="og:site_name" content="Studio Buku" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Studio Buku – Platform Penulisan Naskah Buku" />
          <meta name="twitter:description" content="Dapatkan akses ke galeri naskah publik gratis karya para penulis lokal Indonesia." />
          <link rel="canonical" href={galleryPageInfo.canonical} />
          {galleryPageInfo.prev && <link rel="prev" href={galleryPageInfo.prev} />}
          {galleryPageInfo.next && <link rel="next" href={galleryPageInfo.next} />}
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Studio Buku",
              "applicationCategory": "BooksApplication",
              "operatingSystem": "All",
              "description": "Platform kolaborasi penulisan naskah buku untuk co-authorship dan penerbitan naskah digital.",
              "offers": { "@type": "Offer", "price": "0", "priceCurrency": "IDR" }
            })}
          </script>
        </Helmet>

        {/* PUBLIC FRONTPAGE HEADER BAR - ROYAL PURPLE BENTO HEADER */}
        <header className="sticky top-0 z-40 bg-[#160226]/85 backdrop-blur-md border-b border-purple-800/40 px-4 sm:px-8 py-3.5 shadow-2xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <a href="/" className="hover:opacity-90 transition">
              <StudioBukuLogo size="md" variant="dark" alwaysShowText tagline="Platform Penulisan & Co-Authorship" />
            </a>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black px-5 py-2.5 rounded-full text-xs transition shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 cursor-pointer transform active:scale-95"
              >
                <LogIn className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span>Masuk Penulis</span>
              </button>
            </div>
          </div>
        </header>

        {/* PUBLIC GALLERY FRONTPAGE BODY WITH INTEGRATED BENTO HERO CARD */}
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
          <React.Suspense fallback={<LoadingFallback />}>
            <PublicProjectGallery
              projects={db?.projects || initialDefaultDb.projects}
              chapters={db?.chapters || initialDefaultDb.chapters}
              onSelectPublicProject={(p) => {
                window.open(`/p/${slugify(p.title)}`, "_blank");
              }}
            />
          </React.Suspense>
        </main>

        {/* FOOTER - ROYAL PURPLE BENTO FOOTER */}
        <footer className="border-t border-purple-900/50 bg-[#160226] py-8 text-center text-xs text-purple-300/70 space-y-3 font-sans">
          <div className="flex flex-wrap items-center justify-center gap-4 text-purple-200 font-medium">
            <a href="/terms" className="hover:text-amber-400 transition">Syarat & Ketentuan</a>
            <span>•</span>
            <a href="/privacy" className="hover:text-amber-400 transition">Kebijakan Privasi</a>
            <span>•</span>
            <button onClick={() => setShowPricingView(true)} className="hover:text-amber-400 transition cursor-pointer">
              Biaya & Donasi
            </button>
          </div>
          <p className="font-semibold text-purple-100">
            Studio Buku • Hak Cipta 2026 Studio.Buku.Biz.ID
          </p>
          <p className="text-[11px] text-purple-400/60">Platform Penulisan Buku Kolaboratif Indonesia</p>
        </footer>

        {/* LOGIN MODAL OVERLAY */}
        {isLoginModalOpen && (
          <LoginGate
            onLoginSuccess={(session) => {
              setIsLoginModalOpen(false);
              handleLoginSuccess(session);
            }}
            onClose={() => setIsLoginModalOpen(false)}
          />
        )}
      </div>
    );
  }

  if (loading || !db || !currentAuthor) {
    return (
      <div className={`min-h-screen ${currentTheme.bgMain} ${currentTheme.textMain} flex items-center justify-center font-sans`}>
        <div className="flex items-center space-x-3 text-amber-500 font-black">
          <div className="w-6 h-6 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Memuat Studio Buku (Nulis Bareng)...</span>
        </div>
      </div>
    );
  }

  // Author privilege project filtering:
  // Shows projects initiated by the author, co-authored projects, and shared Studio Buku catalog projects
  const authorProjects = (db.projects || []).filter((p) => {
    if (!currentAuthor && !userSession) return true;
    const authorId = currentAuthor?.id || userSession?.id || "";
    const authorName = currentAuthor?.name || userSession?.name || "";
    const authorEmail = userSession?.email || "";

    const isOwner = p.ownerId === authorId || p.ownerId === authorName || p.ownerId === authorEmail;
    
    let coAuthorsList: string[] = [];
    if (Array.isArray(p.coAuthors)) {
      coAuthorsList = p.coAuthors;
    } else if (typeof p.coAuthors === "string") {
      try {
        const parsed = JSON.parse(p.coAuthors);
        coAuthorsList = Array.isArray(parsed) ? parsed : [p.coAuthors];
      } catch {
        coAuthorsList = [p.coAuthors];
      }
    }

    const isCoAuthor = Array.isArray(coAuthorsList) && coAuthorsList.some(
      (ca) => ca === authorId || ca === authorName || ca === authorEmail
    );
    if (isOwner || isCoAuthor) return true;

    // Collaborative Studio Buku catalog projects & public projects are accessible to all studio writers
    if (!p.isPrivate) return true;
    if (!p.ownerId || p.ownerId.startsWith("auth_") || p.ownerId === "auth_session") return true;

    return false;
  });

  const project =
    authorProjects.find((p) => p.id === selectedProjectId) ||
    authorProjects[0] ||
    db.projects.find((p) => p.id === selectedProjectId) ||
    db.projects[0] ||
    initialDefaultDb.projects[0];

  const currentProjectChapters = db.chapters.filter((c) => c.projectId === project.id);
  const currentProjectIdeas = db.ideas.filter((i) => i.projectId === project.id);
  const currentProjectLogs = db.logs.filter((l) => l.projectId === project.id);

  // Handlers for Projects - INSTANT UI RESPONSE
  const handleCreateProject = async (newProjData: { title: string; subtitle: string; genre: string; synopsis: string; isPrivate?: boolean }) => {
    try {
      const newProjId = "proj_" + Date.now();
      const newProj: Project = {
        id: newProjId,
        title: newProjData.title,
        subtitle: newProjData.subtitle,
        genre: newProjData.genre,
        synopsis: newProjData.synopsis,
        createdAt: new Date().toISOString(),
        isPrivate: !!newProjData.isPrivate,
        ownerId: currentAuthor.id || userSession?.id || "auth_1",
        ownerName: currentAuthor.name || userSession?.name || "Penulis Studio",
        coAuthors: []
      };

      const firstChapId = "chap_" + Date.now();
      const firstChap: Chapter = {
        id: firstChapId,
        projectId: newProjId,
        title: "Bab 1: Permulaan",
        subtitle: "Draf awal cerita",
        content: "Tulis isi naskah bab pertama Anda di sini...",
        order: 1,
        status: "draft",
        lastEditedBy: currentAuthor.name,
        updatedAt: new Date().toISOString()
      };

      const updatedDb: DB = {
        ...db,
        projects: [newProj, ...db.projects],
        chapters: [firstChap, ...db.chapters]
      };
      setDb(updatedDb);
      localStorage.setItem("studio_buku_db_cache", JSON.stringify(updatedDb));

      setSelectedProjectId(newProjId);
      setSelectedChapterId(firstChapId);

      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProjData,
          ownerId: currentAuthor.id || userSession?.id,
          ownerName: currentAuthor.name || userSession?.name,
          authorName: currentAuthor.name,
          coAuthors: []
        })
      });
    } catch (e) {
      console.warn("Project created locally in state:", e);
    }
  };

  const handleUpdateProject = async (updates: Partial<Project>) => {
    if (!project) return;
    try {
      const updatedProjects = db.projects.map((p) =>
        p.id === project.id ? { ...p, ...updates } : p
      );
      const updatedDb = { ...db, projects: updatedProjects };
      setDb(updatedDb);
      localStorage.setItem("studio_buku_db_cache", JSON.stringify(updatedDb));

      await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (e) {
      console.warn("Project updated locally:", e);
    }
  };

  const handleRunDatabaseBootstrap = async () => {
    try {
      console.log("[App] 🔄 Menjalankan bootstrap database & memuat ulang data naskah...");
      const res = await fetch("/api/db/bootstrap", { method: "POST" });
      if (!res.ok) {
        console.warn(`[App] /api/db/bootstrap status ${res.status}`);
      }
    } catch (e) {
      console.warn("[App] handleRunDatabaseBootstrap warning:", e);
    }
    await loadData(selectedProjectId);
  };

  const handleSelectProject = (projId: string) => {
    setSelectedProjectId(projId);
    const projChapters = db.chapters.filter(c => c.projectId === projId);
    if (projChapters.length > 0) {
      setSelectedChapterId(projChapters[0].id);
    }
  };

  // Handlers for Chapters
  const handleUpdateChapter = async (chapter: Chapter, actionDescription: string) => {
    try {
      const updatedChapters = db.chapters.map(c => c.id === chapter.id ? { ...chapter, updatedAt: new Date().toISOString() } : c);
      const updatedDb = { ...db, chapters: updatedChapters };
      setDb(updatedDb);
      localStorage.setItem("studio_buku_db_cache", JSON.stringify(updatedDb));

      await fetch(`/api/chapters/${chapter.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...chapter,
          authorName: currentAuthor.name,
          actionDescription
        })
      });
    } catch (e) {
      console.warn("API Chapter update saved locally:", e);
    }
  };

  const handleCreateChapter = async () => {
    try {
      const newChap: Chapter = {
        id: "chap_" + Date.now(),
        projectId: project.id,
        title: `Bab ${currentProjectChapters.length + 1}: Bagian Baru`,
        subtitle: "Sub-judul bab...",
        content: "Tulis isi bab di sini...",
        order: currentProjectChapters.length + 1,
        status: "draft",
        lastEditedBy: currentAuthor.name,
        updatedAt: new Date().toISOString()
      };
      const updatedDb = { ...db, chapters: [...db.chapters, newChap] };
      setDb(updatedDb);
      localStorage.setItem("studio_buku_db_cache", JSON.stringify(updatedDb));
      setSelectedChapterId(newChap.id);

      await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newChap,
          authorName: currentAuthor.name
        })
      });
    } catch (e) {
      console.warn("Chapter created locally:", e);
    }
  };

  const handleDeleteChapter = async (id: string) => {
    try {
      const remaining = db.chapters.filter(c => c.id !== id);
      const updatedDb = { ...db, chapters: remaining };
      setDb(updatedDb);
      localStorage.setItem("studio_buku_db_cache", JSON.stringify(updatedDb));
      if (currentProjectChapters.length > 1) {
        const remProj = currentProjectChapters.filter(c => c.id !== id);
        if (remProj.length > 0) setSelectedChapterId(remProj[0].id);
      }

      await fetch(`/api/chapters/${id}`, { method: "DELETE" });
    } catch (e) {
      console.warn("Chapter deleted locally:", e);
    }
  };

  // Handlers for Ideas
  const handleAddIdea = async (idea: Partial<Idea>) => {
    try {
      const newIdea: Idea = {
        id: "idea_" + Date.now(),
        projectId: project.id,
        title: idea.title || "Ide Baru",
        content: idea.content || "",
        category: idea.category || "Plot",
        authorId: currentAuthor.id,
        pinned: !!idea.pinned,
        createdAt: new Date().toISOString()
      };
      const updatedDb = { ...db, ideas: [...db.ideas, newIdea] };
      setDb(updatedDb);
      localStorage.setItem("studio_buku_db_cache", JSON.stringify(updatedDb));

      await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIdea)
      });
    } catch (e) {
      console.warn("Idea added locally:", e);
    }
  };

  const handleUpdateIdea = async (id: string, updates: Partial<Idea>) => {
    try {
      const updatedIdeas = db.ideas.map(i => i.id === id ? { ...i, ...updates } : i);
      const updatedDb = { ...db, ideas: updatedIdeas };
      setDb(updatedDb);
      localStorage.setItem("studio_buku_db_cache", JSON.stringify(updatedDb));

      await fetch(`/api/ideas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.warn("Idea updated locally:", e);
    }
  };

  const handleDeleteIdea = async (id: string) => {
    try {
      const remaining = db.ideas.filter(i => i.id !== id);
      const updatedDb = { ...db, ideas: remaining };
      setDb(updatedDb);
      localStorage.setItem("studio_buku_db_cache", JSON.stringify(updatedDb));

      await fetch(`/api/ideas/${id}`, { method: "DELETE" });
    } catch (e) {
      console.warn("Idea deleted locally:", e);
    }
  };

  const handleCreateAnnotation = async (ann: Partial<Annotation>) => {
    try {
      const newAnn: Annotation = {
        id: "ann_" + Date.now(),
        projectId: project.id,
        chapterId: ann.chapterId || "",
        chapterTitle: ann.chapterTitle || "",
        text: ann.text || "",
        authorName: currentAuthor.name,
        createdAt: new Date().toISOString(),
        resolved: false
      };
      const updatedDb = { ...db, annotations: [...(db.annotations || []), newAnn] };
      setDb(updatedDb);
      localStorage.setItem("studio_buku_db_cache", JSON.stringify(updatedDb));

      await fetch("/api/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAnn)
      });
    } catch (e) {
      console.warn("Annotation created locally:", e);
    }
  };

  const handleUpdateAnnotation = async (id: string, updates: Partial<Annotation>) => {
    try {
      const updatedAnns = (db.annotations || []).map(a => a.id === id ? { ...a, ...updates } : a);
      const updatedDb = { ...db, annotations: updatedAnns };
      setDb(updatedDb);
      localStorage.setItem("studio_buku_db_cache", JSON.stringify(updatedDb));

      await fetch(`/api/annotations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.warn("Annotation updated locally:", e);
    }
  };

  const handleDeleteAnnotation = async (id: string) => {
    try {
      const remaining = (db.annotations || []).filter(a => a.id !== id);
      const updatedDb = { ...db, annotations: remaining };
      setDb(updatedDb);
      localStorage.setItem("studio_buku_db_cache", JSON.stringify(updatedDb));

      await fetch(`/api/annotations/${id}`, { method: "DELETE" });
    } catch (e) {
      console.warn("Annotation deleted locally:", e);
    }
  };

  return (
    <div className={`min-h-screen ${currentTheme.bgMain} ${currentTheme.textMain} flex flex-col font-sans transition-colors duration-300 select-none md:select-text`}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        project={project}
        projects={authorProjects}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onUpdateProject={handleUpdateProject}
        onRunDatabaseBootstrap={handleRunDatabaseBootstrap}
        onOpenSeedModal={() => setIsSeedModalOpen(true)}
        authors={db.authors}
        currentAuthor={currentAuthor}
        setCurrentAuthor={setCurrentAuthor}
        currentTheme={currentTheme}
        setThemeId={setThemeId}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenInvite={() => setIsInviteOpen(true)}
        onOpenNewChapter={handleCreateChapter}
        onLogout={handleLogout}
        saveStatus={saveStatus}
        lastSavedTime={lastSavedTime}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === "gallery" && (
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
            <PublicProjectGallery
              projects={db.projects}
              chapters={db.chapters}
              onSelectPublicProject={(p) => {
                setSelectedProjectId(p.id);
                setActiveTab("preview");
              }}
            />
          </div>
        )}

        {activeTab === "editor" && (
          <ChapterEditor
            chapters={currentProjectChapters}
            currentAuthor={currentAuthor}
            onUpdateChapter={handleUpdateChapter}
            onCreateChapter={handleCreateChapter}
            onDeleteChapter={handleDeleteChapter}
            selectedChapterId={selectedChapterId}
            setSelectedChapterId={setSelectedChapterId}
            currentTheme={currentTheme}
            onSaveStatusChange={(status, time) => {
              setSaveStatus(status);
              if (time) setLastSavedTime(time);
            }}
          />
        )}

        {activeTab === "ideas" && (
          <IdeaScratchpad
            ideas={currentProjectIdeas}
            authors={db.authors}
            currentAuthor={currentAuthor}
            projectId={project.id}
            onAddIdea={handleAddIdea}
            onUpdateIdea={handleUpdateIdea}
            onDeleteIdea={handleDeleteIdea}
            currentTheme={currentTheme}
          />
        )}

        {activeTab === "logs" && (
          <RevisionLogs logs={currentProjectLogs} currentTheme={currentTheme} />
        )}

        {activeTab === "preview" && (
          <BookVisualizer
            project={project}
            chapters={currentProjectChapters}
            annotations={db.annotations || []}
            currentAuthor={currentAuthor}
            onAddAnnotation={handleCreateAnnotation}
            onUpdateAnnotation={handleUpdateAnnotation}
            onDeleteAnnotation={handleDeleteAnnotation}
            currentTheme={currentTheme}
          />
        )}

        {activeTab === "ai" && (
          <AiAssistantView projectTitle={project.title} projectGenre={project.genre} currentTheme={currentTheme} />
        )}
      </main>

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        projectId={project.id}
        authorName={currentAuthor.name}
        onImportSuccess={() => loadData(project.id)}
      />

      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        projectName={project.title}
      />

      <DatabaseSeedModal
        isOpen={isSeedModalOpen}
        onClose={() => setIsSeedModalOpen(false)}
        onSuccess={() => handleRunDatabaseBootstrap()}
      />
    </div>
  );
}
