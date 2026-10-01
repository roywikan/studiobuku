import React, { useState } from "react";
import { Project } from "../types";
import { Settings, Lock, Globe, Shield, Users, Database, Check, RefreshCw, X, Trash2, Plus } from "lucide-react";

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdateProject: (updated: Partial<Project>) => Promise<void> | void;
  onRunDatabaseBootstrap?: () => Promise<void>;
  currentAuthorName?: string;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
  onRunDatabaseBootstrap,
  currentAuthorName = "Penulis Studio",
}) => {
  const [title, setTitle] = useState(project.title || "");
  const [subtitle, setSubtitle] = useState(project.subtitle || "");
  const [genre, setGenre] = useState(project.genre || "Fiksi / Novel");
  const [synopsis, setSynopsis] = useState(project.synopsis || "");
  const [isPrivate, setIsPrivate] = useState<boolean>(!!project.isPrivate);
  const [coAuthors, setCoAuthors] = useState<string[]>(project.coAuthors || []);
  const [newCoAuthorInput, setNewCoAuthorInput] = useState("");

  const [saving, setSaving] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [bootstrapMessage, setBootstrapMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddCoAuthor = () => {
    if (!newCoAuthorInput.trim()) return;
    const clean = newCoAuthorInput.trim();
    if (!coAuthors.includes(clean)) {
      setCoAuthors([...coAuthors, clean]);
    }
    setNewCoAuthorInput("");
  };

  const handleRemoveCoAuthor = (authorNameToRemove: string) => {
    setCoAuthors(coAuthors.filter((a) => a !== authorNameToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdateProject({
        title,
        subtitle,
        genre,
        synopsis,
        isPrivate,
        coAuthors,
      });
      onClose();
    } catch (err) {
      console.error("Failed to update project settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleBootstrapClick = async () => {
    if (!onRunDatabaseBootstrap) return;
    setBootstrapLoading(true);
    setBootstrapMessage(null);
    try {
      await onRunDatabaseBootstrap();
      setBootstrapMessage("✅ Skema database D1 & schema.sql berhasil diproyeksikan dan dibootstrap!");
    } catch (err: any) {
      setBootstrapMessage("❌ Gagal mereset database D1: " + (err?.message || "Error"));
    } finally {
      setBootstrapLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-950 border-2 border-amber-500/60 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black">Pengaturan Proyek & Privasi Naskah</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-black text-lg p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs font-sans">
          
          {/* TOGGLE SWITCH PUBLIK VS PRIVAT */}
          <div className="bg-slate-900/90 p-4 rounded-xl border-2 border-amber-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-black text-amber-300 text-sm flex items-center space-x-1.5">
                  {isPrivate ? <Lock className="w-4 h-4 text-red-400" /> : <Globe className="w-4 h-4 text-emerald-400" />}
                  <span>Status Akses Naskah ({isPrivate ? "PRIVAT" : "PUBLIK"})</span>
                </span>
                <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                  {isPrivate
                    ? "Privat: Hanya Anda (Inisiator) & Penulis Pendamping (Co-Author) yang dapat membaca dan menyunting naskah ini. Preview HTML publik dinonaktifkan."
                    : "Publik: Naskah dapat dibaca oleh umum dan terindeks Googlebot melalui pratinjau HTML, namun penyuntingan tetap dibatasi khusus Penulis & Co-Author."}
                </p>
              </div>

              {/* Toggle Switch Button */}
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 shrink-0 cursor-pointer ${
                  isPrivate ? "bg-red-500/90" : "bg-emerald-500"
                }`}
                title="Klik untuk mengubah antara Status Publik dan Privat"
              >
                <div
                  className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center font-bold text-[10px] text-slate-900 ${
                    isPrivate ? "translate-x-6" : "translate-x-0"
                  }`}
                >
                  {isPrivate ? "🔒" : "🌐"}
                </div>
              </button>
            </div>

            <div className={`p-2.5 rounded-lg border text-[11px] font-bold ${
              isPrivate ? "bg-red-950/40 border-red-500/40 text-red-200" : "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
            }`}>
              {isPrivate ? "🔒 Akses Dibatasi: HTML Preview publik akan mengembalikan pesan 403 Privacy Lock." : "🌐 Akses Terbuka: Naskah akan tampil di Galeri Publik 12-Cards & HTML Preview."}
            </div>
          </div>

          {/* PROJECT DETAIL FIELDS */}
          <div className="space-y-3">
            <div>
              <label className="block font-black text-amber-300 mb-1">Judul Proyek Buku:</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
              />
            </div>

            <div>
              <label className="block font-black text-amber-300 mb-1">Sub-judul / Tagline:</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
              />
            </div>

            <div>
              <label className="block font-black text-amber-300 mb-1">Genre Buku:</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
              >
                <option value="Fiksi / Novel">Fiksi / Novel</option>
                <option value="Fiksi / Drama">Fiksi / Drama</option>
                <option value="Fiksi Remaja / Romance">Fiksi Remaja / Romance</option>
                <option value="Misteri & Detektif">Misteri & Detektif</option>
                <option value="Non-Fiksi / Pengembangan Diri">Non-Fiksi / Pengembangan Diri</option>
                <option value="Biografi / Antologi">Biografi / Antologi</option>
                <option value="Akademik & Riset">Akademik & Riset</option>
              </select>
            </div>

            <div>
              <label className="block font-black text-amber-300 mb-1">Sinopsis Cerita:</label>
              <textarea
                rows={3}
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400 resize-none font-medium leading-relaxed"
              />
            </div>
          </div>

          {/* PRIVILEGE & CO-AUTHORSHIP MANAGEMENT */}
          <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-amber-300 flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Hak Akses & Penulis Pendamping (Co-Authors)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold">{coAuthors.length} Co-Author</span>
            </div>

            <p className="text-[11px] text-slate-300">
              Penulis yang terdaftar di bawah ini dapat melihat dan ikut menulis/menyunting proyek ini di dalam akun login Studio Buku mereka.
            </p>

            {/* List of Co-Authors */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2.5 py-1 bg-amber-400 text-slate-950 font-black rounded-lg text-[10px] flex items-center space-x-1">
                <Shield className="w-3 h-3" />
                <span>{project.ownerName || currentAuthorName} (Pemilik Utama)</span>
              </span>

              {coAuthors.map((authorName, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-slate-800 border border-amber-500/40 text-amber-300 font-bold rounded-lg text-[10px] flex items-center space-x-1"
                >
                  <span>✍️ {authorName}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCoAuthor(authorName)}
                    className="hover:text-red-400 p-0.5 ml-1"
                    title="Hapus Co-author"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Input Add Co-Author */}
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="text"
                placeholder="Tambah nama / email co-author..."
                value={newCoAuthorInput}
                onChange={(e) => setNewCoAuthorInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleAddCoAuthor}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-3 py-1.5 rounded-xl transition flex items-center space-x-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>
          </div>

          {/* BOOTSTRAP DATABASE D1 & SCHEMA BUTTON */}
          {onRunDatabaseBootstrap && (
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-amber-300 flex items-center space-x-1.5">
                  <Database className="w-4 h-4 text-amber-400" />
                  <span>Bootstrap Database D1 & Skema SQL</span>
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">schema.sql</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-normal">
                Perbarui struktur tabel D1 dengan kolom <code>isPrivate</code>, <code>ownerId</code>, <code>coAuthors</code>, dan seed data 12+ naskah publik terbaru.
              </p>
              <button
                type="button"
                onClick={handleBootstrapClick}
                disabled={bootstrapLoading}
                className="w-full bg-slate-800 hover:bg-slate-700 border border-amber-500/50 text-amber-300 text-xs font-black py-2 rounded-xl transition flex items-center justify-center space-x-2 shadow-md cursor-pointer"
              >
                {bootstrapLoading ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <Database className="w-4 h-4 text-amber-400" />}
                <span>{bootstrapLoading ? "Memproses Bootstrap D1..." : "Proyeksikan Structural Schema & Bootstrap Data"}</span>
              </button>

              {bootstrapMessage && (
                <div className="text-[11px] p-2 bg-slate-950 border border-slate-700 rounded-lg text-amber-200 font-mono">
                  {bootstrapMessage}
                </div>
              )}
            </div>
          )}

          {/* SUBMIT BUTTONS */}
          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold rounded-full transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-full transition shadow-lg flex items-center space-x-1.5"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <Check className="w-4 h-4 text-slate-950 stroke-[3]" />}
              <span>{saving ? "Menyimpan..." : "Simpan Pengaturan"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
