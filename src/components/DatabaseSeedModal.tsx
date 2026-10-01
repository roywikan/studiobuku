import React, { useState } from "react";
import { doc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { INITIAL_SEED_DB } from "../seedData";
import { Database, CheckCircle2, AlertCircle, Loader2, Sparkles, X, RefreshCw } from "lucide-react";

interface DatabaseSeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DatabaseSeedModal: React.FC<DatabaseSeedModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [status, setStatus] = useState<"idle" | "seeding" | "success" | "error">("idle");
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  if (!isOpen) return null;

  const handleInjectDatabase = async () => {
    setStatus("seeding");
    setErrorMessage("");
    setProgressMessage("Menyiapkan 60 naskah dan 480 bab...");

    try {
      const { projects, chapters, authors } = INITIAL_SEED_DB;

      // 1. Upload Projects (Max 400 per batch)
      let batch = writeBatch(db);
      let count = 0;

      for (let i = 0; i < projects.length; i++) {
        const proj = projects[i];
        const projRef = doc(db, "projects", proj.id);
        batch.set(projRef, proj);
        count++;

        if (count >= 300) {
          setProgressMessage(`Mengunggah Proyek Naskah (${i + 1}/${projects.length})...`);
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }

      if (count > 0) {
        setProgressMessage(`Mengunggah Sisa Proyek Naskah (${projects.length}/${projects.length})...`);
        await batch.commit();
      }

      // 2. Upload Chapters
      batch = writeBatch(db);
      count = 0;

      for (let i = 0; i < chapters.length; i++) {
        const chap = chapters[i];
        const chapRef = doc(db, "chapters", chap.id);
        batch.set(chapRef, chap);
        count++;

        if (count >= 300) {
          setProgressMessage(`Mengunggah Bab Naskah (${i + 1}/${chapters.length})...`);
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }

      if (count > 0) {
        setProgressMessage(`Mengunggah Sisa Bab Naskah (${chapters.length}/${chapters.length})...`);
        await batch.commit();
      }

      // 3. Upload Authors
      batch = writeBatch(db);
      for (const author of authors) {
        const authorRef = doc(db, "authors", author.id);
        batch.set(authorRef, author);
      }
      await batch.commit();

      // 4. Trigger local Express DB seed if running
      try {
        await fetch("/api/seed", { method: "POST" });
      } catch {
        // Ignore backend endpoint errors if purely static host
      }

      setStatus("success");
      setProgressMessage("Seluruh 60 Proyek Naskah & 480 Bab Berhasil Diinjeksi ke Cloud Firestore!");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Firestore Web Seeding Error:", err);
      setStatus("error");
      setErrorMessage(
        err?.message || "Gagal mengunggah data ke Cloud Firestore. Pastikan aturan keamanan mengizinkan akses."
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-white space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-400/20 border border-amber-400/40 rounded-2xl text-amber-300">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">Injeksi 60 Naskah ke DB</h3>
            <p className="text-xs text-purple-200/80 font-medium">Injeksi langsung dari Web GUI tanpa Terminal/Wrangler</p>
          </div>
        </div>

        {status === "idle" && (
          <div className="space-y-4">
            <div className="p-4 bg-purple-950/40 border border-purple-500/20 rounded-2xl space-y-2 text-xs text-purple-100">
              <p className="font-bold text-amber-300 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Siap Menginjeksi Katalog Naskah:</span>
              </p>
              <ul className="list-disc pl-4 space-y-1 font-medium text-purple-200/90">
                <li><strong>60 Proyek Naskah</strong> (Fiksi, Novel, Riset, Detektif, Biografi)</li>
                <li><strong>480 Bab Naskah</strong> dengan narasi kaya</li>
                <li><strong>Data Penulis & Co-Author</strong> lengkap</li>
              </ul>
            </div>

            <button
              onClick={handleInjectDatabase}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-2xl shadow-xl flex items-center justify-center space-x-2 transition transform active:scale-95 cursor-pointer text-sm"
            >
              <Database className="w-4 h-4 shrink-0" />
              <span>⚡ Klik Injeksi 60 Naskah Sekarang</span>
            </button>
          </div>
        )}

        {status === "seeding" && (
          <div className="text-center py-6 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-amber-400 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">{progressMessage}</p>
              <p className="text-xs text-purple-300 font-medium">Mohon tunggu, jangan tutup halaman ini...</p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-black text-white">Injeksi Berhasil!</h4>
              <p className="text-xs text-emerald-200/90 font-medium">{progressMessage}</p>
            </div>
            <button
              onClick={() => {
                onClose();
                window.location.reload();
              }}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition cursor-pointer text-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Muat Ulang Halaman</span>
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-rose-500/20 border border-rose-400/40 text-rose-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-black text-rose-200">Gagal Menginjeksi Data</h4>
              <p className="text-xs text-rose-300/90 font-medium">{errorMessage}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleInjectDatabase}
                className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition"
              >
                Coba Lagi
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
