import React, { useState, useEffect, useRef } from "react";
import { Chapter, Author, GlossaryItem } from "../types";
import { WriterTheme } from "../theme";
import { Plus, Trash2, Sparkles, Clock, BookOpen, Save, Wand2, BarChart3, ChevronDown, ChevronUp, Timer, Flame, CheckCircle2, AlertCircle, Target, Award, BookMarked, Search, Edit3, Copy, User, MapPin, Globe, Zap, Tag, PanelLeftClose, PanelLeftOpen, Menu, ChevronLeft, ChevronRight } from "lucide-react";

interface ChapterEditorProps {
  chapters: Chapter[];
  glossary?: GlossaryItem[];
  currentAuthor: Author;
  onUpdateChapter: (chapter: Chapter, actionDescription: string) => void;
  onCreateChapter: () => void;
  onDeleteChapter: (id: string) => void;
  selectedChapterId: string;
  setSelectedChapterId: (id: string) => void;
  currentTheme: WriterTheme;
  onSaveStatusChange?: (status: "idle" | "typing" | "saving" | "saved" | "error", lastSavedTime?: string) => void;
  onCreateGlossaryItem?: (item: Partial<GlossaryItem>) => void;
  onUpdateGlossaryItem?: (id: string, updates: Partial<GlossaryItem>) => void;
  onDeleteGlossaryItem?: (id: string) => void;
}

