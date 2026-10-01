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

  if (!userSession) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none md:select-text">
        <Helmet>
          <title>Studio Buku – Platform Kolaborasi Penulisan Naskah Buku untuk Co-authorship</title>
          <meta name="description" content="Studio Buku (studio.buku.biz.id): Platform penulisan dan penerbitan naskah kolaboratif. Jelajahi 60+ naskah novel, jurnal akademis, dan fiksi/non-fiksi karya penulis Indonesia." />
          <meta property="og:title" content="Studio Buku – Platform Kolaborasi Penulisan Naskah Buku" />
          <meta property="og:description" content="Jelajahi puluhan naskah novel, jurnal akademis, dan karya fiksi/non-fiksi terpublikasi karya para penulis di Studio Buku." />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://studio.buku.biz.id/" />
          <meta property="og:site_name" content="Studio Buku" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Studio Buku – Platform Penulisan Naskah Buku" />
          <meta name="twitter:description" content="Dapatkan akses ke galeri naskah publik gratis karya para penulis lokal Indonesia." />
          <link rel="canonical" href="https://studio.buku.biz.id/" />
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
        {/* PUBLIC FRONTPAGE HEADER BAR - LIGHT CORPORATE */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Logo frontpage: Cukup "Studio Buku" saja tanpa logo icon & tanpa "Nulis Buku Bareng" */}
            <a href="/" className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight hover:text-amber-600 transition">
              Studio Buku
            </a>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-5 py-2 rounded-full text-xs transition shadow-sm flex items-center space-x-1.5 cursor-pointer transform active:scale-95"
              >
                <LogIn className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span>Login</span>
              </button>
            </div>
          </div>
        </header>

        {/* HERO BANNER SECTION - LIGHT CORPORATE */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-3 shadow-sm">
            <div className="inline-flex items-center space-x-2 bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-1 rounded-full text-xs font-bold">
              <span>📚 Platform Kolaborasi Penulisan Naskah Buku untuk Co-authorship</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Ruang Kerja Penulis & Galeri Naskah Terbuka
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-3xl font-medium">
              Selamat datang di Studio Buku (studio.buku.biz.id) — wadah penerbitan & penulisan naskah kolaboratif. Jelajahi puluhan karya novel, jurnal akademis, dan buku fiksi/non-fiksi karya para penulis Indonesia.
            </p>
          </div>
        </section>

        {/* PUBLIC GALLERY FRONTPAGE BODY */}
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

        {/* FOOTER - LIGHT CORPORATE */}
        <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 space-y-3 font-sans">
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600 font-medium">
            <a href="/terms" className="hover:text-amber-600 transition">Syarat & Ketentuan</a>
            <span>•</span>
            <a href="/privacy" className="hover:text-amber-600 transition">Kebijakan Privasi</a>
            <span>•</span>
            <button onClick={() => setShowPricingView(true)} className="hover:text-amber-600 transition cursor-pointer">
              Biaya & Donasi
            </button>
          </div>
          <p className="font-semibold text-slate-700">
            Studio Buku • Hak Cipta 2026 Studio.Buku.Biz.ID
          </p>
          <p className="text-[11px] text-slate-400">
            Platform Penulisan Buku Kolaboratif Indonesia
          </p>
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
  // A logged in author can ONLY see & edit projects they initiated (ownerId) OR were invited to co-author (coAuthors)
  const authorProjects = (db.projects || []).filter((p) => {
    if (!currentAuthor && !userSession) return true;
    const authorId = currentAuthor?.id || userSession?.id || "";
    const authorName = currentAuthor?.name || userSession?.name || "";
    const authorEmail = userSession?.email || "";

    // Legacy project fallback: if no ownerId is set, default accessible to initial authors
    if (!p.ownerId) return true;

    const isOwner = p.ownerId === authorId || p.ownerId === authorName || p.ownerId === authorEmail;
    const isCoAuthor = (p.coAuthors || []).some(
      (ca) => ca === authorId || ca === authorName || ca === authorEmail
    );

    return isOwner || isCoAuthor;
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
    const res = await fetch("/api/db/bootstrap", { method: "POST" });
    if (!res.ok) throw new Error("Gagal melakukan bootstrap database");
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
    </div>
  );
}
