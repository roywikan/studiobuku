import React, { useState, useEffect } from "react";
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

const initialDefaultDb: DB = {
  authors: [
    { id: "auth_1", name: "Rian Hidayat", role: "Penulis Utama", avatar: "👨‍💻", color: "bg-emerald-500" },
    { id: "auth_2", name: "Kirana Maharani", role: "Penulis Studio", avatar: "👩‍🎨", color: "bg-indigo-500" }
  ],
  projects: [
    {
      id: "proj_1",
      title: "Gema Di Ujung Senja",
      subtitle: "Novel Fiksi Psikologis & Perjalanan Dua Jiwa",
      genre: "Fiksi / Drama",
      synopsis: "Kisah tentang dua sahabat masa kecil yang terpisah selama satu dekade dan dipertemukan kembali dalam proyek restorasi arsip tua di Yogyakarta.",
      createdAt: new Date().toISOString()
    }
  ],
  chapters: [
    {
      id: "chap_1",
      projectId: "proj_1",
      title: "Bab 1: Stasiun Tugu Pukul Empat Sore",
      subtitle: "Pertemuan setelah sepuluh tahun berlalu",
      content: "Kereta rel listrik berdecit pelan saat memasuki peron jalur tiga Stasiun Tugu. Aroma uap panas bercampur bau khas stasiun tua menyambut kedatangan sore itu. Langit Yogyakarta tampak jingga kemerahan, menepis mendung yang menggantung sejak siang.\n\nArya berdiri di dekat pilar besi bercat hijau pudar. Tangannya menggenggam tiket kertas yang sudah agak kusut. Di seberangnya, seorang perempuan berjas hujan abu-abu melangkah turun dari gerbong ekonomi, membawa ransel kanvas lusuh yang sama persis seperti sepuluh tahun lalu.\n\n'Kamu terlambat lima menit, Kiran,' sapa Arya dengan senyum tipis.\n\nKirana mendengus pelan, lalu tertawa kecil. 'Kemacetan Ring Road tidak bisa diajak kompromi, Ary. Tapi setidaknya kita tepat waktu untuk memulai semua ini.'",
      order: 1,
      status: "final",
      lastEditedBy: "Rian Hidayat",
      updatedAt: new Date().toISOString()
    },
    {
      id: "chap_2",
      projectId: "proj_1",
      title: "Bab 2: Arsip yang Terlupakan",
      subtitle: "Menemukan kotak kayu berdebu di loteng",
      content: "Rumah kakek di kawasan Kotabaru menyimpan lorong waktu tersendiri. Debu lembut menari di bawah sorotan cahaya matahari yang menembus genting kaca.\n\n'Di sinilah kakek menyimpan catatan harian tahun 1965,' ujar Kirana sambil menyeka permukaan kotak kayu jati berukir melati.\n\nArya mendekat, membawa lampu senter kecil. Bau kertas tua semacam vanili kering dan tinta cina langsung menusuk indra penciuman mereka. Lembar demi lembar catatan itu menyimpan teka-teki keluarga yang selama ini terkubur rapat.",
      order: 2,
      status: "review",
      lastEditedBy: "Kirana Maharani",
      updatedAt: new Date().toISOString()
    }
  ],
  ideas: [
    {
      id: "idea_1",
      projectId: "proj_1",
      title: "Simbol Kunci Inggris Tua",
      content: "Kunci inggris peninggalan ayah Arya jadi metafora rekonsiliasi. Setiap bab bisa disisipkan kutipan tentang memperbaiki mesin yang macet.",
      category: "Plot",
      authorId: "auth_1",
      pinned: true,
      createdAt: new Date().toISOString()
    }
  ],
  logs: [
    {
      id: "log_1",
      projectId: "proj_1",
      chapterId: "chap_1",
      chapterTitle: "Bab 1: Stasiun Tugu Pukul Empat Sore",
      authorName: "Rian Hidayat",
      action: "Membuat bab baru dan menulis draf awal",
      timestamp: new Date().toISOString()
    }
  ],
  annotations: [],
  glossary: [
    {
      id: "glos_1",
      projectId: "proj_1",
      term: "Arya Perkasa",
      category: "Karakter",
      definition: "Tokoh utama pria, 28 tahun, konservator arsip sejarah lulusan UGM.",
      aliases: "Ary, Arya",
      updatedAt: new Date().toISOString()
    },
    {
      id: "glos_2",
      projectId: "proj_1",
      term: "Kirana Maharani",
      category: "Karakter",
      definition: "Tokoh utama wanita, jurnalis lepas berjiwa petualang.",
      aliases: "Kiran, Kirana",
      updatedAt: new Date().toISOString()
    }
  ]
};

export default function App() {
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem("studio_buku_session");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [db, setDb] = useState<DB | null>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "ideas" | "logs" | "preview" | "ai">("editor");
  const [currentAuthor, setCurrentAuthor] = useState<Author | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [themeId, setThemeIdState] = useState<string>(() => {
    return localStorage.getItem("studio_buku_theme") || "rosequartz";
  });
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
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

  const handleLogout = () => {
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

  if (!userSession) {
    return <LoginGate onLoginSuccess={handleLoginSuccess} />;
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

  const project = db.projects.find(p => p.id === selectedProjectId) || db.projects[0] || initialDefaultDb.projects[0];

  const currentProjectChapters = db.chapters.filter(c => c.projectId === project.id);
  const currentProjectIdeas = db.ideas.filter(i => i.projectId === project.id);
  const currentProjectLogs = db.logs.filter(l => l.projectId === project.id);

  // Handlers for Projects - INSTANT UI RESPONSE
  const handleCreateProject = async (newProjData: { title: string; subtitle: string; genre: string; synopsis: string }) => {
    try {
      const newProjId = "proj_" + Date.now();
      const newProj: Project = {
        id: newProjId,
        title: newProjData.title,
        subtitle: newProjData.subtitle,
        genre: newProjData.genre,
        synopsis: newProjData.synopsis,
        createdAt: new Date().toISOString()
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

      // 1. Instantly update React state so UI updates in 0ms!
      const updatedDb: DB = {
        ...db,
        projects: [newProj, ...db.projects],
        chapters: [firstChap, ...db.chapters]
      };
      setDb(updatedDb);
      localStorage.setItem("studio_buku_db_cache", JSON.stringify(updatedDb));

      // 2. Select new project and new chapter immediately!
      setSelectedProjectId(newProjId);
      setSelectedChapterId(firstChapId);

      // 3. Send to API in background
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProjData,
          authorName: currentAuthor.name
        })
      });
    } catch (e) {
      console.warn("Project created locally in state:", e);
    }
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
        projects={db.projects}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
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
