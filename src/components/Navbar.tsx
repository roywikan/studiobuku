import React, { useState } from "react";
import { Author, Project, Chapter } from "../types";
import { WriterTheme, WRITER_THEMES } from "../theme";
import { StudioBukuLogo } from "./StudioBukuLogo";
import { ProjectSettingsModal } from "./ProjectSettingsModal";
import { PublicPreviewModal } from "./PublicPreviewModal";
import { exportToDocx, exportToPdf, exportToTxt } from "../utils/exportHelpers";
import {
  Plus,
  Upload,
  Share2,
  Palette,
  Check,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  BookOpen,
  Lock,
  Globe,
  Settings,
  LayoutGrid,
  Database,
  Shield,
  ShieldCheck,
  Edit3,
  Lightbulb,
  History,
  Eye,
  Sparkles,
  SlidersHorizontal,
  FileText,
  FileDown,
  Download,
  ExternalLink
} from "lucide-react";

interface NavbarProps {
  activeTab: "editor" | "ideas" | "logs" | "preview" | "ai" | "gallery";
  setActiveTab: (tab: "editor" | "ideas" | "logs" | "preview" | "ai" | "gallery") => void;
  project: Project;
  projects?: Project[];
  chapters?: Chapter[];
  selectedChapterId?: string;
  onSelectProject?: (id: string) => void;
  onCreateProject?: (proj: { title: string; subtitle: string; genre: string; synopsis: string; isPrivate?: boolean }) => void;
  onUpdateProject?: (updated: Partial<Project>) => Promise<void> | void;
  onRunDatabaseBootstrap?: () => Promise<void>;
  onOpenSeedModal?: () => void;
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
  userSession?: any;
  onOpenUserManagement?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  project,
  projects = [],
  chapters = [],
  selectedChapterId,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onRunDatabaseBootstrap,
  onOpenSeedModal,
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
  userSession,
  onOpenUserManagement
}) => {
  // Main Menu Dropdown States
  const [isMenulisOpen, setIsMenulisOpen] = useState(false);
  const [isSettingOpen, setIsSettingOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  const [isPublicPreviewModalOpen, setIsPublicPreviewModalOpen] = useState(false);

  // New Project Form State
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newGenre, setNewGenre] = useState("Fiksi / Novel");
  const [newSynopsis, setNewSynopsis] = useState("");
  const [newIsPrivate, setNewIsPrivate] = useState(false);

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (onCreateProject) {
      onCreateProject({
        title: newTitle.trim(),
        subtitle: newSubtitle.trim() || "Naskah Baru Studio Buku",
        genre: newGenre.trim(),
        synopsis: newSynopsis.trim() || "Sinopsis proyek naskah...",
        isPrivate: newIsPrivate,
      });
    }
    setNewTitle("");
    setNewSubtitle("");
    setNewSynopsis("");
    setNewIsPrivate(false);
    setIsNewProjectModalOpen(false);
    setIsProjectDropdownOpen(false);
  };

  const isSuperAdmin =
    userSession?.role === "superadmin" ||
    (userSession?.email && userSession.email.toLowerCase() === "roy.wikan@gmail.com");

  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeChapters = Array.isArray(chapters) ? chapters : [];
  const safeAuthors = Array.isArray(authors) ? authors : [];

  // Group projects for workspace isolation
  const myProjects = safeProjects.filter((p) => {
    if (!p) return false;
    if (!userSession) return true;
    return (
      (p.ownerId && (p.ownerId === userSession.id || p.ownerId === userSession.email)) ||
      (p.ownerName && (p.ownerName === userSession.name || p.ownerName === userSession.email))
    );
  });

  const collabProjects = safeProjects.filter((p) => {
    if (!p) return false;
    if (!userSession) return false;
    const isOwner =
      (p.ownerId && (p.ownerId === userSession.id || p.ownerId === userSession.email)) ||
      (p.ownerName && (p.ownerName === userSession.name || p.ownerName === userSession.email));
    if (isOwner) return false;
    if (Array.isArray(p.coAuthors)) {
      return p.coAuthors.some(
        (ca) => userSession.email && ca.toLowerCase().includes(userSession.email.split("@")[0].toLowerCase())
      );
    }
    return false;
  });

  const otherPlatformProjects = isSuperAdmin
    ? safeProjects.filter((p) => {
        if (!p) return false;
        const isMine = myProjects.some((m) => m && m.id === p.id);
        const isCollab = collabProjects.some((c) => c && c.id === p.id);
        return !isMine && !isCollab;
      })
    : [];

  // Active label for current writing sub-page
  const getActiveTabLabel = () => {
    switch (activeTab) {
      case "editor":
        return "Edit";
      case "ideas":
        return "Gagasan";
      case "logs":
        return "Riwayat";
      case "preview":
        return "Pratinjau";
      case "ai":
        return "Asisten AI";
      case "gallery":
        return "Galeri";
      default:
        return "Edit";
    }
  };

  // Close all menus helper
  const closeAllMenus = () => {
    setIsMenulisOpen(false);
    setIsSettingOpen(false);
    setIsProfileOpen(false);
    setIsProjectDropdownOpen(false);
  };

  return (
    <header className={`${currentTheme.bgHeader} text-slate-100 border-b border-white/15 sticky top-0 z-30 shadow-2xl transition-colors duration-300`}>
      
      {/* ========================================================================= */}
      {/* TIER 1 (BARIS ATAS): LOGO (Desktop/Tablet) & 3 MENU UTAMA (Menulis, Setting, User Profile) */}
      {/* ========================================================================= */}
      <div className="w-full px-2.5 sm:px-4 lg:px-6 border-b border-white/10">
        <div className="flex items-center justify-between h-12 sm:h-15 gap-2">
          
          {/* LOGO: Disembunyikan total di layar smartphone vertical (< sm) agar tidak makan ruang */}
          <div className="hidden sm:flex items-center min-w-0 shrink-0">
            <StudioBukuLogo tagline="Nulis Bareng" size="md" alwaysShowText={false} />
          </div>

          {/* 3 MENU UTAMA (Menulis, Setting, User Profile):
              Di HP/Smartphone (< sm): 3 tombol berbagi rata 100% lebar layar secara proporsional.
              Di Desktop/Tablet (sm+): 3 tombol rapi di sisi kanan. */}
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end space-x-1.5 sm:space-x-2.5">
            
            {/* ## 1. MENULIS (DROPDOWN MENU) ## */}
            <div className="relative flex-1 sm:flex-initial">
              <button
                onClick={() => {
                  const targetState = !isMenulisOpen;
                  closeAllMenus();
                  setIsMenulisOpen(targetState);
                }}
                className={`w-full sm:w-auto flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer border ${
                  isMenulisOpen
                    ? "bg-amber-400 text-slate-950 border-amber-300 scale-105"
                    : "bg-slate-900/90 hover:bg-slate-850 text-white border-white/20 hover:border-amber-400/60"
                }`}
                title="Menu Menulis: Edit, Bab Baru, Gagasan, Riwayat, Pratinjau, Asisten AI, Galeri, Impor, Undang, Ekspor"
              >
                <Edit3 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isMenulisOpen ? "text-slate-950" : "text-amber-400"}`} />
                <span className="tracking-wide text-xs">Menulis</span>
                <span className={`hidden md:inline text-[9px] font-black px-1.5 py-0.2 rounded transition ${
                  isMenulisOpen ? "bg-slate-950 text-amber-300" : "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                }`}>
                  {getActiveTabLabel()}
                </span>
                <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-200 shrink-0 ${
                  isMenulisOpen ? "rotate-180 text-slate-950" : "text-amber-400"
                }`} />
              </button>

              {/* Menulis Sub-menu Dropdown */}
              {isMenulisOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMenulisOpen(false)} />
                  <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-13 sm:top-full mt-1 sm:mt-2 w-auto sm:w-80 bg-slate-950 border-2 border-amber-500/50 rounded-2xl shadow-2xl p-2.5 z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 text-white max-h-[82vh] overflow-y-auto">
                    
                    {/* Header Bagian 1: Editor & Halaman */}
                    <div className="px-3 py-1.5 border-b border-slate-800 flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black text-amber-300 flex items-center space-x-1.5">
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Menu Menulis & Naskah</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">Studio Buku</span>
                    </div>

                    <div className="space-y-1">
                      {/* 1. Edit */}
                      <button
                        onClick={() => {
                          setActiveTab("editor");
                          setIsMenulisOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between cursor-pointer ${
                          activeTab === "editor"
                            ? "bg-amber-400 text-slate-950 font-black shadow-sm"
                            : "hover:bg-slate-900 text-slate-100 font-bold"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Edit3 className={`w-4 h-4 shrink-0 ${activeTab === "editor" ? "text-slate-950" : "text-amber-400"}`} />
                          <div>
                            <div className="font-extrabold text-xs">Edit</div>
                            <div className={`text-[10px] ${activeTab === "editor" ? "text-slate-900 font-semibold" : "text-slate-400"}`}>
                              Editor bab & penyuntingan teks naskah
                            </div>
                          </div>
                        </div>
                        {activeTab === "editor" && <Check className="w-4 h-4 text-slate-950 shrink-0" />}
                      </button>

                      {/* 2. Bab Baru (Action) */}
                      <button
                        onClick={() => {
                          setIsMenulisOpen(false);
                          onOpenNewChapter();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-300 font-black cursor-pointer group"
                      >
                        <div className="flex items-center space-x-2.5">
                          <Plus className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                          <div>
                            <div className="font-black text-xs text-amber-300">+ Bab Baru</div>
                            <div className="text-[10px] text-amber-200/70 font-medium">
                              Tambah bab atau bagian baru ke naskah ini
                            </div>
                          </div>
                        </div>
                        <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-black shrink-0">
                          Aksi
                        </span>
                      </button>

                      {/* 3. Gagasan */}
                      <button
                        onClick={() => {
                          setActiveTab("ideas");
                          setIsMenulisOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between cursor-pointer ${
                          activeTab === "ideas"
                            ? "bg-amber-400 text-slate-950 font-black shadow-sm"
                            : "hover:bg-slate-900 text-slate-100 font-bold"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Lightbulb className={`w-4 h-4 shrink-0 ${activeTab === "ideas" ? "text-slate-950" : "text-amber-400"}`} />
                          <div>
                            <div className="font-extrabold text-xs">Gagasan</div>
                            <div className={`text-[10px] ${activeTab === "ideas" ? "text-slate-900 font-semibold" : "text-slate-400"}`}>
                              Papan coretan ide, plot, karakter, & riset
                            </div>
                          </div>
                        </div>
                        {activeTab === "ideas" && <Check className="w-4 h-4 text-slate-950 shrink-0" />}
                      </button>

                      {/* 4. Riwayat */}
                      <button
                        onClick={() => {
                          setActiveTab("logs");
                          setIsMenulisOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between cursor-pointer ${
                          activeTab === "logs"
                            ? "bg-amber-400 text-slate-950 font-black shadow-sm"
                            : "hover:bg-slate-900 text-slate-100 font-bold"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <History className={`w-4 h-4 shrink-0 ${activeTab === "logs" ? "text-slate-950" : "text-amber-400"}`} />
                          <div>
                            <div className="font-extrabold text-xs">Riwayat</div>
                            <div className={`text-[10px] ${activeTab === "logs" ? "text-slate-900 font-semibold" : "text-slate-400"}`}>
                              Log revisi & jejak perubahan naskah
                            </div>
                          </div>
                        </div>
                        {activeTab === "logs" && <Check className="w-4 h-4 text-slate-950 shrink-0" />}
                      </button>

                      {/* 5. Pratinjau */}
                      <button
                        onClick={() => {
                          setActiveTab("preview");
                          setIsMenulisOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between cursor-pointer ${
                          activeTab === "preview"
                            ? "bg-amber-400 text-slate-950 font-black shadow-sm"
                            : "hover:bg-slate-900 text-slate-100 font-bold"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Eye className={`w-4 h-4 shrink-0 ${activeTab === "preview" ? "text-slate-950" : "text-amber-400"}`} />
                          <div>
                            <div className="font-extrabold text-xs">Pratinjau</div>
                            <div className={`text-[10px] ${activeTab === "preview" ? "text-slate-900 font-semibold" : "text-slate-400"}`}>
                              Visualisasi buku lengkap & tata letak baca
                            </div>
                          </div>
                        </div>
                        {activeTab === "preview" && <Check className="w-4 h-4 text-slate-950 shrink-0" />}
                      </button>

                      {/* 6. Asisten AI */}
                      <button
                        onClick={() => {
                          setActiveTab("ai");
                          setIsMenulisOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between cursor-pointer ${
                          activeTab === "ai"
                            ? "bg-amber-400 text-slate-950 font-black shadow-sm"
                            : "hover:bg-slate-900 text-slate-100 font-bold"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Sparkles className={`w-4 h-4 shrink-0 ${activeTab === "ai" ? "text-slate-950" : "text-amber-400"}`} />
                          <div>
                            <div className="font-extrabold text-xs">Asisten AI</div>
                            <div className={`text-[10px] ${activeTab === "ai" ? "text-slate-900 font-semibold" : "text-slate-400"}`}>
                              Diskusi plot, evaluasi naskah, & ide dialog
                            </div>
                          </div>
                        </div>
                        {activeTab === "ai" && <Check className="w-4 h-4 text-slate-950 shrink-0" />}
                      </button>

                      {/* 7. Galeri */}
                      <button
                        onClick={() => {
                          setActiveTab("gallery");
                          setIsMenulisOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between cursor-pointer ${
                          activeTab === "gallery"
                            ? "bg-amber-400 text-slate-950 font-black shadow-sm"
                            : "hover:bg-slate-900 text-slate-100 font-bold"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <LayoutGrid className={`w-4 h-4 shrink-0 ${activeTab === "gallery" ? "text-slate-950" : "text-amber-400"}`} />
                          <div>
                            <div className="font-extrabold text-xs">Galeri</div>
                            <div className={`text-[10px] ${activeTab === "gallery" ? "text-slate-900 font-semibold" : "text-slate-400"}`}>
                              Katalog etalase publik naskah Studio Buku
                            </div>
                          </div>
                        </div>
                        {activeTab === "gallery" && <Check className="w-4 h-4 text-slate-950 shrink-0" />}
                      </button>

                      {/* PEMBATAS: KOLABORASI */}
                      <div className="pt-2 pb-1 px-3 border-t border-slate-800 text-[10px] font-black uppercase text-amber-400 tracking-wider">
                        Kolaborasi & Masukan
                      </div>

                      {/* 8. Impor Teks */}
                      <button
                        onClick={() => {
                          setIsMenulisOpen(false);
                          onOpenImport();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between hover:bg-slate-900 text-slate-200 font-bold cursor-pointer group"
                      >
                        <div className="flex items-center space-x-2.5">
                          <Upload className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                          <div>
                            <div className="font-extrabold text-xs text-slate-100">Impor Teks</div>
                            <div className="text-[10px] text-slate-400">
                              Impor dari Google Docs atau file teks .txt/.md
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* 9. Undang Penulis */}
                      <button
                        onClick={() => {
                          setIsMenulisOpen(false);
                          onOpenInvite();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between hover:bg-slate-900 text-slate-200 font-bold cursor-pointer group"
                      >
                        <div className="flex items-center space-x-2.5">
                          <Share2 className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                          <div>
                            <div className="font-extrabold text-xs text-slate-100">Undang Penulis</div>
                            <div className="text-[10px] text-slate-400">
                              Undang rekan co-author untuk nulis bareng
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* PEMBATAS: PREVIEW & EKSPOR NASKAH */}
                      <div className="pt-2 pb-1 px-3 border-t border-slate-800 text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                        Publikasi & Ekspor Naskah
                      </div>

                      {/* 10. Preview HTML Publik */}
                      <button
                        onClick={() => {
                          setIsMenulisOpen(false);
                          setIsPublicPreviewModalOpen(true);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold cursor-pointer group"
                      >
                        <div className="flex items-center space-x-2.5">
                          <Globe className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                          <div>
                            <div className="font-black text-xs text-emerald-300">Preview HTML Publik</div>
                            <div className="text-[10px] text-emerald-200/70 font-medium">
                              Tautan baca online resmi & SEO Googlebot
                            </div>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </button>

                      {/* 11. Ekspor ke DOCX */}
                      <button
                        onClick={() => {
                          setIsMenulisOpen(false);
                          exportToDocx(project, safeChapters, currentAuthor?.name);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between hover:bg-blue-950/40 border border-transparent hover:border-blue-500/40 text-slate-200 font-bold cursor-pointer group"
                      >
                        <div className="flex items-center space-x-2.5">
                          <FileText className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform shrink-0" />
                          <div>
                            <div className="font-extrabold text-xs text-slate-100">Ekspor ke DOCX</div>
                            <div className="text-[10px] text-slate-400">
                              Format Microsoft Word (.docx) untuk editor & penerbit
                            </div>
                          </div>
                        </div>
                        <Download className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      </button>

                      {/* 12. Ekspor ke PDF */}
                      <button
                        onClick={() => {
                          setIsMenulisOpen(false);
                          exportToPdf(project, safeChapters, currentAuthor?.name);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between hover:bg-rose-950/40 border border-transparent hover:border-rose-500/40 text-slate-200 font-bold cursor-pointer group"
                      >
                        <div className="flex items-center space-x-2.5">
                          <FileDown className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform shrink-0" />
                          <div>
                            <div className="font-extrabold text-xs text-slate-100">Ekspor ke PDF</div>
                            <div className="text-[10px] text-slate-400">
                              Format dokumen PDF siap cetak dengan nomor halaman
                            </div>
                          </div>
                        </div>
                        <Download className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      </button>

                      {/* 13. Ekspor ke TXT */}
                      <button
                        onClick={() => {
                          setIsMenulisOpen(false);
                          exportToTxt(project, safeChapters, currentAuthor?.name);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between hover:bg-slate-900 border border-transparent hover:border-slate-700 text-slate-200 font-bold cursor-pointer group"
                      >
                        <div className="flex items-center space-x-2.5">
                          <Download className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                          <div>
                            <div className="font-extrabold text-xs text-slate-100">Ekspor ke TXT</div>
                            <div className="text-[10px] text-slate-400">
                              Plain text naskah utuh tanpa formatting
                            </div>
                          </div>
                        </div>
                        <Download className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      </button>

                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ## 2. SETTING (DROPDOWN MENU) ## */}
            <div className="relative flex-1 sm:flex-initial">
              <button
                onClick={() => {
                  const targetState = !isSettingOpen;
                  closeAllMenus();
                  setIsSettingOpen(targetState);
                }}
                className={`w-full sm:w-auto flex items-center justify-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer border ${
                  isSettingOpen
                    ? "bg-amber-400 text-slate-950 border-amber-300 scale-105"
                    : "bg-slate-900/90 hover:bg-slate-850 text-white border-white/20 hover:border-amber-400/60"
                }`}
                title="Pengaturan Studio: Warna UI & Super Admin"
              >
                <SlidersHorizontal className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isSettingOpen ? "text-slate-950" : "text-amber-400"}`} />
                <span className="tracking-wide text-xs">Setting</span>
                <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-200 shrink-0 ${
                  isSettingOpen ? "rotate-180 text-slate-950" : "text-amber-400"
                }`} />
              </button>

              {/* Setting Sub-menu Dropdown */}
              {isSettingOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsSettingOpen(false)} />
                  <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-13 sm:top-full mt-1 sm:mt-2 w-auto sm:w-80 bg-slate-950 border-2 border-amber-500/50 rounded-2xl shadow-2xl p-3 z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 text-white max-h-[82vh] overflow-y-auto">
                    <div className="px-2 pb-2 mb-2 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-black text-amber-300 flex items-center space-x-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Pengaturan Studio</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">Preferensi</span>
                    </div>

                    <div className="space-y-3">
                      {/* Sub-menu 1: Warna UI */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-2">
                          <span className="text-xs font-black text-amber-300 flex items-center space-x-1.5">
                            <Palette className="w-3.5 h-3.5 text-amber-400" />
                            <span>Warna UI</span>
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            Aktif: <strong className="text-amber-300">{currentTheme.badge}</strong>
                          </span>
                        </div>

                        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                          {Object.values(WRITER_THEMES).map((thm) => {
                            const isSelected = currentTheme.id === thm.id;
                            return (
                              <button
                                key={thm.id}
                                onClick={() => {
                                  setThemeId(thm.id);
                                }}
                                className={`w-full text-left p-2 rounded-xl text-xs transition-all flex items-center justify-between border cursor-pointer ${
                                  isSelected
                                    ? "bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md"
                                    : "bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-100 font-bold"
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="font-extrabold">{thm.badge}</span>
                                    {thm.isDark && (
                                      <span className={`text-[8px] px-1 py-0.2 rounded font-black ${
                                        isSelected ? "bg-slate-950 text-white" : "bg-slate-800 text-slate-300"
                                      }`}>
                                        Gelap
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-[9px] leading-tight font-medium ${isSelected ? "text-slate-900" : "text-slate-400"}`}>
                                    {thm.tagline}
                                  </p>
                                </div>

                                {isSelected ? (
                                  <Check className="w-4 h-4 text-slate-950 shrink-0" />
                                ) : (
                                  <div className="w-3 h-3 rounded-full border border-slate-600 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="border-t border-slate-800" />

                      {/* Sub-menu 2: Super Admin */}
                      <div>
                        <div className="px-2 mb-1.5 flex items-center justify-between">
                          <span className="text-xs font-black text-amber-300 flex items-center space-x-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span>Super Admin</span>
                          </span>
                          {isSuperAdmin ? (
                            <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.2 rounded font-black">
                              Akses Aktif
                            </span>
                          ) : (
                            <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-medium">
                              Khusus Admin
                            </span>
                          )}
                        </div>

                        {onOpenUserManagement ? (
                          <button
                            onClick={() => {
                              setIsSettingOpen(false);
                              onOpenUserManagement();
                            }}
                            className="w-full text-left px-3 py-2.5 rounded-xl text-xs transition flex items-center justify-between bg-slate-900 hover:bg-slate-850 border border-amber-500/40 text-amber-300 font-black cursor-pointer group shadow-sm"
                          >
                            <div className="flex items-center space-x-2.5">
                              <ShieldCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                              <div>
                                <div className="font-black text-xs text-amber-300">Super Admin</div>
                                <div className="text-[10px] text-slate-400 font-medium">
                                  Manajemen Pengguna Cloudflare D1 & Hak Akses
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                          </button>
                        ) : (
                          <div className="text-[11px] text-slate-500 p-2 italic bg-slate-900 rounded-xl">
                            Panel admin pengguna sedang tidak aktif.
                          </div>
                        )}
                      </div>

                      {/* Quick Seed helper inside Setting if available */}
                      {onOpenSeedModal && (
                        <div className="pt-2 border-t border-slate-800">
                          <button
                            onClick={() => {
                              setIsSettingOpen(false);
                              onOpenSeedModal();
                            }}
                            className="w-full flex items-center justify-center space-x-1.5 bg-purple-950/70 hover:bg-purple-900/90 text-amber-300 text-xs font-bold py-2 rounded-xl transition border border-purple-500/40 shadow-sm cursor-pointer"
                          >
                            <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>⚡ Injeksi 60 Naskah ke DB</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ## 3. USER PROFILE (DROPDOWN MENU) ## */}
            <div className="relative flex-1 sm:flex-initial">
              <button
                onClick={() => {
                  const targetState = !isProfileOpen;
                  closeAllMenus();
                  setIsProfileOpen(targetState);
                }}
                className="w-full sm:w-auto flex items-center justify-center space-x-1.5 bg-slate-950 hover:bg-slate-900 border-2 border-amber-500/60 rounded-xl sm:rounded-full py-1.5 sm:py-1.5 px-2 sm:px-3 text-xs text-white transition shadow-lg cursor-pointer"
                title="User Profile & Akun Penulis"
              >
                {currentAuthor.avatar && (currentAuthor.avatar.startsWith("http://") || currentAuthor.avatar.startsWith("https://")) ? (
                  <img
                    src={currentAuthor.avatar}
                    alt={currentAuthor.name}
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover border border-amber-400/60 inline-block shrink-0"
                  />
                ) : (
                  <span className="text-xs sm:text-sm shrink-0">{currentAuthor.avatar || "✍️"}</span>
                )}
                <span className="font-extrabold truncate max-w-[70px] sm:max-w-[110px] text-xs">{currentAuthor.name.split(" ")[0]}</span>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                <ChevronDown className="w-3 h-3 text-amber-400 shrink-0" />
              </button>

              {/* User Profile Sub-menu Dropdown */}
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-13 sm:top-full mt-1 sm:mt-2 w-auto sm:w-64 bg-slate-950 border-2 border-amber-500/50 rounded-2xl shadow-2xl py-2 z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 text-white max-h-[82vh] overflow-y-auto">
                    <div className="px-3.5 py-1.5 text-[11px] font-black text-amber-300 border-b border-slate-800 flex items-center justify-between">
                      <span>User Profile Penulis</span>
                      <span className="text-[10px] text-slate-400 font-normal">Pilih / Keluar</span>
                    </div>

                    <div className="max-h-56 overflow-y-auto">
                      {safeAuthors.map((auth) => (
                        <button
                          key={auth.id}
                          onClick={() => {
                            setCurrentAuthor(auth);
                            setIsProfileOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs flex items-center space-x-2.5 hover:bg-slate-800 transition cursor-pointer ${
                            currentAuthor.id === auth.id ? "bg-amber-400 text-slate-950 font-black" : "text-slate-100 font-bold"
                          }`}
                        >
                          {auth.avatar && (auth.avatar.startsWith("http://") || auth.avatar.startsWith("https://")) ? (
                            <img
                              src={auth.avatar}
                              alt={auth.name}
                              className="w-6 h-6 rounded-full object-cover border border-amber-400/60 inline-block shrink-0"
                            />
                          ) : (
                            <span className="text-base shrink-0">{auth.avatar || "✍️"}</span>
                          )}
                          <div className="truncate">
                            <div className="font-extrabold truncate">{auth.name}</div>
                            <div className={`text-[10px] truncate ${currentAuthor.id === auth.id ? "text-slate-900 font-semibold" : "text-slate-400"}`}>
                              {auth.role}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {userSession && (
                      <div className="px-3.5 py-2 bg-slate-900 border-t border-b border-slate-800 text-xs">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Sesi Pengguna:</div>
                        <div className="font-black text-amber-300 truncate">{userSession.name}</div>
                        <div className="text-[11px] text-slate-300 font-mono truncate">{userSession.email}</div>
                        <div className="flex items-center space-x-1.5 mt-1">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                            Role: {userSession.role || "user"}
                          </span>
                        </div>
                      </div>
                    )}

                    {isSuperAdmin && onOpenUserManagement && (
                      <div className="p-2 border-b border-slate-800">
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            onOpenUserManagement();
                          }}
                          className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/50 rounded-xl transition font-black cursor-pointer shadow-sm"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>👑 Kelola Pengguna D1</span>
                        </button>
                      </div>
                    )}

                    {onLogout && (
                      <div className="pt-1 mt-1 px-2">
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
      </div>

      {/* ========================================================================= */}
      {/* TIER 2 (BARIS BAWAH): SPESIFIK NASKAH (Pilihan Buku, Privasi Naskah, Status Tersimpan) */}
      {/* ========================================================================= */}
      <div className="w-full px-2.5 sm:px-4 lg:px-6 bg-black/30 backdrop-blur-md py-1 sm:py-1.5">
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          
          {/* SISI KIRI: Pilihan Buku & Privasi Naskah */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 min-w-0 flex-1">
            
            {/* Pilihan Buku (Project Switcher Dropdown - Fleksibel Mengambil Ruang Layar) */}
            <div className="relative min-w-0 flex-1 max-w-[220px] sm:max-w-[280px] md:max-w-md">
              <button
                onClick={() => {
                  const targetState = !isProjectDropdownOpen;
                  closeAllMenus();
                  setIsProjectDropdownOpen(targetState);
                }}
                className="w-full flex items-center space-x-1.5 sm:space-x-2 text-left bg-slate-900/90 hover:bg-slate-850 px-2 sm:px-3 py-1 rounded-xl border border-white/20 transition shadow-inner group cursor-pointer min-w-0"
                title="Pilih naskah buku aktif atau buat proyek buku baru"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div className="truncate min-w-0 flex-1">
                  <div className="text-[11px] sm:text-xs font-black text-amber-300 truncate">
                    {project.title}
                  </div>
                  <p className="text-[9px] font-medium text-slate-300/80 truncate hidden md:block">
                    {project.genre || "Buku"} {project.subtitle ? `• ${project.subtitle}` : ""}
                  </p>
                </div>
                <ChevronDown className="w-3 h-3 text-amber-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
              </button>

              {/* Projects List Dropdown */}
              {isProjectDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProjectDropdownOpen(false)} />
                  <div className="fixed sm:absolute left-2 right-2 sm:left-0 sm:right-auto top-23 sm:top-full mt-1 sm:mt-2 w-auto sm:w-80 bg-slate-950 border-2 border-amber-500/50 rounded-2xl shadow-2xl p-3 z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 text-white max-h-[75vh] overflow-y-auto">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                      <span className="text-xs font-black text-amber-300 flex items-center space-x-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Katalog Naskah ({projects.length})</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">Cloudflare D1</span>
                    </div>

                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {/* 1. Proyek Pribadi */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-black uppercase text-amber-400 px-1">
                          📁 Proyek Pribadi ({myProjects.length})
                        </div>
                        {myProjects.length === 0 ? (
                          <div className="text-[11px] text-slate-500 p-2 italic bg-slate-900/50 rounded-xl">
                            Belum ada naskah pribadi.
                          </div>
                        ) : (
                          myProjects.map((p) => {
                            const isSelected = p.id === project.id;
                            return (
                              <button
                                key={p.id}
                                onClick={() => {
                                  if (onSelectProject) onSelectProject(p.id);
                                  setIsProjectDropdownOpen(false);
                                }}
                                className={`w-full text-left p-2 rounded-xl text-xs transition flex items-center justify-between border-2 cursor-pointer ${
                                  isSelected
                                    ? "bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md"
                                    : "bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-100 font-bold"
                                }`}
                              >
                                <div className="truncate pr-2">
                                  <div className="font-black truncate flex items-center space-x-1">
                                    <span>{p.title}</span>
                                    {p.isPrivate ? (
                                      <span className="text-[8px] bg-red-500 text-white px-1 rounded font-black">🔒 Privat</span>
                                    ) : (
                                      <span className="text-[8px] bg-emerald-500 text-slate-950 px-1 rounded font-black">🌐 Publik</span>
                                    )}
                                  </div>
                                  <div className={`text-[10px] truncate font-medium ${isSelected ? "text-slate-900" : "text-slate-400"}`}>
                                    {p.genre} • {p.subtitle}
                                  </div>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-slate-950 shrink-0" />}
                              </button>
                            );
                          })
                        )}
                      </div>

                      {/* 2. Proyek Kolaborasi */}
                      {collabProjects.length > 0 && (
                        <div className="space-y-1 pt-1 border-t border-slate-850">
                          <div className="text-[10px] font-black uppercase text-pink-400 px-1">
                            🤝 Proyek Kolaborasi ({collabProjects.length})
                          </div>
                          {collabProjects.map((p) => {
                            const isSelected = p.id === project.id;
                            return (
                              <button
                                key={p.id}
                                onClick={() => {
                                  if (onSelectProject) onSelectProject(p.id);
                                  setIsProjectDropdownOpen(false);
                                }}
                                className={`w-full text-left p-2 rounded-xl text-xs transition flex items-center justify-between border-2 cursor-pointer ${
                                  isSelected
                                    ? "bg-pink-500 text-white border-pink-400 font-black shadow-md"
                                    : "bg-slate-900 border-purple-900/60 hover:bg-slate-850 text-slate-100 font-bold"
                                }`}
                              >
                                <div className="truncate pr-2">
                                  <div className="font-black truncate flex items-center space-x-1">
                                    <span>{p.title}</span>
                                    <span className="text-[8px] bg-purple-500/40 text-purple-200 border border-purple-400/50 px-1 rounded">Co-Author</span>
                                  </div>
                                  <div className={`text-[10px] truncate font-medium ${isSelected ? "text-pink-100" : "text-slate-400"}`}>
                                    Pemilik: {p.ownerName || "Rekan"}
                                  </div>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* 3. Seluruh Naskah Platform (Khusus Super Admin) */}
                      {isSuperAdmin && otherPlatformProjects.length > 0 && (
                        <div className="space-y-1 pt-1 border-t border-slate-850">
                          <div className="text-[10px] font-black uppercase text-amber-300 px-1 flex items-center space-x-1">
                            <Shield className="w-3 h-3 text-amber-400" />
                            <span>Semua Naskah Platform ({otherPlatformProjects.length})</span>
                          </div>
                          {otherPlatformProjects.map((p) => {
                            const isSelected = p.id === project.id;
                            return (
                              <button
                                key={p.id}
                                onClick={() => {
                                  if (onSelectProject) onSelectProject(p.id);
                                  setIsProjectDropdownOpen(false);
                                }}
                                className={`w-full text-left p-2 rounded-xl text-xs transition flex items-center justify-between border-2 cursor-pointer ${
                                  isSelected
                                    ? "bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md"
                                    : "bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-100 font-bold"
                                }`}
                              >
                                <div className="truncate pr-2">
                                  <div className="font-black truncate flex items-center space-x-1">
                                    <span>{p.title}</span>
                                    {p.isPrivate ? (
                                      <span className="text-[8px] bg-red-500 text-white px-1 rounded font-black">🔒 Privat</span>
                                    ) : (
                                      <span className="text-[8px] bg-emerald-500 text-slate-950 px-1 rounded font-black">🌐 Publik</span>
                                    )}
                                  </div>
                                  <div className={`text-[10px] truncate font-medium ${isSelected ? "text-slate-900" : "text-slate-400"}`}>
                                    {p.ownerName || "Penulis"} • {p.genre}
                                  </div>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-slate-950 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-800 mt-2 space-y-1.5">
                      <button
                        onClick={() => {
                          setIsNewProjectModalOpen(true);
                          setIsProjectDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-center space-x-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black py-2 rounded-xl transition shadow-md cursor-pointer"
                      >
                        <FolderPlus className="w-4 h-4 text-slate-950 shrink-0" />
                        <span>+ Buat Proyek Buku Baru</span>
                      </button>

                      {onOpenSeedModal && (
                        <button
                          onClick={() => {
                            onOpenSeedModal();
                            setIsProjectDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-center space-x-1.5 bg-purple-950/80 hover:bg-purple-900 text-amber-300 text-xs font-bold py-2 rounded-xl transition border border-purple-500/40 shadow-sm cursor-pointer"
                        >
                          <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>⚡ Injeksi 60 Naskah ke DB</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Privasi Naskah (Gear Icon & Status Ringkas) */}
            <button
              onClick={() => {
                closeAllMenus();
                setIsProjectSettingsOpen(true);
              }}
              className="flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-500/40 shadow-sm transition-all duration-200 cursor-pointer group shrink-0"
              title="Privasi Naskah & Pengaturan Proyek"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform duration-300 shrink-0" />
              <span className="hidden sm:inline text-xs font-black">Privasi</span>
              {project.isPrivate ? (
                <span className="text-[9px] bg-red-500/30 text-red-300 border border-red-500/50 px-1 py-0.2 rounded font-black shrink-0">
                  🔒<span className="hidden md:inline ml-0.5">Privat</span>
                </span>
              ) : (
                <span className="text-[9px] bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 px-1 py-0.2 rounded font-black shrink-0">
                  🌐<span className="hidden md:inline ml-0.5">Publik</span>
                </span>
              )}
            </button>
          </div>

          {/* SISI KANAN: Status Tersimpan (Auto-save Indicator)
              HACK HP/SMARTPHONE: Menggunakan centang hijau bulat ringkas tanpa teks kata "Tersimpan" */}
          <div className="flex items-center shrink-0">
            {saveStatus === "typing" && (
              <div
                className="inline-flex items-center justify-center space-x-1 px-2 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
                title="Menyimpan ketikan..."
              >
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span className="hidden sm:inline">Menyimpan...</span>
              </div>
            )}
            {saveStatus === "saving" && (
              <div
                className="inline-flex items-center justify-center space-x-1 px-2 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30"
                title="Sedang menyimpan ke cloud..."
              >
                <RefreshCw className="w-3 h-3 text-amber-300 animate-spin" />
                <span className="hidden sm:inline">Menyimpan...</span>
              </div>
            )}
            {(saveStatus === "saved" || saveStatus === "idle") && (
              <div
                className="inline-flex items-center justify-center space-x-1 px-2 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-pointer shadow-sm"
                title={lastSavedTime ? `Tersimpan otomatis: ${lastSavedTime}` : "Semua perubahan tersimpan aman"}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Tersimpan</span>
              </div>
            )}
            {saveStatus === "error" && (
              <div
                className="inline-flex items-center justify-center space-x-1 px-2 py-1 rounded-full text-[10px] font-black bg-red-500/20 text-red-300 border border-red-500/30 cursor-pointer"
                title="Gagal simpan ke cloud"
              >
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">Gagal</span>
              </div>
            )}
          </div>

        </div>
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
              <button
                onClick={() => setIsNewProjectModalOpen(false)}
                className="text-slate-400 hover:text-white font-black text-lg cursor-pointer"
              >
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

              {/* Status Akses Publik / Privat Toggle */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-black text-amber-300 text-xs flex items-center space-x-1">
                    {newIsPrivate ? <Lock className="w-3.5 h-3.5 text-red-400" /> : <Globe className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>Status Akses Naskah</span>
                  </span>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {newIsPrivate ? "Privat: Hanya Anda & Co-Author yang diundang." : "Publik: Dapat di-preview publik & Googlebot."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setNewIsPrivate(!newIsPrivate)}
                  className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                    newIsPrivate ? "bg-red-500" : "bg-emerald-500"
                  }`}
                  title="Ubah antara Status Akses Publik dan Privat"
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 flex items-center justify-center text-[9px] ${
                      newIsPrivate ? "translate-x-5" : "translate-x-0"
                    }`}
                  >
                    {newIsPrivate ? "🔒" : "🌐"}
                  </div>
                </button>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-700 text-xs font-bold rounded-full transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-full transition shadow-lg cursor-pointer"
                >
                  Buat Proyek
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pengaturan Proyek & Privasi Naskah */}
      {isProjectSettingsOpen && onUpdateProject && (
        <ProjectSettingsModal
          isOpen={isProjectSettingsOpen}
          onClose={() => setIsProjectSettingsOpen(false)}
          project={project}
          onUpdateProject={onUpdateProject}
          onRunDatabaseBootstrap={onRunDatabaseBootstrap}
          currentAuthorName={currentAuthor.name}
        />
      )}

      {/* Modal Preview HTML Publik */}
      {isPublicPreviewModalOpen && (
        <PublicPreviewModal
          isOpen={isPublicPreviewModalOpen}
          onClose={() => setIsPublicPreviewModalOpen(false)}
          project={project}
          chapters={safeChapters}
          currentChapterId={selectedChapterId}
        />
      )}
    </header>
  );
};
