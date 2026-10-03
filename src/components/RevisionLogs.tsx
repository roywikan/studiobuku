import React, { useState, useMemo } from "react";
import { RevisionLog, Chapter } from "../types";
import { WriterTheme } from "../theme";
import {
  History,
  FileText,
  User,
  Clock,
  Plus,
  Search,
  BookOpen,
  CheckCircle2,
  Edit3,
  X,
  Layers,
  Sparkles
} from "lucide-react";

interface RevisionLogsProps {
  logs: RevisionLog[];
  allLogs?: RevisionLog[];
  projectTitle?: string;
  projectId?: string;
  chapters?: Chapter[];
  currentAuthorName?: string;
  onAddLog?: (log: Partial<RevisionLog>) => Promise<void>;
  currentTheme: WriterTheme;
}

export const RevisionLogs: React.FC<RevisionLogsProps> = ({
  logs,
  allLogs = [],
  projectTitle = "Naskah Ini",
  projectId = "",
  chapters = [],
  currentAuthorName = "Penulis Studio",
  onAddLog,
  currentTheme
}) => {
  const [scope, setScope] = useState<"project" | "all">("project");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLogChapterId, setNewLogChapterId] = useState("");
  const [newLogAction, setNewLogAction] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeLogs = scope === "project" ? (Array.isArray(logs) ? logs : []) : (Array.isArray(allLogs) ? allLogs : []);

  // Filter logs by search query
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return activeLogs;
    const q = searchQuery.toLowerCase();
    return activeLogs.filter(
      (log) =>
        (log.chapterTitle && log.chapterTitle.toLowerCase().includes(q)) ||
        (log.action && log.action.toLowerCase().includes(q)) ||
        (log.authorName && log.authorName.toLowerCase().includes(q))
    );
  }, [activeLogs, searchQuery]);

  // Unique contributors
  const contributors = useMemo(() => {
    const set = new Set<string>();
    activeLogs.forEach((l) => {
      if (l.authorName) set.add(l.authorName);
    });
    return Array.from(set);
  }, [activeLogs]);

  const latestLogTime = activeLogs.length > 0 ? activeLogs[0].timestamp : null;

  const handleCreateManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogAction.trim()) return;

    setIsSubmitting(true);
    try {
      const selectedChapter = chapters.find((c) => c.id === newLogChapterId);
      if (onAddLog) {
        await onAddLog({
          projectId,
          chapterId: newLogChapterId || undefined,
          chapterTitle: selectedChapter ? selectedChapter.title : "Catatan Editorial Naskah",
          authorName: currentAuthorName,
          action: newLogAction.trim()
        });
      }
      setNewLogAction("");
      setNewLogChapterId("");
      setIsAddModalOpen(false);
    } catch (err) {
      console.error("Gagal menambah log revisi:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActionIcon = (actionText: string = "") => {
    const lower = actionText.toLowerCase();
    if (lower.includes("inisiasi") || lower.includes("buat") || lower.includes("membuat")) {
      return <Sparkles className="w-4 h-4 text-emerald-400" />;
    }
    if (lower.includes("hapus") || lower.includes("delete")) {
      return <FileText className="w-4 h-4 text-rose-400" />;
    }
    if (lower.includes("review") || lower.includes("editorial") || lower.includes("verifikasi")) {
      return <CheckCircle2 className="w-4 h-4 text-cyan-400" />;
    }
    return <Edit3 className="w-4 h-4 text-amber-400" />;
  };

  return (
    <div className={`flex-1 ${currentTheme.bgMain} ${currentTheme.textMain} p-4 sm:p-6 lg:p-8 overflow-y-auto transition-colors duration-300 min-h-[calc(100vh-5rem)]`}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* HEADER SECTION */}
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 ${currentTheme.border} pb-6`}>
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <History className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Log Revisi & Aktivitas Studio
              </h1>
            </div>
            <p className={`text-xs sm:text-sm ${currentTheme.textMuted} font-medium mt-1`}>
              Audit jejak revisi naskah real-time, aktivitas kolaboratif para penulis, dan pencatatan riwayat bab.
            </p>
          </div>

          {onAddLog && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Revisi Baru</span>
            </button>
          )}
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className={`${currentTheme.bgCard} border ${currentTheme.border} rounded-2xl p-4 shadow-sm flex items-center space-x-3.5`}>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-[11px] font-bold uppercase tracking-wider ${currentTheme.textMuted}`}>
                Total Aktivitas
              </div>
              <div className="text-xl font-black">
                {activeLogs.length} <span className="text-xs font-normal opacity-70">log revisi</span>
              </div>
            </div>
          </div>

          <div className={`${currentTheme.bgCard} border ${currentTheme.border} rounded-2xl p-4 shadow-sm flex items-center space-x-3.5`}>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-[11px] font-bold uppercase tracking-wider ${currentTheme.textMuted}`}>
                Penyunting Terlibat
              </div>
              <div className="text-xl font-black">
                {contributors.length} <span className="text-xs font-normal opacity-70">penulis</span>
              </div>
            </div>
          </div>

          <div className={`${currentTheme.bgCard} border ${currentTheme.border} rounded-2xl p-4 shadow-sm flex items-center space-x-3.5`}>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 font-bold shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className={`text-[11px] font-bold uppercase tracking-wider ${currentTheme.textMuted}`}>
                Pembaruan Terakhir
              </div>
              <div className="text-xs font-black truncate">
                {latestLogTime
                  ? new Date(latestLogTime).toLocaleString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  : "Belum ada"}
              </div>
            </div>
          </div>
        </div>

        {/* CONTROLS: SCOPE TABS & SEARCH */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 p-1 bg-black/10 dark:bg-white/5 rounded-xl border border-white/10 shrink-0">
            <button
              onClick={() => setScope("project")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition ${
                scope === "project"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : `${currentTheme.textMuted} hover:${currentTheme.textMain}`
              }`}
            >
              📖 Naskah Ini ({logs.length})
            </button>
            <button
              onClick={() => setScope("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition ${
                scope === "all"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : `${currentTheme.textMuted} hover:${currentTheme.textMain}`
              }`}
            >
              🌐 Semua Naskah ({allLogs.length})
            </button>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${currentTheme.textMuted}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari aktivitas, nama bab, atau penulis..."
              className={`w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-black/5 dark:bg-white/5 border ${currentTheme.border} focus:outline-none focus:border-amber-500`}
            />
          </div>
        </div>

        {/* TIMELINE LIST */}
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const dateObj = new Date(log.timestamp);
            const timeAgo = dateObj.toLocaleString("id-ID", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });

            return (
              <div
                key={log.id}
                className={`${currentTheme.bgCard} border-2 ${currentTheme.border} rounded-2xl p-4 sm:p-5 flex items-start space-x-4 shadow-sm hover:border-amber-500/50 transition`}
              >
                <div className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/20 shrink-0 mt-0.5">
                  {getActionIcon(log.action)}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-black truncate max-w-md">
                        {log.chapterTitle || projectTitle || "Naskah Studio"}
                      </span>
                    </div>

                    <span className={`text-[11px] ${currentTheme.textMuted} font-mono font-bold flex items-center space-x-1 shrink-0`}>
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{timeAgo}</span>
                    </span>
                  </div>

                  <p className={`text-xs sm:text-sm ${currentTheme.textMain} font-medium leading-relaxed`}>
                    {log.action}
                  </p>

                  <div className="flex items-center space-x-2 pt-1 text-[11px]">
                    <span className="inline-flex items-center space-x-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-bold">
                      <User className="w-3 h-3 text-amber-400" />
                      <span>{log.authorName || "Penulis"}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className={`py-14 text-center rounded-2xl border-2 border-dashed ${currentTheme.border} p-8 space-y-3`}>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                <History className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black">
                {searchQuery ? "Tidak ada log revisi yang cocok" : "Belum ada log revisi tercatat"}
              </h3>
              <p className={`text-xs ${currentTheme.textMuted} max-w-sm mx-auto`}>
                {searchQuery
                  ? `Tidak ditemukan hasil dengan kata kunci "${searchQuery}". Coba kata kunci lain.`
                  : "Setiap perubahan pada bab, penyimpanan naskah, atau catatan editorial akan otomatis terekam di sini."}
              </p>
              {onAddLog && !searchQuery && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-2 inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Catat Catatan Revisi Pertama</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD MANUAL REVISION LOG */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${currentTheme.bgCard} border-2 border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150`}>
            <div className="flex items-center justify-between border-b pb-3 border-white/10">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <Edit3 className="w-5 h-5" />
                </div>
                <h3 className="text-sm sm:text-base font-black">
                  Catat Catatan Revisi Editorial
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 transition text-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualLog} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5">
                  Bab Terkait (Opsional)
                </label>
                <select
                  value={newLogChapterId}
                  onChange={(e) => setNewLogChapterId(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl bg-black/10 dark:bg-white/5 border ${currentTheme.border} focus:outline-none focus:border-amber-500`}
                >
                  <option value="">-- Catatan Umum / Keseluruhan Naskah --</option>
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">
                  Deskripsi Revisi / Catatan Editorial <span className="text-amber-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={newLogAction}
                  onChange={(e) => setNewLogAction(e.target.value)}
                  placeholder="Contoh: Menyelesaikan penyelarasan alur plot Bab 1 s/d Bab 3, verifikasi istilah sejarah..."
                  className={`w-full p-3 text-xs rounded-xl bg-black/10 dark:bg-white/5 border ${currentTheme.border} focus:outline-none focus:border-amber-500`}
                />
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-white/10 hover:bg-white/5 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newLogAction.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-md transition"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Log Revisi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
