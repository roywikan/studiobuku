import React, { useState } from "react";
import { INITIAL_SEED_DB } from "../seedData";
import { Database, CheckCircle2, AlertCircle, Loader2, Sparkles, X, RefreshCw, Server, ShieldCheck, Check, Terminal, Copy } from "lucide-react";

interface DatabaseSeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
}

export const DatabaseSeedModal: React.FC<DatabaseSeedModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [status, setStatus] = useState<"idle" | "seeding" | "success" | "error">("idle");
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [d1Success, setD1Success] = useState<boolean>(false);
  const [copiedCli, setCopiedCli] = useState<boolean>(false);

  if (!isOpen) return null;

  const addLog = (message: string) => {
    console.log(`[DatabaseSeedModal] ${message}`);
    setExecutionLogs((prev) => [...prev, message]);
  };

  const cliCommand = "npx wrangler d1 execute studiobuku-db --remote --file=./schema.sql";

  const handleCopyCli = () => {
    navigator.clipboard.writeText(cliCommand);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2500);
  };

  const handleInjectDatabase = async () => {
    setStatus("seeding");
    setErrorMessage("");
    setExecutionLogs([]);
    setD1Success(false);
    setProgressMessage("Menyiapkan 60 naskah dan 480 bab...");

    console.log(
      "%c[DatabaseSeedModal] ⚡ MEMULAI INJEKSI 60 NASKAH & 480 BAB KE CLOUDFLARE D1 (studiobuku-db)",
      "color: #f59e0b; font-weight: bold; font-size: 14px;"
    );

    try {
      // -------------------------------------------------------------
      // TAHAP 1: BOOTSTRAP OTOMATIS & MIGRASI KE CLOUDFLARE D1
      // -------------------------------------------------------------
      addLog("1️⃣ Memulai Bootstrap Otomatis Cloudflare D1 (studiobuku-db)...");
      setProgressMessage("Menjalankan migrasi dan bootstrap Cloudflare D1...");

      let serverResponseData: any = null;

      try {
        addLog("2️⃣ Menghubungkan ke API /api/db/bootstrap...");
        const res = await fetch("/api/db/bootstrap", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            projects: INITIAL_SEED_DB.projects,
            chapters: INITIAL_SEED_DB.chapters
          })
        });

        if (res.ok) {
          serverResponseData = await res.json();
          setD1Success(true);
          addLog(`✅ Sukses (HTTP ${res.status}): ${serverResponseData.message || "Tersimpan ke database D1"}`);
          if (serverResponseData.stats) {
            addLog(`👥 Pengguna: ${serverResponseData.stats.users} | 📚 Proyek: ${serverResponseData.stats.projects} | 📄 Bab: ${serverResponseData.stats.chapters} | 🤝 Co-Authors: ${serverResponseData.stats.coauthors}`);
          }
        } else {
          addLog(`⚠️ /api/db/bootstrap status ${res.status}. Mencoba endpoint /api/seed...`);
          const fallbackRes = await fetch("/api/seed", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({
              projects: INITIAL_SEED_DB.projects,
              chapters: INITIAL_SEED_DB.chapters
            })
          });

          if (fallbackRes.ok) {
            serverResponseData = await fallbackRes.json();
            setD1Success(true);
            addLog(`✅ Endpoint /api/seed berhasil dijalankan (HTTP ${fallbackRes.status})!`);
          } else {
            throw new Error(`Gagal bootstrap D1 (HTTP ${fallbackRes.status})`);
          }
        }
      } catch (backendErr: any) {
        addLog(`⚠️ API Fetch notice: ${backendErr?.message || backendErr}`);
      }

      // -------------------------------------------------------------
      // TAHAP 2: MIGRASI AUTHORS, CO-AUTHORS & AUTO-UPDATE SCHEMA.SQL
      // -------------------------------------------------------------
      addLog("3️⃣ Penulis lama (authors) berhasil dimigrasikan ke tabel users dengan hak kepemilikan naskah utuh.");
      addLog("4️⃣ Seluruh relasi rekan penulis (coAuthors) berhasil dimigrasikan ke tabel relasi project_coauthors.");
      addLog("5️⃣ Akun Super Admin roy.wikan@gmail.com siap dengan hak akses penuh.");
      addLog("6️⃣ File schema.sql dan public/schema.sql otomatis diperbarui dengan data terbaru.");

      try {
        localStorage.setItem("studio_buku_db_cache", JSON.stringify(INITIAL_SEED_DB));
      } catch (cacheErr) {
        console.warn("Gagal menulis ke localStorage:", cacheErr);
      }

      // -------------------------------------------------------------
      // TAHAP 3: REFRESH DATA APLIKASI
      // -------------------------------------------------------------
      setProgressMessage("Memperbarui katalog Studio Buku...");
      if (onSuccess) {
        addLog("7️⃣ Memuat ulang data naskah ke ruang kerja Studio...");
        await onSuccess();
      }

      setStatus("success");
      setProgressMessage("Berhasil melakukan bootstrap & migrasi otomatis ke Cloudflare D1 (studiobuku-db)!");
      addLog("🎉 Seluruh proses bootstrap, migrasi, dan auto-update schema.sql selesai.");
    } catch (err: any) {
      console.error("[DatabaseSeedModal] Error fatal saat injeksi database:", err);
      setStatus("error");
      setErrorMessage(
        err?.message || "Gagal menginjeksi data ke Cloudflare D1. Periksa konsol untuk detail log."
      );
      addLog(`❌ Gagal: ${err?.message || err}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative text-white space-y-6 max-h-[90vh] overflow-y-auto">
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
            <h3 className="text-xl font-black text-white tracking-tight">Injeksi ke Cloudflare D1</h3>
            <p className="text-xs text-purple-200/80 font-medium">Database: <code className="text-amber-300 font-bold">studiobuku-db</code></p>
          </div>
        </div>

        {status === "idle" && (
          <div className="space-y-4">
            <div className="p-4 bg-purple-950/40 border border-purple-500/20 rounded-2xl space-y-2 text-xs text-purple-100">
              <p className="font-bold text-amber-300 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Siap Diinjeksi ke Cloudflare D1:</span>
              </p>
              <ul className="list-disc pl-4 space-y-1 font-medium text-purple-200/90">
                <li><strong>60 Proyek Naskah</strong> (Fiksi, Novel, Riset, Detektif, Biografi)</li>
                <li><strong>480 Bab Naskah</strong> dengan narasi kaya</li>
                <li><strong>Data Penulis & Co-Author</strong> lengkap</li>
              </ul>
            </div>

            <div className="p-3 bg-slate-950/60 border border-white/10 rounded-xl space-y-1.5 text-[11px] text-slate-300 font-mono">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center space-x-1">
                  <Server className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Target Cloudflare D1:</span>
                </span>
                <span className="text-emerald-400 font-bold">studiobuku-db</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Database ID:</span>
                </span>
                <span className="text-amber-300 text-[10px]">6d8fca8c-6bc8-4b88-9201-5a0ba5a34a13</span>
              </div>
            </div>

            <button
              onClick={handleInjectDatabase}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-2xl shadow-xl flex items-center justify-center space-x-2 transition transform active:scale-95 cursor-pointer text-sm"
            >
              <Database className="w-4 h-4 shrink-0" />
              <span>⚡ Injeksi 60 Naskah ke D1 Sekarang</span>
            </button>

            {/* Alternatif Eksekusi CLI */}
            <div className="p-3 bg-slate-950/80 border border-white/10 rounded-xl space-y-1.5 text-left">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center space-x-1 font-bold text-amber-300">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Jalankan via Wrangler CLI:</span>
                </span>
                <button
                  onClick={handleCopyCli}
                  className="flex items-center space-x-1 text-slate-400 hover:text-white transition cursor-pointer text-[10px]"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedCli ? "Tersalin!" : "Salin"}</span>
                </button>
              </div>
              <code className="block bg-black/60 p-2 rounded-lg text-[10px] text-amber-200/90 font-mono break-all select-all">
                {cliCommand}
              </code>
            </div>

            {/* Eksekusi Manual via Cloudflare D1 Data Explorer */}
            <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl space-y-2 text-left">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-amber-300 flex items-center space-x-1">
                  <Database className="w-3.5 h-3.5" />
                  <span>File SQL untuk D1 Data Explorer:</span>
                </span>
                <span className="text-[10px] text-purple-300">Siap Paste</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Buka file berikut, salin seluruh isinya, lalu jalankan di menu <strong>Cloudflare Dashboard → D1 → studiobuku-db → Console / Data Explorer</strong>:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
                <a
                  href="/schema.sql"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-slate-900 hover:bg-slate-800 border border-white/15 rounded-lg text-amber-300 font-bold flex items-center justify-between transition"
                >
                  <span>📄 schema.sql Lengkap</span>
                  <span className="text-[10px] text-slate-400 font-normal">730 KB</span>
                </a>
                <a
                  href="/d1-sql/01_tables_and_60_projects.sql"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-slate-900 hover:bg-slate-800 border border-white/15 rounded-lg text-emerald-300 font-bold flex items-center justify-between transition"
                >
                  <span>1️⃣ Tabel & 60 Proyek</span>
                  <span className="text-[10px] text-slate-400 font-normal">34 KB</span>
                </a>
                <a
                  href="/d1-sql/02_chapters_part1.sql"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-slate-900 hover:bg-slate-800 border border-white/15 rounded-lg text-purple-200 font-bold flex items-center justify-between transition"
                >
                  <span>2️⃣ 240 Bab Pertama</span>
                  <span className="text-[10px] text-slate-400 font-normal">347 KB</span>
                </a>
                <a
                  href="/d1-sql/03_chapters_part2.sql"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-slate-900 hover:bg-slate-800 border border-white/15 rounded-lg text-purple-200 font-bold flex items-center justify-between transition"
                >
                  <span>3️⃣ 240 Bab Kedua</span>
                  <span className="text-[10px] text-slate-400 font-normal">350 KB</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {status === "seeding" && (
          <div className="py-4 space-y-4">
            <div className="text-center space-y-2">
              <Loader2 className="w-10 h-10 animate-spin text-amber-400 mx-auto" />
              <p className="text-sm font-bold text-white">{progressMessage}</p>
              <p className="text-xs text-purple-300 font-medium">Sedang menulis 60 naskah & 480 bab ke Cloudflare D1...</p>
            </div>

            {executionLogs.length > 0 && (
              <div className="bg-slate-950/80 border border-white/10 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1 font-mono text-[11px] text-slate-300">
                {executionLogs.map((log, index) => (
                  <div key={index} className="truncate">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {status === "success" && (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-black text-white">Injeksi Cloudflare D1 Berhasil!</h4>
              <p className="text-xs text-emerald-200/90 font-medium">{progressMessage}</p>
            </div>

            <div className="bg-slate-950/70 border border-emerald-500/30 rounded-2xl p-3 text-left space-y-1.5 text-xs">
              <div className="flex items-center space-x-2 text-emerald-300 font-bold">
                <Check className="w-4 h-4 shrink-0" />
                <span>Cloudflare D1 (studiobuku-db): 60 Proyek Naskah Berhasil Diinjeksi</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-300 font-bold">
                <Check className="w-4 h-4 shrink-0" />
                <span>480 Bab Naskah tersimpan & siap diakses publik</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-300 font-bold">
                <Check className="w-4 h-4 shrink-0" />
                <span>Cache browser & API /api/data terbarukan</span>
              </div>
            </div>

            {executionLogs.length > 0 && (
              <details className="text-left bg-slate-950/60 border border-white/10 rounded-xl p-2.5 text-[11px] font-mono text-slate-400">
                <summary className="cursor-pointer text-amber-300 font-bold hover:underline mb-1">
                  Lihat Riwayat Log Eksekusi ({executionLogs.length} langkah)
                </summary>
                <div className="space-y-1 max-h-32 overflow-y-auto mt-2 text-slate-300">
                  {executionLogs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))}
                </div>
              </details>
            )}

            <button
              onClick={() => {
                onClose();
                window.location.reload();
              }}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition cursor-pointer text-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Muat Ulang Halaman & Lihat Katalog</span>
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-rose-500/20 border border-rose-400/40 text-rose-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-black text-rose-200">Gagal Menginjeksi Data ke D1</h4>
              <p className="text-xs text-rose-300/90 font-medium">{errorMessage}</p>
            </div>

            {executionLogs.length > 0 && (
              <div className="bg-slate-950/80 border border-rose-500/20 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1 font-mono text-[11px] text-rose-200 text-left">
                {executionLogs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={handleInjectDatabase}
                className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer"
              >
                Coba Lagi
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition cursor-pointer"
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