export const ChapterEditor: React.FC<ChapterEditorProps> = ({
  chapters,
  glossary = [],
  currentAuthor,
  onUpdateChapter,
  onCreateChapter,
  onDeleteChapter,
  selectedChapterId,
  setSelectedChapterId,
  currentTheme,
  onSaveStatusChange,
  onCreateGlossaryItem,
  onUpdateGlossaryItem,
  onDeleteGlossaryItem,
}) => {
  const activeChapter = chapters.find(c => c.id === selectedChapterId) || chapters[0];

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "review" | "final">("draft");
  
  // Sidebar Mode: Chapters vs Glossary
  const [sidebarTab, setSidebarTab] = useState<"chapters" | "glossary">("chapters");
  
  // Glossary Search & Filter State
  const [glossarySearch, setGlossarySearch] = useState("");
  const [glossaryCategoryFilter, setGlossaryCategoryFilter] = useState<string>("Semua");
  const [isGlossaryModalOpen, setIsGlossaryModalOpen] = useState(false);
  const [editingGlossaryItem, setEditingGlossaryItem] = useState<GlossaryItem | null>(null);
  const [glossaryFormTerm, setGlossaryFormTerm] = useState("");
  const [glossaryFormCategory, setGlossaryFormCategory] = useState<GlossaryItem["category"]>("Karakter");
  const [glossaryFormDefinition, setGlossaryFormDefinition] = useState("");

  // Auto-Save States & Timestamps
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "typing" | "saving" | "saved" | "error">("idle");
  const [lastAutoSavedTime, setLastAutoSavedTime] = useState<string>("");
  const [isSavingManual, setIsSavingManual] = useState(false);

  // AI Assistant States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModalMode, setAiModalMode] = useState<"continue" | "proofread" | null>(null);
  const [aiResult, setAiResult] = useState("");

  // Sidebar Collapsible State: default expanded on desktop (>=768px), default collapsed on tablet/mobile (<768px)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return true;
  });

  // Statistics Panel State & Session Timer (Default collapsed)
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Target Settings (Daily vs Project Target) Persisted in LocalStorage
  const [targetMode, setTargetMode] = useState<"daily" | "project">(
    () => (localStorage.getItem("studio_target_mode") as "daily" | "project") || "daily"
  );
  const [dailyTarget, setDailyTarget] = useState<number>(
    () => parseInt(localStorage.getItem("studio_daily_target") || "1000", 10)
  );
  const [projectTarget, setProjectTarget] = useState<number>(
    () => parseInt(localStorage.getItem("studio_project_target") || "20000", 10)
  );

  const handleSetTargetMode = (mode: "daily" | "project") => {
    setTargetMode(mode);
    localStorage.setItem("studio_target_mode", mode);
  };

  const handleUpdateDailyTarget = (val: number) => {
    const sanitized = Math.max(100, val);
    setDailyTarget(sanitized);
    localStorage.setItem("studio_daily_target", sanitized.toString());
  };

  const handleUpdateProjectTarget = (val: number) => {
    const sanitized = Math.max(500, val);
    setProjectTarget(sanitized);
    localStorage.setItem("studio_project_target", sanitized.toString());
  };

  // Refs for Auto-Save Debounce
  const chapterRef = useRef({ title, subtitle, content, status });
  useEffect(() => {
    chapterRef.current = { title, subtitle, content, status };
  }, [title, subtitle, content, status]);

  const isInitialChapterLoad = useRef(true);

  // Session Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Report Save Status up to App/Navbar
  useEffect(() => {
    if (onSaveStatusChange) {
      onSaveStatusChange(autoSaveStatus, lastAutoSavedTime);
    }
  }, [autoSaveStatus, lastAutoSavedTime, onSaveStatusChange]);

  // Sync Chapter Data on Switch
  useEffect(() => {
    if (activeChapter) {
      isInitialChapterLoad.current = true;
      setTitle(activeChapter.title);
      setSubtitle(activeChapter.subtitle || "");
      setContent(activeChapter.content);
      setStatus(activeChapter.status);
      const timeStr = new Date(activeChapter.updatedAt).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastAutoSavedTime(timeStr);
      setAutoSaveStatus("idle");
    }
  }, [activeChapter?.id]);

  // Debounced Auto-Save Effect (1.2s Inactivity Trigger)
  useEffect(() => {
    if (isInitialChapterLoad.current) {
      isInitialChapterLoad.current = false;
      return;
    }

    if (!activeChapter) return;

    const hasChanged = 
      title !== activeChapter.title ||
      subtitle !== (activeChapter.subtitle || "") ||
      content !== activeChapter.content ||
      status !== activeChapter.status;

    if (!hasChanged) return;

    setAutoSaveStatus("typing");

    const timer = setTimeout(async () => {
      try {
        setAutoSaveStatus("saving");
        const currentData = chapterRef.current;
        const updated: Chapter = {
          ...activeChapter,
          title: currentData.title,
          subtitle: currentData.subtitle,
          content: currentData.content,
          status: currentData.status,
          lastEditedBy: currentAuthor.name,
          updatedAt: new Date().toISOString()
        };
        await onUpdateChapter(updated, "Penyimpanan otomatis naskah");
        const nowTime = new Date().toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastAutoSavedTime(nowTime);
        setAutoSaveStatus("saved");
      } catch (e) {
        console.error("Auto-save error:", e);
        setAutoSaveStatus("error");
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [title, subtitle, content, status]);

  // Manual Save Trigger
  const handleManualSave = async (actionDesc = "Penyimpanan manual naskah") => {
    if (!activeChapter) return;
    setIsSavingManual(true);
    setAutoSaveStatus("saving");
    try {
      const updated: Chapter = {
        ...activeChapter,
        title,
        subtitle,
        content,
        status,
        lastEditedBy: currentAuthor.name,
        updatedAt: new Date().toISOString()
      };
      await onUpdateChapter(updated, actionDesc);
      const nowTime = new Date().toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastAutoSavedTime(nowTime);
      setAutoSaveStatus("saved");
    } catch (e) {
      console.error(e);
      setAutoSaveStatus("error");
    } finally {
      setTimeout(() => setIsSavingManual(false), 300);
    }
  };

  // Glossary Form Handlers
  const handleOpenAddGlossary = () => {
    setEditingGlossaryItem(null);
    setGlossaryFormTerm("");
    setGlossaryFormCategory("Karakter");
    setGlossaryFormDefinition("");
    setIsGlossaryModalOpen(true);
  };

  const handleOpenEditGlossary = (item: GlossaryItem) => {
    setEditingGlossaryItem(item);
    setGlossaryFormTerm(item.term);
    setGlossaryFormCategory(item.category);
    setGlossaryFormDefinition(item.definition);
    setIsGlossaryModalOpen(true);
  };

  const handleSaveGlossary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!glossaryFormTerm.trim()) return;

    if (editingGlossaryItem && onUpdateGlossaryItem) {
      onUpdateGlossaryItem(editingGlossaryItem.id, {
        term: glossaryFormTerm.trim(),
        category: glossaryFormCategory,
        definition: glossaryFormDefinition.trim(),
        authorName: currentAuthor.name
      });
    } else if (onCreateGlossaryItem) {
      onCreateGlossaryItem({
        term: glossaryFormTerm.trim(),
        category: glossaryFormCategory,
        definition: glossaryFormDefinition.trim(),
        authorName: currentAuthor.name
      });
    }

    setIsGlossaryModalOpen(false);
  };

  const handleInsertTermToContent = (term: string) => {
    setContent(prev => prev ? `${prev} ${term}` : term);
  };

  // Filtered Glossary Items
  const filteredGlossary = glossary.filter(item => {
    const matchesSearch = 
      item.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
      item.definition.toLowerCase().includes(glossarySearch.toLowerCase());
    const matchesCategory = glossaryCategoryFilter === "Semua" || item.category === glossaryCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Karakter": return <User className="w-3.5 h-3.5 text-amber-400" />;
      case "Lokasi": return <MapPin className="w-3.5 h-3.5 text-indigo-400" />;
      case "Istilah Dunia": return <Globe className="w-3.5 h-3.5 text-emerald-400" />;
      case "Aturan Magic/Sains": return <Zap className="w-3.5 h-3.5 text-rose-400" />;
      default: return <Tag className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Metrics Calculations
  const currentChapterWordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const currentChapterCharCount = content.length;
  const currentChapterReadingTime = Math.ceil(currentChapterWordCount / 200);

  const totalProjectWords = chapters.reduce((sum, ch) => {
    if (ch.id === activeChapter?.id) {
      return sum + currentChapterWordCount;
    }
    const words = ch.content ? ch.content.trim().split(/\s+/).filter(Boolean).length : 0;
    return sum + words;
  }, 0);

  const totalChapters = chapters.length;
  const draftCount = chapters.filter(c => c.status === "draft").length;
  const reviewCount = chapters.filter(c => c.status === "review").length;
  const finalCount = chapters.filter(c => c.status === "final").length;
  const avgWordsPerChapter = Math.round(totalProjectWords / (totalChapters || 1));
  const totalReadingTimeMins = Math.ceil(totalProjectWords / 200);

  // Target Progress Calculations
  const currentTargetValue = targetMode === "daily" ? dailyTarget : projectTarget;
  const currentProgressValue = targetMode === "daily" ? currentChapterWordCount : totalProjectWords;
  const targetProgressPercent = Math.min(100, Math.round((currentProgressValue / (currentTargetValue || 1)) * 100));
  const remainingWords = Math.max(0, currentTargetValue - currentProgressValue);

  const formatSessionTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs}j ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const cumulativeWritingMinutes = Math.round((totalProjectWords / 250) * 60) + Math.floor(sessionSeconds / 60);
  const cumulativeHours = Math.floor(cumulativeWritingMinutes / 60);
  const remainingMins = cumulativeWritingMinutes % 60;
  const formattedCumulativeTime = cumulativeHours > 0 
    ? `${cumulativeHours} jam ${remainingMins} menit` 
    : `${remainingMins} menit`;

  // AI Assist with optional custom key header support
  const runAiAssist = async (action: "continue" | "proofread") => {
    setAiLoading(true);
    setAiModalMode(action);
    setAiResult("");
    try {
      const customKey = localStorage.getItem("studio_custom_gemini_key") || "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (customKey) {
        headers["x-gemini-api-key"] = customKey;
      }

      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action,
          text: content,
          context: title,
          genre: "Fiksi & Drama"
        })
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setAiResult(data.result);
      } else {
        setAiResult(data.error || "Gagal mendapatkan respons AI.");
      }
    } catch (e) {
      setAiResult("Terjadi kesalahan koneksi AI.");
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiResult = () => {
    if (!aiResult) return;
    if (aiModalMode === "continue") {
      const newContent = content + "\n\n" + aiResult;
      setContent(newContent);
    } else if (aiModalMode === "proofread") {
      setContent(aiResult);
    }
    setAiModalMode(null);
  };

  return (
    <div className={`flex-1 flex flex-col md:flex-row h-[calc(100vh-5rem)] ${currentTheme.bgMain} ${currentTheme.textMain} overflow-hidden transition-colors duration-300`}>
      {/* Sidebar Chapters & Glossary List */}
      {!isSidebarExpanded ? (
        /* COLLAPSED SIDEBAR STRIP / TOP BAR */
        <aside className={`${currentTheme.bgSidebar} border-r-2 ${currentTheme.border} transition-all duration-300 flex flex-col shrink-0`}>
          {/* Desktop Collapsed Vertical Strip */}
          <div className="hidden md:flex flex-col items-center py-3 px-2 space-y-4 w-14 h-full border-r-2 border-amber-500/20">
            <button
              onClick={() => setIsSidebarExpanded(true)}
              className="p-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl transition shadow-lg flex items-center justify-center transform active:scale-95"
              title="Buka Bilah Menu (Expand Sidebar)"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </button>

            <div className="w-8 h-0.5 bg-slate-700 rounded-full my-1" />

            <button
              onClick={() => {
                setSidebarTab("chapters");
                setIsSidebarExpanded(true);
              }}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 hover:border-amber-400 transition relative"
              title={`Menu Bab (${chapters.length})`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {chapters.length}
              </span>
            </button>

            <button
              onClick={() => {
                setSidebarTab("glossary");
                setIsSidebarExpanded(true);
              }}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 hover:border-amber-400 transition relative"
              title={`Glosarium (${glossary.length})`}
            >
              <BookMarked className="w-4 h-4" />
              <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {glossary.length}
              </span>
            </button>

            <button
              onClick={onCreateChapter}
              className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black transition shadow-md"
              title="Tambah Bab Baru"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

          {/* Mobile / Tablet Collapsed Top Bar */}
          <div className="md:hidden flex items-center justify-between p-2.5 bg-slate-900 border-b-2 border-amber-500/30">
            <button
              onClick={() => setIsSidebarExpanded(true)}
              className="flex items-center space-x-2 bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1.5 rounded-xl font-black text-xs shadow-md"
            >
              <Menu className="w-4 h-4" />
              <span className="truncate max-w-[200px]">
                {activeChapter ? activeChapter.title : "Menu Bab"} ({chapters.length})
              </span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={onCreateChapter}
                className="p-1.5 bg-emerald-500 text-slate-950 font-black rounded-lg text-xs flex items-center space-x-1"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span className="text-[10px]">Bab Baru</span>
              </button>
            </div>
          </div>
        </aside>
      ) : (
        /* EXPANDED FULL SIDEBAR */
        <aside className={`w-full md:w-80 ${currentTheme.bgSidebar} border-r-2 ${currentTheme.border} flex flex-col h-1/2 md:h-full transition-all duration-300 shrink-0`}>
          
          {/* Sidebar Header Mode Switcher (Bab vs Glosarium + Collapsible Toggle) */}
          <div className={`p-2.5 border-b-2 ${currentTheme.border} flex items-center justify-between gap-1`}>
            <div className="flex items-center space-x-1 bg-slate-900 border-2 border-slate-700 p-1 rounded-full text-xs font-black">
              <button
                onClick={() => setSidebarTab("chapters")}
                className={`px-2.5 py-1 rounded-full transition flex items-center space-x-1 ${
                  sidebarTab === "chapters" ? "bg-amber-400 text-slate-950 shadow-md" : "text-slate-300 hover:text-white"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Bab ({chapters.length})</span>
              </button>

              <button
                onClick={() => setSidebarTab("glossary")}
                className={`px-2.5 py-1 rounded-full transition flex items-center space-x-1 ${
                  sidebarTab === "glossary" ? "bg-amber-400 text-slate-950 shadow-md" : "text-slate-300 hover:text-white"
                }`}
              >
                <BookMarked className="w-3.5 h-3.5" />
                <span>Glosarium ({glossary.length})</span>
              </button>
            </div>

            <div className="flex items-center space-x-1">
              {sidebarTab === "chapters" ? (
                <button
                  onClick={onCreateChapter}
                  className="inline-flex items-center space-x-1 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-2 py-1.5 rounded-full transition shadow-md shrink-0"
                  title="Tambah Bab Baru"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span className="hidden sm:inline">Tambah</span>
                </button>
              ) : (
                <button
                  onClick={handleOpenAddGlossary}
                  className="inline-flex items-center space-x-1 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-2 py-1.5 rounded-full transition shadow-md shrink-0"
                  title="Tambah Karakter / Istilah Baru"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span className="hidden sm:inline">Istilah</span>
                </button>
              )}

              {/* COLLAPSE TOGGLE BUTTON */}
              <button
                onClick={() => setIsSidebarExpanded(false)}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl border border-slate-700 transition shadow-sm"
                title="Ciutkan Bilah Menu"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SIDEBAR TAB 1: CHAPTERS LIST */}
          {sidebarTab === "chapters" && (
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {chapters.map((chap, idx) => {
                const isSelected = chap.id === activeChapter?.id;
                return (
                  <div
                    key={chap.id}
                    onClick={() => setSelectedChapterId(chap.id)}
                    className={`w-full text-left p-3 rounded-xl transition cursor-pointer flex items-start justify-between group border-2 ${
                      isSelected
                        ? "bg-amber-400 text-slate-950 font-black border-amber-300 shadow-md ring-2 ring-slate-900/20"
                        : `${currentTheme.bgCard} ${currentTheme.border} hover:border-amber-400/60 text-slate-900 dark:text-slate-100 font-bold`
                    }`}
                  >
                    <div className="space-y-1 pr-2 flex-1 min-w-0">
                      <div className="flex items-start space-x-2">
                        <span className={`text-xs font-mono font-black shrink-0 pt-0.5 ${isSelected ? "text-slate-950" : "text-amber-600"}`}>#{idx + 1}</span>
                        <h3 className="text-xs font-black break-words whitespace-normal leading-snug">{chap.title}</h3>
                      </div>
                      {chap.subtitle && <p className={`text-[11px] break-words whitespace-normal leading-snug ${isSelected ? "text-slate-900 font-semibold" : currentTheme.textMuted}`}>{chap.subtitle}</p>}
                      <div className="flex items-center space-x-2 pt-1 text-[10px]">
                        <span className={`px-2 py-0.5 rounded font-black uppercase text-[9px] ${
                          chap.status === "final" ? "bg-emerald-600 text-white" :
                          chap.status === "review" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-white"
                        }`}>
                          {chap.status}
                        </span>
                        <span className={isSelected ? "text-slate-900 font-semibold" : currentTheme.textMuted}>• {chap.lastEditedBy}</span>
                      </div>
                    </div>

                    {chapters.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Hapus bab "${chap.title}"?`)) {
                            onDeleteChapter(chap.id);
                          }
                        }}
                        className={`p-1 transition rounded ${isSelected ? "text-slate-950 hover:bg-slate-950/10" : "text-red-500 hover:text-red-700"}`}
                        title="Hapus Bab"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* SIDEBAR TAB 2: GLOSARIUM PROYEK LIST */}
          {sidebarTab === "glossary" && (
            <div className="flex-1 flex flex-col overflow-hidden p-2 space-y-2">
              
              {/* Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={glossarySearch}
                  onChange={(e) => setGlossarySearch(e.target.value)}
                  placeholder="Cari karakter/istilah..."
                  className={`w-full pl-8 pr-3 py-1.5 border-2 ${currentTheme.border} ${currentTheme.bgCard} text-xs font-bold rounded-xl focus:outline-none focus:border-amber-400`}
                />
              </div>

              {/* Category Filter Pills with Left/Right Swipe Arrow Clues */}
              <div className="flex items-center space-x-1">
                <ChevronLeft className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[10px] font-black shrink-0 flex-1">
                  {["Semua", "Karakter", "Lokasi", "Istilah Dunia", "Aturan Magic/Sains", "Lainnya"].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setGlossaryCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-full whitespace-nowrap border ${
                        glossaryCategoryFilter === cat
                          ? "bg-amber-400 text-slate-950 border-amber-300"
                          : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
              </div>

              {/* Glossary Items List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                {filteredGlossary.map(item => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border-2 ${currentTheme.border} ${currentTheme.bgCard} space-y-2 shadow-sm transition hover:border-amber-400/80`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="space-y-0.5 pr-1 min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          {getCategoryIcon(item.category)}
                          <span className="text-xs font-black break-words whitespace-normal leading-snug">{item.term}</span>
                        </div>
                        <span className="inline-block text-[9px] font-black px-2 py-0.2 rounded-full bg-slate-900 text-amber-300 border border-slate-700">
                          {item.category}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => handleInsertTermToContent(item.term)}
                          className="p-1 text-emerald-500 hover:text-emerald-400 rounded hover:bg-slate-800"
                          title="Sisipkan istilah ini ke naskah"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditGlossary(item)}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                          title="Edit Istilah"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteGlossaryItem && (
                          <button
                            onClick={() => {
                              if (confirm(`Hapus istilah "${item.term}" dari Glosarium?`)) {
                                onDeleteGlossaryItem(item.id);
                              }
                            }}
                            className="p-1 text-red-400 hover:text-red-300 rounded hover:bg-slate-800"
                            title="Hapus Istilah"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] leading-relaxed font-medium whitespace-pre-wrap opacity-90 line-clamp-3">
                      {item.definition || "(Belum ada deskripsi)"}
                    </p>
                    
                    <div className="text-[9px] text-slate-400 font-semibold pt-1 border-t border-slate-800/80 flex items-center justify-between">
                      <span>Oleh: {item.authorName}</span>
                      <button
                        onClick={() => handleInsertTermToContent(item.term)}
                        className="text-amber-400 font-bold hover:underline"
                      >
                        + Sisipkan Nama
                      </button>
                    </div>
                  </div>
                ))}

                {filteredGlossary.length === 0 && (
                  <div className={`text-center py-12 ${currentTheme.textMuted} text-xs font-bold space-y-1`}>
                    <BookMarked className="w-6 h-6 mx-auto opacity-50 mb-2" />
                    <p>Belum ada istilah glosarium.</p>
                    <p className="text-[10px] font-normal opacity-80">Klik "+ Istilah" di atas untuk menyimpan karakter atau istilah dunia.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Studio Active Status Indicator */}
          <div className={`p-3.5 border-t-2 ${currentTheme.border} text-xs flex items-center justify-between ${currentTheme.textMuted} font-bold`}>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Penulis Studio: {currentAuthor.name}</span>
            </div>
            <span className="text-[10px] font-mono opacity-80 uppercase tracking-wider">Auto-save ON</span>
          </div>
        </aside>
      )}

      {/* Main Chapter Writing Area */}
      <main className="flex-1 flex flex-col h-2/3 md:h-full overflow-hidden">
        {activeChapter ? (
          <>
            {/* Editor Top Bar */}
            <div className={`${currentTheme.bgCard} border-b-2 ${currentTheme.border} px-6 py-3 flex flex-wrap items-center justify-between gap-4 transition-colors duration-300`}>
              <div className="flex-1 min-w-[240px] space-y-1">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`bg-transparent text-lg font-black w-full focus:outline-none focus:ring-2 focus:ring-amber-500 rounded px-1 ${currentTheme.textMain}`}
                  placeholder="Judul Bab..."
                />
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className={`bg-transparent text-xs font-semibold w-full focus:outline-none focus:ring-1 focus:ring-amber-500 rounded px-1 ${currentTheme.textMuted}`}
                  placeholder="Sub-judul atau catatan adegan..."
                />
              </div>

              {/* High Contrast Studio Action Buttons */}
              <div className="flex items-center space-x-2">
                {/* Toggle Stats Panel Button */}
                <button
                  onClick={() => setShowStatsPanel(!showStatsPanel)}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-black transition border-2 ${
                    showStatsPanel
                      ? "bg-amber-400 text-slate-950 border-amber-300 shadow-md"
                      : "bg-slate-900 text-white border-slate-700 hover:bg-slate-800"
                  }`}
                  title="Tampilkan / Sembunyikan Panel Ringkasan Statistik Penulisan"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-amber-950 dark:text-amber-300" />
                  <span className="hidden sm:inline">Statistik</span>
                  {showStatsPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className={`border-2 ${currentTheme.border} bg-slate-900 text-white font-extrabold text-xs rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400`}
                >
                  <option value="draft">Draf (Draft)</option>
                  <option value="review">Tinjauan (Review)</option>
                  <option value="final">Final</option>
                </select>

                <button
                  onClick={() => runAiAssist("continue")}
                  disabled={aiLoading}
                  className="inline-flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3.5 py-1.5 rounded-full transition shadow-md font-black"
                  title="Lanjutkan penulisan dengan Gemini AI"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">Lanjutkan AI</span>
                </button>

                <button
                  onClick={() => runAiAssist("proofread")}
                  disabled={aiLoading}
                  className="inline-flex items-center space-x-1 bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-700 text-xs font-black px-3 py-1.5 rounded-full transition shadow-sm"
                  title="Periksa EBI & Tata Bahasa"
                >
                  <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Proofread</span>
                </button>

                <button
                  onClick={() => handleManualSave("Penyimpanan manual")}
                  className="inline-flex items-center space-x-1 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-4 py-1.5 rounded-full transition shadow-md transform hover:scale-105"
                >
                  <Save className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{isSavingManual ? "Menyimpan..." : "Simpan"}</span>
                </button>
              </div>
            </div>

            {/* PANEL RINGKASAN STATISTIK PENULISAN */}
            {showStatsPanel && (
              <div className={`${currentTheme.bgCard} border-b-2 ${currentTheme.border} px-6 py-3.5 shadow-inner space-y-3 animate-in fade-in slide-in-from-top-2 duration-200`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-500">
                      Panel Ringkasan Statistik & Target Penulisan Studio
                    </h3>
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] font-bold">
                    <span className="flex items-center space-x-1 text-emerald-500">
                      <Timer className="w-3.5 h-3.5" />
                      <span>Sesi Aktif: {formatSessionTime(sessionSeconds)}</span>
                    </span>
                  </div>
                </div>

                {/* 3 Main Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Stat 1: Interactive Target Kata Harian / Proyek */}
                  <div className={`p-3.5 rounded-2xl border-2 ${currentTheme.border} ${currentTheme.bgMain} flex flex-col justify-between shadow-sm space-y-2`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <Target className="w-4 h-4 text-amber-500" />
                        <span className={`text-[10px] font-black uppercase tracking-wider ${currentTheme.textMuted}`}>
                          Target Penulisan
                        </span>
                      </div>

                      {/* Target Mode Switcher Pills */}
                      <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700 p-0.5 rounded-full text-[9px]">
                        <button
                          type="button"
                          onClick={() => handleSetTargetMode("daily")}
                          className={`px-2 py-0.5 rounded-full font-black transition ${
                            targetMode === "daily" ? "bg-amber-400 text-slate-950 shadow" : "text-white hover:text-amber-200"
                          }`}
                        >
                          Harian
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetTargetMode("project")}
                          className={`px-2 py-0.5 rounded-full font-black transition ${
                            targetMode === "project" ? "bg-amber-400 text-slate-950 shadow" : "text-white hover:text-amber-200"
                          }`}
                        >
                          Proyek
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between">
                        <div className="text-xl sm:text-2xl font-black text-amber-500 leading-none">
                          {currentProgressValue.toLocaleString("id-ID")}{" "}
                          <span className="text-xs font-bold text-slate-400">/ {currentTargetValue.toLocaleString("id-ID")} kata</span>
                        </div>
                        <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                          targetProgressPercent >= 100 ? "bg-emerald-600 text-white" : "bg-amber-400 text-slate-950"
                        }`}>
                          {targetProgressPercent}%
                        </span>
                      </div>

                      {/* Quick Presets Selection */}
                      <div className="flex items-center space-x-1 mt-2.5">
                        <span className="text-[9px] font-bold text-slate-400 mr-1">Atur Target:</span>
                        {(targetMode === "daily" ? [500, 1000, 2000, 3000] : [10000, 20000, 50000, 80000]).map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => targetMode === "daily" ? handleUpdateDailyTarget(preset) : handleUpdateProjectTarget(preset)}
                            className={`px-2 py-0.5 text-[9px] rounded-full font-black transition border ${
                              currentTargetValue === preset
                                ? "bg-amber-400 text-slate-950 border-amber-300 shadow-sm"
                                : "bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-400"
                            }`}
                          >
                            {preset >= 1000 ? `${preset / 1000}k` : preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Progress Bar & Achievement Indicator */}
                    <div className="pt-1">
                      <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            targetProgressPercent >= 100 ? "bg-emerald-400 shadow-md shadow-emerald-500/50" : "bg-amber-400"
                          }`}
                          style={{ width: `${targetProgressPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-extrabold mt-1.5">
                        {targetProgressPercent >= 100 ? (
                          <span className="text-emerald-400 flex items-center space-x-1">
                            <Award className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                            <span>🎉 Target {targetMode === "daily" ? "Harian" : "Proyek"} Tercapai! Hebat!</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            Sisa <strong className="text-amber-400">{remainingWords.toLocaleString("id-ID")} kata</strong> lagi untuk target {targetMode === "daily" ? "harian" : "proyek"}.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stat 2: Jumlah Bab & Status */}
                  <div className={`p-3.5 rounded-2xl border-2 ${currentTheme.border} ${currentTheme.bgMain} flex flex-col justify-between shadow-sm space-y-1.5`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${currentTheme.textMuted}`}>
                        Jumlah Bab Proyek
                      </span>
                      <BookOpen className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black text-amber-500 leading-none">
                        {totalChapters}{" "}
                        <span className="text-xs font-bold text-slate-400">Bab</span>
                      </div>
                      <div className="text-[10px] font-semibold text-slate-400 mt-1">
                        Rata-rata: <strong className="text-amber-400">~{avgWordsPerChapter}</strong> kata/bab
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5 pt-1 text-[10px] font-black">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                        {finalCount} Final
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                        {reviewCount} Review
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-white border border-slate-700">
                        {draftCount} Draf
                      </span>
                    </div>
                  </div>

                  {/* Stat 3: Waktu Penulisan Proyek */}
                  <div className={`p-3.5 rounded-2xl border-2 ${currentTheme.border} ${currentTheme.bgMain} flex flex-col justify-between shadow-sm space-y-1.5`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${currentTheme.textMuted}`}>
                        Waktu Penulisan Proyek
                      </span>
                      <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <div className="text-lg sm:text-xl font-black text-amber-500 leading-none">
                        {formattedCumulativeTime}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-400 mt-1">
                        Estimasi baca naskah: <strong className="text-amber-400">~{totalReadingTimeMins} min</strong>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pt-1 border-t border-slate-800/80">
                      <span>Sesi saat ini</span>
                      <span className="text-emerald-400 font-mono font-black">{formatSessionTime(sessionSeconds)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Metrics Bar & Live Auto-Save Status Indicator */}
            <div className={`border-b-2 ${currentTheme.border} px-6 py-2 flex items-center justify-between text-xs ${currentTheme.textMuted} font-bold flex-wrap gap-2`}>
              <div className="flex items-center space-x-3">
                <span>📝 {currentChapterWordCount} Kata (Bab ini)</span>
                <span>•</span>
                <span>📊 {totalProjectWords.toLocaleString("id-ID")} Kata (Total Proyek)</span>
                <span>•</span>
                <span>📚 {totalChapters} Bab</span>
                <span>•</span>
                <span>⏱️ ~{currentChapterReadingTime} min baca</span>
              </div>

              {/* LIVE AUTO-SAVE STATUS INDICATOR */}
              <div className="flex items-center space-x-2">
                {autoSaveStatus === "typing" && (
                  <span className="flex items-center space-x-1.5 text-amber-400 font-extrabold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span>Mengetik... (Auto-save)</span>
                  </span>
                )}

                {autoSaveStatus === "saving" && (
                  <span className="flex items-center space-x-1.5 text-amber-400 font-extrabold">
                    <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
                    <span>Menyimpan otomatis...</span>
                  </span>
                )}

                {(autoSaveStatus === "saved" || autoSaveStatus === "idle") && (
                  <span className="flex items-center space-x-1.5 text-emerald-500 font-extrabold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Tersimpan otomatis ({lastAutoSavedTime || "Baru saja"})</span>
                  </span>
                )}

                {autoSaveStatus === "error" && (
                  <span className="flex items-center space-x-1.5 text-red-500 font-extrabold">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                    <span>Gagal menyimpan otomatis</span>
                  </span>
                )}
              </div>
            </div>

            {/* TextArea Editor */}
            <div className={`flex-1 p-6 md:p-10 overflow-y-auto ${currentTheme.editorPaperBg} transition-colors duration-300`}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Mulai menulis naskah buku Anda di sini... (Setiap ketikan tersimpan otomatis secara real-time)."
                className={`w-full h-full bg-transparent ${currentTheme.editorPaperText} placeholder-slate-400 resize-none focus:outline-none font-sans text-base md:text-lg leading-relaxed tracking-wide`}
                style={{ minHeight: "600px" }}
              />
            </div>
          </>
        ) : (
          <div className={`flex-1 flex items-center justify-center ${currentTheme.textMuted} font-bold`}>
            Pilih atau buat bab baru untuk mulai menulis.
          </div>
        )}
      </main>

      {/* AI Assistant Modal Result */}
      {aiModalMode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border-2 border-amber-500/50 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold">
                  {aiModalMode === "continue" ? "Hasil Lanjutkan AI Studio" : "Hasil Proofread & EBI"}
                </h3>
              </div>
              <button
                onClick={() => setAiModalMode(null)}
                className="text-slate-400 hover:text-white font-black text-lg"
              >
                ✕
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto bg-slate-900 p-4 rounded-xl border-2 border-slate-800 text-sm text-slate-100 whitespace-pre-wrap leading-relaxed font-sans font-medium">
              {aiLoading ? (
                <div className="flex items-center justify-center py-12 space-x-2 text-amber-400 font-bold">
                  <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Gemini AI sedang merangkai kata...</span>
                </div>
              ) : (
                aiResult
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setAiModalMode(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-700 text-xs font-bold rounded-full transition"
              >
                Batal
              </button>
              {!aiLoading && aiResult && (
                <button
                  onClick={applyAiResult}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-full transition shadow-lg"
                >
                  {aiModalMode === "continue" ? "Sisipkan ke Naskah" : "Gantikan Versi Ini"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT GLOSSARY ITEM MODAL */}
      {isGlossaryModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border-2 border-amber-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <BookMarked className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold">
                  {editingGlossaryItem ? "Edit Istilah Glosarium" : "Tambah Istilah / Karakter Baru"}
                </h3>
              </div>
              <button
                onClick={() => setIsGlossaryModalOpen(false)}
                className="text-slate-400 hover:text-white font-black text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGlossary} className="space-y-3">
              <div>
                <label className="block text-xs font-black text-amber-300 mb-1">
                  Nama Karakter / Istilah Dunia / Tempat:
                </label>
                <input
                  type="text"
                  required
                  value={glossaryFormTerm}
                  onChange={(e) => setGlossaryFormTerm(e.target.value)}
                  placeholder="misal: Kirana Maharani / Kotak Jati Ukir"
                  className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-amber-300 mb-1">
                  Kategori:
                </label>
                <select
                  value={glossaryFormCategory}
                  onChange={(e) => setGlossaryFormCategory(e.target.value as any)}
                  className="w-full bg-slate-900 border-2 border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-400"
                >
                  <option value="Karakter">👤 Karakter (Tokoh / Peran)</option>
                  <option value="Lokasi">📍 Lokasi (Tempat / Setting)</option>
                  <option value="Istilah Dunia">🌌 Istilah Dunia (Lore / Objek)</option>
                  <option value="Aturan Magic/Sains">⚡ Aturan Magic / Sains</option>
                  <option value="Lainnya">🏷️ Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-amber-300 mb-1">
                  Definisi / Catatan Latar Belakang:
                </label>
                <textarea
                  value={glossaryFormDefinition}
                  onChange={(e) => setGlossaryFormDefinition(e.target.value)}
                  placeholder="Catatan sifat, latar belakang, visual, atau aturan khusus agar tim penulis konsisten..."
                  className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400 h-28 resize-none font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGlossaryModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-700 text-xs font-bold rounded-full transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-full transition shadow-lg"
                >
                  Simpan ke Glosarium
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
