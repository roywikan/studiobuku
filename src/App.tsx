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

export default function App() {
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

  const loadData = async (targetProjectId?: string) => {
    try {
      const res = await fetch("/api/data");
      const data: DB = await res.json();
      setDb(data);

      if (data.authors && data.authors.length > 0 && !currentAuthor) {
        setCurrentAuthor(data.authors[0]);
      }

      // Determine active project
      const projId = targetProjectId || selectedProjectId || (data.projects[0] ? data.projects[0].id : "proj_1");
      setSelectedProjectId(projId);

      // Determine active chapter for active project
      const projChapters = data.chapters.filter(c => c.projectId === projId);
      if (projChapters.length > 0) {
        setSelectedChapterId(projChapters[0].id);
      } else if (data.chapters.length > 0) {
        setSelectedChapterId(data.chapters[0].id);
      }
    } catch (e) {
      console.error("Failed to load db data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const project = db.projects.find(p => p.id === selectedProjectId) || db.projects[0] || {
    id: "proj_1",
    title: "Gema Di Ujung Senja",
    subtitle: "Novel Studio",
    genre: "Fiksi",
    synopsis: "Sinopsis proyek naskah...",
    createdAt: new Date().toISOString()
  };

  const currentProjectChapters = db.chapters.filter(c => c.projectId === project.id);
  const currentProjectIdeas = db.ideas.filter(i => i.projectId === project.id);
  const currentProjectLogs = db.logs.filter(l => l.projectId === project.id);

  // Handlers for Projects
  const handleCreateProject = async (newProjData: { title: string; subtitle: string; genre: string; synopsis: string }) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProjData,
          authorName: currentAuthor.name
        })
      });
      const createdProj: Project = await res.json();
      await loadData(createdProj.id);
    } catch (e) {
      console.error("Error creating new project:", e);
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
      await fetch(`/api/chapters/${chapter.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...chapter,
          authorName: currentAuthor.name,
          actionDescription
        })
      });
      loadData(project.id);
    } catch (e) {
      console.error("Error updating chapter:", e);
      throw e;
    }
  };

  const handleCreateChapter = async () => {
    try {
      const res = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          title: `Bab ${currentProjectChapters.length + 1}: Bagian Baru`,
          subtitle: "Sub-judul bab...",
          content: "Tulis isi bab di sini...",
          order: currentProjectChapters.length + 1,
          status: "draft",
          authorName: currentAuthor.name
        })
      });
      const newChap = await res.json();
      await loadData(project.id);
      setSelectedChapterId(newChap.id);
    } catch (e) {
      console.error("Error creating chapter:", e);
    }
  };

  const handleDeleteChapter = async (id: string) => {
    try {
      await fetch(`/api/chapters/${id}`, { method: "DELETE" });
      await loadData(project.id);
      if (currentProjectChapters.length > 1) {
        const remaining = currentProjectChapters.filter(c => c.id !== id);
        if (remaining.length > 0) setSelectedChapterId(remaining[0].id);
      }
    } catch (e) {
      console.error("Error deleting chapter:", e);
    }
  };

  // Handlers for Ideas
  const handleAddIdea = async (idea: Partial<Idea>) => {
    try {
      await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...idea,
          projectId: project.id,
          authorId: currentAuthor.id
        })
      });
      loadData(project.id);
    } catch (e) {
      console.error("Error adding idea:", e);
    }
  };

  const handleUpdateIdea = async (id: string, updates: Partial<Idea>) => {
    try {
      await fetch(`/api/ideas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      loadData(project.id);
    } catch (e) {
      console.error("Error updating idea:", e);
    }
  };

  const handleDeleteIdea = async (id: string) => {
    try {
      await fetch(`/api/ideas/${id}`, { method: "DELETE" });
      loadData(project.id);
    } catch (e) {
      console.error("Error deleting idea:", e);
    }
  };

  const handleCreateAnnotation = async (ann: Partial<Annotation>) => {
    try {
      await fetch("/api/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...ann,
          projectId: project.id,
          authorName: currentAuthor.name
        })
      });
      loadData(project.id);
    } catch (e) {
      console.error("Error creating annotation:", e);
    }
  };

  const handleUpdateAnnotation = async (id: string, updates: Partial<Annotation>) => {
    try {
      await fetch(`/api/annotations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      loadData(project.id);
    } catch (e) {
      console.error("Error updating annotation:", e);
    }
  };

  const handleDeleteAnnotation = async (id: string) => {
    try {
      await fetch(`/api/annotations/${id}`, { method: "DELETE" });
      loadData(project.id);
    } catch (e) {
      console.error("Error deleting annotation:", e);
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
