import React, { useState } from "react";
import { Author, Project } from "../types";
import { WriterTheme, WRITER_THEMES } from "../theme";
import { StudioBukuLogo } from "./StudioBukuLogo";
import { Plus, Upload, Share2, Palette, Check, CheckCircle2, AlertCircle, RefreshCw, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, FolderPlus, BookOpen, LogOut, Lock } from "lucide-react";

interface NavbarProps {
  activeTab: "editor" | "ideas" | "logs" | "preview" | "ai";
  setActiveTab: (tab: "editor" | "ideas" | "logs" | "preview" | "ai") => void;
  project: Project;
  projects?: Project[];
  onSelectProject?: (id: string) => void;
  onCreateProject?: (proj: { title: string; subtitle: string; genre: string; synopsis: string }) => void;
  authors: Author[];
  currentAuthor: Author;
  setCurrentAuthor: (author: Author) => void;
  currentTheme: WriterTheme;
  setThemeId: (themeId: string) => void;
  onOpenImport: () => void;
  onOpenInvite: () => void;
  onOpenNewChapter: () => void;
  onLogout?: () => void;
  saveStatus?: "idle" | "typing" | "saving" | "saved" | "error";
  lastSavedTime?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  project,
  projects = [],
  onSelectProject,
  onCreateProject,
  authors,
  currentAuthor,
  setCurrentAuthor,
  currentTheme,
  setThemeId,
  onOpenImport,
  onOpenInvite,
  onOpenNewChapter,
  onLogout,
  saveStatus = "saved",
  lastSavedTime,
}) => {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  
  // Auto Folding Mobile/Tablet Top Menu State
  const [isMobileNavFolded, setIsMobileNavFolded] = useState(false);
  const lastScrollY = React.useRef(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 60 && currentScrollY > lastScrollY.current + 10) {
        // Scrolling down -> auto fold on mobile/tablet to give maximum writing room
        setIsMobileNavFolded(true);
      } else if (currentScrollY < lastScrollY.current - 15 || currentScrollY < 20) {
        // Scrolling up -> auto expand top bar
        setIsMobileNavFolded(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // New Project Form State
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newGenre, setNewGenre] = useState("Fiksi / Novel");
  const [newSynopsis, setNewSynopsis] = useState("");

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (onCreateProject) {
      onCreateProject({
        title: newTitle.trim(),
        subtitle: newSubtitle.trim() || "Naskah Baru Studio Buku",
        genre: newGenre.trim(),
        synopsis: newSynopsis.trim() || "Sinopsis proyek naskah...",
      });
    }
    setNewTitle("");
    setNewSubtitle("");
    setNewSynopsis("");
    setIsNewProjectModalOpen(false);
    setIsProjectDropdownOpen(false);
  };

  const tabs: { id: "editor" | "ideas" | "logs" | "preview" | "ai"; label: string }[] = [
    { id: "editor", label: "Bab & Editor" },
    { id: "ideas", label: "Papan Gagasan" },
    { id: "logs", label: "Log Revisi" },
    { id: "preview", label: "Pratinjau Buku" },
    { id: "ai", label: "Asisten AI" },
  ];

  return (
    <header className={`${currentTheme.bgHeader} text-slate-100 border-b border-white/15 sticky top-0 z-30 shadow-2xl transition-colors duration-300`}>
      <div className="w-full px-2 sm:px-4 lg:px-4 xl:px-6 2xl:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Studio Buku Clean Brand Header & Interactive Project Switcher */}
          <div className="flex items-center space-x-3 lg:space-x-5">
            <StudioBukuLogo tagline="Nulis Bareng" />

            <div className="hidden xl:block h-7 w-px bg-white/20 mx-1" />

            {/* Interactive Project Switcher & Creator Dropdown */}
            <div className="relative hidden xl:block">
              <button
                onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                className="flex items-center space-x-2 text-left bg-slate-900/80 hover:bg-slate-900 px-3.5 py-1.5 rounded-xl border border-white/20 transition shadow-inner max-w-xs group"
                title="Klik untuk memilih proyek lain atau membuat proyek buku baru"
              >
                <div className="truncate">
                  <h1 className="text-xs font-black text-amber-300 truncate flex items-center space-x-1">
                    <span>{project.title}</span>
                  </h1>
                  <p className="text-[10px] font-medium text-slate-200/80 truncate">
                    {project.genre} • {project.subtitle}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-amber-400 group-hover:translate-y-0.5 transition-transform flex-shrink-0" />
              </button>

              {/* Projects List Dropdown */}
              {isProjectDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProjectDropdownOpen(false)} />
                  <div className="absolute left-0 mt-2 w-80 bg-slate-950 border-2 border-amber-500/50 rounded-2xl shadow-2xl p-3 z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 text-white">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                      <span className="text-xs font-black text-amber-300 flex items-center space-x-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Daftar Proyek Naskah Anda</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">{projects.length} Proyek</span>
                    </div>

                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                      {projects.map((p) => {
                        const isSelected = p.id === project.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              if (onSelectProject) onSelectProject(p.id);
                              setIsProjectDropdownOpen(false);
                            }}
                            className={`w-full text-left p-2.5 rounded-xl text-xs transition flex items-center justify-between border-2 ${
                              isSelected
                                ? "bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md"
                                : "bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-100 font-bold"
                            }`}
                          >
                            <div className="truncate pr-2">
                              <div className="font-black truncate">{p.title}</div>
                              <div className={`text-[10px] truncate font-medium ${isSelected ? "text-slate-900" : "text-slate-400"}`}>
                                {p.genre} • {p.subtitle}
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-slate-950 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-slate-800 mt-2">
                      <button
                        onClick={() => {
                          setIsNewProjectModalOpen(true);
                          setIsProjectDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-center space-x-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black py-2 rounded-xl transition shadow-md"
                      >
                        <FolderPlus className="w-4 h-4 text-slate-950" />
                        <span>+ Buat Proyek Buku Baru</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* LIVE NAVBAR SAVE STATUS INDICATOR */}
            <div className="hidden sm:flex items-center ml-2">
              {saveStatus === "typing" && (
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm animate-pulse" title="Typing... Auto-save pending">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>Saving...</span>
                </div>
              )}

              {saveStatus === "saving" && (
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm" title="Saving changes to server...">
                  <RefreshCw className="w-3 h-3 text-amber-300 animate-spin" />
                  <span>Saving...</span>
                </div>
              )}

              {(saveStatus === "saved" || saveStatus === "idle") && (
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm" title={lastSavedTime ? `All changes saved at ${lastSavedTime}` : "All changes saved"}>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saved</span>
                </div>
              )}

              {saveStatus === "error" && (
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm" title="An error occurred during auto-save">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  <span>Saving Error</span>
                </div>
              )}
            </div>
          </div>

          {/* High-Contrast Island Navigation Container */}
          <nav className="hidden lg:flex items-center">
            <div className={`${currentTheme.bgIslandContainer} p-1.5 rounded-full border-2 border-white/20 shadow-2xl backdrop-blur-md flex items-center space-x-1.5 xl:space-x-2 transition-colors duration-300`}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-4 xl:px-5 py-2 rounded-full text-xs font-black tracking-wide transition-all duration-200 transform active:scale-95 ${
                      isActive
                        ? "bg-amber-400 text-slate-950 shadow-xl shadow-amber-950/50 ring-2 ring-white scale-105"
                        : "text-white hover:bg-white/15 hover:text-white"
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* High-Contrast Action Buttons & Profile Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            
            {/* Theme Selector Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setIsPaletteOpen(!isPaletteOpen)}
                className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 text-xs font-black px-3.5 py-2 rounded-full border-2 border-amber-500/60 shadow-md transition-all duration-200"
                title="Pilih Palet Warna Penulis"
              >
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">{currentTheme.badge}</span>
              </button>

              {isPaletteOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsPaletteOpen(false)}
                  />
                  <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 mt-2 sm:w-72 bg-slate-950 border-2 border-amber-500/50 rounded-2xl shadow-2xl p-3 z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                      <span className="text-xs font-black text-amber-300 flex items-center space-x-1">
                        <Palette className="w-3.5 h-3.5" />
                        <span>Palet Warna Studio</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">Eye-Friendly</span>
                    </div>

                    <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                      {Object.values(WRITER_THEMES).map((thm) => {
                        const isSelected = currentTheme.id === thm.id;
                        return (
                          <button
                            key={thm.id}
                            onClick={() => {
                              setThemeId(thm.id);
                              setIsPaletteOpen(false);
                            }}
                            className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between border-2 ${
                              isSelected
                                ? "bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md"
                                : "bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-100 font-bold"
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-extrabold">{thm.badge}</span>
                                {thm.isDark && (
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${isSelected ? "bg-slate-950 text-white" : "bg-slate-800 text-slate-300"}`}>Gelap</span>
                                )}
                              </div>
                              <p className={`text-[10px] leading-tight font-medium ${isSelected ? "text-slate-900" : "text-slate-400"}`}>
                                {thm.tagline}
                              </p>
                            </div>

                            {isSelected ? (
                              <Check className="w-4 h-4 text-slate-950 flex-shrink-0" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-600 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Chapter Create Button */}
            <button
              onClick={onOpenNewChapter}
              className="hidden sm:inline-flex items-center space-x-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-4 py-2 rounded-full transition-all shadow-lg shadow-amber-950/40 transform hover:scale-105 ring-2 ring-amber-300/50"
              title="Tambah Bab Baru"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Bab Baru</span>
            </button>

            {/* Import Button */}
            <button
              onClick={onOpenImport}
              className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-full border-2 border-slate-700 transition shadow-md"
              title="Impor Teks / Google Docs"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Impor</span>
            </button>

            {/* Invite Button */}
            <button
              onClick={onOpenInvite}
              className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-full border-2 border-slate-700 transition shadow-md"
              title="Undang Penulis Pendamping"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Undang</span>
            </button>

            {/* Clickable Profile Switcher & Logout Menu */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 bg-slate-950 hover:bg-slate-900 border-2 border-amber-500/60 rounded-full py-1.5 px-3.5 text-xs text-white transition shadow-lg cursor-pointer"
                title="Klik untuk membuka menu profil & logout"
              >
                {currentAuthor.avatar && (currentAuthor.avatar.startsWith("http://") || currentAuthor.avatar.startsWith("https://")) ? (
                  <img src={currentAuthor.avatar} alt={currentAuthor.name} className="w-5 h-5 rounded-full object-cover border border-amber-400/60 inline-block shrink-0" />
                ) : (
                  <span className="text-sm">{currentAuthor.avatar || "✍️"}</span>
                )}
                <span className="font-extrabold hidden sm:inline">{currentAuthor.name}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <ChevronDown className="w-3 h-3 text-amber-400" />
              </button>

              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 mt-2 sm:w-64 bg-slate-950 border-2 border-amber-500/50 rounded-2xl shadow-2xl py-2 z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-3.5 py-1.5 text-[11px] font-black text-amber-300 border-b border-slate-800 flex items-center justify-between">
                      <span>Profil Penulis Studio:</span>
                      <span className="text-[10px] text-slate-400 font-normal">Pilih / Keluar</span>
                    </div>
                    {authors.map((auth) => (
                      <button
                        key={auth.id}
                        onClick={() => {
                          setCurrentAuthor(auth);
                          setIsProfileOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center space-x-2.5 hover:bg-slate-800 transition ${
                          currentAuthor.id === auth.id ? "bg-amber-400 text-slate-950 font-black" : "text-slate-100 font-bold"
                        }`}
                      >
                        {auth.avatar && (auth.avatar.startsWith("http://") || auth.avatar.startsWith("https://")) ? (
                          <img src={auth.avatar} alt={auth.name} className="w-6 h-6 rounded-full object-cover border border-amber-400/60 inline-block shrink-0" />
                        ) : (
                          <span className="text-base">{auth.avatar || "✍️"}</span>
                        )}
                        <div>
                          <div className="font-extrabold">{auth.name}</div>
                          <div className={`text-[10px] ${currentAuthor.id === auth.id ? "text-slate-900 font-semibold" : "text-slate-400"}`}>{auth.role}</div>
                        </div>
                      </button>
                    ))}

                    {onLogout && (
                      <div className="pt-1 mt-1 border-t border-slate-800 px-2">
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            onLogout();
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/20 transition cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5 text-red-400" />
                          <span>Kunci & Keluar Studio</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

          </div>
        </div>

        {/* Mobile / Tablet Auto-Folding Navigation Bar */}
        {isMobileNavFolded ? (
          <div
            onClick={() => setIsMobileNavFolded(false)}
            className="lg:hidden py-1.5 px-3 border-t border-white/15 flex items-center justify-between cursor-pointer bg-slate-950/80 hover:bg-slate-900 transition text-amber-300 font-black text-[11px]"
            title="Ketuk / Sentuh untuk Buka Bilah Menu Header"
          >
            <div className="flex items-center space-x-2 truncate">
              <StudioBukuLogo size="sm" />
              <span className="truncate">{project.title}</span>
            </div>
            <div className="flex items-center space-x-1 text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30 shrink-0 font-extrabold">
              <span>Buka Menu</span>
              <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
            </div>
          </div>
        ) : (
          <div className="lg:hidden py-2 border-t border-white/15 flex flex-col items-center space-y-2">
            {/* Mobile Auto-Save Indicator & Manual Fold Button */}
            <div className="flex items-center justify-between w-full px-2">
              <div className="flex items-center">
                {saveStatus === "typing" && (
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    <span>Saving...</span>
                  </div>
                )}
                {saveStatus === "saving" && (
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <RefreshCw className="w-3 h-3 text-amber-300 animate-spin" />
                    <span>Saving...</span>
                  </div>
                )}
                {(saveStatus === "saved" || saveStatus === "idle") && (
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Saved</span>
                  </div>
                )}
                {saveStatus === "error" && (
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-500/20 text-red-300 border border-red-500/40">
                    <AlertCircle className="w-3 h-3 text-red-400" />
                    <span>Saving Error</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsMobileNavFolded(true)}
                className="p-1 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 hover:text-white transition flex items-center space-x-1 text-[10px] font-bold"
                title="Lipat Header Menu"
              >
                <span>Lipat</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Horizontally Scrollable Menu Tabs with Left/Right Arrow Clues */}
            <div className="flex items-center space-x-1 w-full max-w-full px-1">
              <ChevronLeft className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              
              <div className={`${currentTheme.bgIslandContainer} px-2 py-1.5 rounded-full border-2 border-white/20 shadow-xl flex items-center space-x-1.5 overflow-x-auto flex-1 max-w-full`}>
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all duration-200 ${
                        isActive
                          ? "bg-amber-400 text-slate-950 shadow-md scale-105"
                          : "text-white hover:text-amber-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <ChevronRight className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            </div>
          </div>
        )}

      </div>

      {/* Modal Buat Proyek Buku Baru */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border-2 border-amber-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FolderPlus className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold">Buat Proyek Naskah Baru</h3>
              </div>
              <button onClick={() => setIsNewProjectModalOpen(false)} className="text-slate-400 hover:text-white font-black text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-amber-300 mb-1">
                  Judul Proyek Buku:
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Misal: Jejak Langkah Di Langit Barat"
                  className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-amber-300 mb-1">
                  Sub-judul / Tagline:
                </label>
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="Misal: Petualangan Fiksi Sejarah & Penyelidikan"
                  className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-amber-300 mb-1">
                  Genre Buku:
                </label>
                <select
                  value={newGenre}
                  onChange={(e) => setNewGenre(e.target.value)}
                  className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                >
                  <option value="Fiksi / Novel">Fiksi / Novel</option>
                  <option value="Fiksi Remaja / Romance">Fiksi Remaja / Romance</option>
                  <option value="Misteri & Detektif">Misteri & Detektif</option>
                  <option value="Non-Fiksi / Pengembangan Diri">Non-Fiksi / Pengembangan Diri</option>
                  <option value="Biografi / Antologi">Biografi / Antologi</option>
                  <option value="Akademik & Riset">Akademik & Riset</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-amber-300 mb-1">
                  Sinopsis / Ringkasan Cerita:
                </label>
                <textarea
                  value={newSynopsis}
                  onChange={(e) => setNewSynopsis(e.target.value)}
                  placeholder="Tuliskan gambaran singkat cerita atau ide utama naskah Anda..."
                  rows={3}
                  className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400 resize-none font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-700 text-xs font-bold rounded-full transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-full transition shadow-lg"
                >
                  Buat Proyek
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
