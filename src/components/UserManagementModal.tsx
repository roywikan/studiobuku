import React, { useState, useEffect } from "react";
import { UserRecord } from "../types";
import { Users, Shield, ShieldCheck, Search, X, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail
}) => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const contentType = res.headers.get("content-type") || "";
      if (res.ok && contentType.includes("application/json")) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setUsers(data);
        } else if (data && Array.isArray((data as any).users)) {
          setUsers((data as any).users);
        } else {
          setUsers([]);
        }
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("Gagal memuat pengguna D1:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setUsers((prev) => {
          const arr = Array.isArray(prev) ? prev : [];
          return arr.map((u) => (u.id === userId ? { ...u, role: newRole as any } : u));
        });
        setToastMessage(`Peran berhasil diubah menjadi ${newRole}`);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error("Gagal mengubah peran:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isOpen) return null;

  const safeUsers = Array.isArray(users) ? users : [];
  const filteredUsers = safeUsers.filter((u) => {
    if (!u) return false;
    const q = (search || "").toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans select-none text-white">
      <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow Deco */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-400/20 border border-amber-400/40 rounded-2xl text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  Manajemen Pengguna Cloudflare D1
                </h2>
                <span className="bg-amber-400/20 border border-amber-400/50 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Tabel database: <code className="text-amber-300 font-mono">studiobuku-db.users</code>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification Toast */}
        {toastMessage && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Search & Stats Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, email, atau peran pengguna..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition font-medium"
            />
          </div>

          <button
            onClick={fetchUsers}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shrink-0 border border-slate-700"
            title="Segarkan data pengguna D1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Segarkan ({safeUsers.length})</span>
          </button>
        </div>

        {/* Users Table / List */}
        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/70 max-h-96 overflow-y-auto">
          {loading && safeUsers.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Loader2 className="w-6 h-6 text-amber-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-bold">Mengambil data dari Cloudflare D1...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-bold">
              Tidak ada pengguna yang cocok dengan pencarian "{search}".
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {filteredUsers.map((user) => {
                const isCurrent = currentUserEmail && user.email.toLowerCase() === currentUserEmail.toLowerCase();
                const isRoy = user.email.toLowerCase() === "roy.wikan@gmail.com";
                const isSuperAdmin = user.role === "superadmin" || isRoy;

                return (
                  <div
                    key={user.id}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/60 transition"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-amber-400/40 flex items-center justify-center text-base overflow-hidden shrink-0">
                        {user.avatar_url && (user.avatar_url.startsWith("http://") || user.avatar_url.startsWith("https://")) ? (
                          <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          user.avatar_url || "✍️"
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-sm text-white truncate">{user.name}</span>
                          {isCurrent && (
                            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-1.5 py-0.2 rounded border border-emerald-500/40">
                              Anda
                            </span>
                          )}
                          {isSuperAdmin && (
                            <span className="bg-amber-400/20 text-amber-300 text-[10px] font-black px-1.5 py-0.2 rounded border border-amber-400/40 flex items-center space-x-1">
                              <Shield className="w-3 h-3" />
                              <span>Super Admin</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono truncate">{user.email}</div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          ID: {user.id} • Dibuat: {new Date(user.created_at).toLocaleDateString("id-ID")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {isRoy ? (
                        <span className="text-xs font-black text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/30">
                          👑 Pemilik Utama
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          disabled={updatingId === user.id}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="bg-slate-900 border border-slate-700 hover:border-amber-400 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-bold focus:outline-none transition cursor-pointer"
                        >
                          <option value="user" className="bg-slate-900 text-white">Penulis Biasa (user)</option>
                          <option value="author" className="bg-slate-900 text-white">Penulis Utama (author)</option>
                          <option value="editor" className="bg-slate-900 text-white">Editor Studio (editor)</option>
                          <option value="superadmin" className="bg-slate-900 text-amber-400">Super Admin (superadmin)</option>
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
          <span>Data tersinkron otomatis ke Cloudflare D1 SQLite.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl transition shadow-md"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
