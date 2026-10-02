import React, { useState, useEffect } from "react";
import { Share2, Copy, Check, Users, UserPlus, Trash2, Shield, Loader2 } from "lucide-react";
import { ProjectCoAuthor } from "../types";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onCoAuthorsUpdated?: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  onCoAuthorsUpdated
}) => {
  const [copied, setCopied] = useState(false);
  const [coauthors, setCoauthors] = useState<ProjectCoAuthor[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("editor");
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const inviteLink = `${window.location.origin}/?invite=collab_${projectId}`;

  const fetchCoauthors = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/coauthors`);
      if (res.ok) {
        const data = await res.json();
        setCoauthors(data);
      }
    } catch (err) {
      console.error("Gagal memuat co-author:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && projectId) {
      fetchCoauthors();
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [isOpen, projectId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddCoAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      setErrorMsg("Harap masukkan alamat email rekan penulis.");
      return;
    }

    setIsAdding(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/projects/${projectId}/coauthors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail.trim().toLowerCase(),
          role: newRole
        })
      });

      if (res.ok) {
        setNewEmail("");
        setSuccessMsg(`Rekan penulis ${newEmail.trim()} berhasil ditambahkan ke Cloudflare D1!`);
        await fetchCoauthors();
        if (onCoAuthorsUpdated) onCoAuthorsUpdated();
        setTimeout(() => setSuccessMsg(""), 3500);
      } else {
        const err = await res.json();
        setErrorMsg(err?.error || "Gagal menambahkan rekan penulis.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Terjadi kesalahan jaringan.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveCoAuthor = async (coauthorId: string, email: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/coauthors/${coauthorId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setCoauthors((prev) => prev.filter((ca) => ca.id !== coauthorId));
        setSuccessMsg(`Akses untuk ${email} telah dicabut.`);
        if (onCoAuthorsUpdated) onCoAuthorsUpdated();
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error("Gagal menghapus co-author:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans select-none text-white">
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-400/20 text-amber-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Kolaborasi & Co-Authorship</h3>
              <p className="text-xs text-amber-300 font-bold truncate max-w-xs">{projectName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-base font-black p-1">✕</button>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3.5 py-2 rounded-xl text-xs font-bold">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-500/20 border border-red-500/40 text-red-300 px-3.5 py-2 rounded-xl text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {/* Add Co-Author by Email (Cloudflare D1) */}
        <form onSubmit={handleAddCoAuthor} className="space-y-2.5 bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
            <UserPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>Tambah Rekan Penulis via Email (D1):</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder="contoh: penulis.rekan@gmail.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition font-medium"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none"
            >
              <option value="editor">Editor (Bisa Edit)</option>
              <option value="reviewer">Reviewer (Ulas)</option>
            </select>
            <button
              type="submit"
              disabled={isAdding}
              className="bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition shadow-md flex items-center justify-center space-x-1 shrink-0"
            >
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>+ Tambah</span>}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Pengguna dengan email ini akan otomatis melihat proyek ini di dasbor mereka dengan izin sunting.
          </p>
        </form>

        {/* Current Co-Authors List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Daftar Rekan Penulis Terdaftar ({coauthors.length})</span>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />}
          </div>

          <div className="border border-slate-800 rounded-2xl bg-slate-950/80 max-h-36 overflow-y-auto divide-y divide-slate-800/60">
            {coauthors.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 font-medium">
                Belum ada rekan penulis yang ditambahkan ke proyek ini.
              </div>
            ) : (
              coauthors.map((ca) => (
                <div key={ca.id} className="p-2.5 sm:p-3 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-white font-mono truncate block">{ca.user_email}</span>
                    <span className="text-[10px] text-amber-400 uppercase font-black">{ca.role}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveCoAuthor(ca.id, ca.user_email)}
                    className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition"
                    title="Cabut Akses Kolaborasi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Shareable Invite Link */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[11px] font-bold text-slate-400">Tautan Akses Cepat Proyek</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-amber-300 font-mono font-bold select-all truncate"
            />
            <button
              onClick={handleCopy}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 shrink-0 border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Disalin!" : "Salin"}</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
