import React, { useState } from "react";
import { Upload, CheckCircle2 } from "lucide-react";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  authorName: string;
  onImportSuccess: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  projectId,
  authorName,
  onImportSuccess,
}) => {
  const [text, setText] = useState("");
  const [splitBy, setSplitBy] = useState<"chapters" | "paragraphs">("chapters");
  const [loading, setLoading] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) setText(content);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          text,
          authorName,
          splitBy
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessCount(data.count);
        setTimeout(() => {
          onImportSuccess();
          onClose();
          setSuccessCount(null);
          setText("");
        }, 1200);
      }
    } catch (err) {
      console.error("Import error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-950 border-2 border-amber-500/50 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 text-white">
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black">Impor Naskah (.txt atau Google Docs)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm font-black">✕</button>
        </div>

        {successCount !== null ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
            <h4 className="text-base font-black">Berhasil Mengimpor {successCount} Bab Baru!</h4>
            <p className="text-xs text-slate-300 font-medium">Naskah telah dimasukkan ke dalam struktur bab proyek Studio Buku.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-200">Unggah File .txt</label>
              <input
                type="file"
                accept=".txt,.md"
                onChange={handleFileUpload}
                className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-2 text-xs text-slate-200 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-amber-400 file:text-slate-950 hover:file:bg-amber-300 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-200">Atau Tempel (Paste) Teks dari Google Docs / Clipboard</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tempel naskah di sini. Teks yang diawali 'Bab X' akan otomatis dipilah menjadi bab terpisah..."
                className="w-full h-48 bg-slate-900 border-2 border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none font-sans font-medium"
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="text-xs font-bold text-slate-200">Metode Pemisahan:</label>
              <select
                value={splitBy}
                onChange={(e) => setSplitBy(e.target.value as any)}
                className="bg-slate-900 border-2 border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-extrabold"
              >
                <option value="chapters">Pilah Berdasarkan Judul Bab (Bab 1, Bab 2...)</option>
                <option value="paragraphs">Pilah Berdasarkan Blok Paragraf</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t-2 border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-700 text-xs font-bold rounded-full transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 disabled:opacity-50 text-xs font-black rounded-full transition shadow-lg flex items-center space-x-1.5"
              >
                <span>{loading ? "Memproses..." : "Proses & Impor Naskah"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
