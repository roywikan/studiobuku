import React, { useState, useEffect } from "react";
import { Sparkles, Wand2, BookOpen, Send, Lightbulb, Key, CheckCircle2, ShieldCheck, Info } from "lucide-react";
import { WriterTheme } from "../theme";

interface AiAssistantViewProps {
  projectTitle: string;
  projectGenre: string;
  currentTheme: WriterTheme;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({ projectTitle, projectGenre, currentTheme }) => {
  const [prompt, setPrompt] = useState("");
  const [selectedAction, setSelectedAction] = useState<"outline" | "conflict" | "dialogue" | "custom">("outline");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");

  // Custom API Key Management State
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState("");
  const [activeCustomKey, setActiveCustomKey] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem("studio_custom_gemini_key") || "";
    setActiveCustomKey(saved);
    setCustomKeyInput(saved);
  }, []);

  const handleSaveCustomKey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = customKeyInput.trim();
    if (cleanKey) {
      localStorage.setItem("studio_custom_gemini_key", cleanKey);
      setActiveCustomKey(cleanKey);
    } else {
      localStorage.removeItem("studio_custom_gemini_key");
      setActiveCustomKey("");
    }
    setShowApiKeyModal(false);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && selectedAction === "custom") return;
    setLoading(true);
    setResponse("");

    let actionText = prompt;
    if (selectedAction === "outline") {
      actionText = `Buatkan outline struktur bab yang mendalam dan emosional untuk novel ${projectGenre} berjudul "${projectTitle}". Sinopsis/Premis: ${prompt || "Dua sahabat masa kecil bertemu kembali setelah 10 tahun."}`;
    } else if (selectedAction === "conflict") {
      actionText = `Berikan 3 ide konflik plot twist yang mengejutkan namun masuk akal untuk cerita ${projectGenre} berjudul "${projectTitle}". Konteks: ${prompt}`;
    } else if (selectedAction === "dialogue") {
      actionText = `Tuliskan draf dialog dramatis antara dua karakter utama yang sedang menghadapi kesalahpahaman dalam cerita "${projectTitle}". Konteks: ${prompt}`;
    }

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (activeCustomKey) {
        headers["x-gemini-api-key"] = activeCustomKey;
      }

      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "custom",
          text: actionText,
          genre: projectGenre
        })
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setResponse(data.result);
      } else {
        setResponse(data.error || "Gagal menghasilkan respons dari AI.");
      }
    } catch (err) {
      console.error(err);
      setResponse("Terjadi kesalahan koneksi ke server AI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex-1 ${currentTheme.bgMain} ${currentTheme.textMain} p-6 overflow-y-auto transition-colors duration-300 min-h-[calc(100vh-5rem)]`}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Bar & API Key Config Button */}
        <div className={`border-b-2 ${currentTheme.border} pb-4 flex flex-wrap items-center justify-between gap-4`}>
          <div>
            <h1 className="text-xl font-black flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              <span>Asisten AI Studio Buku (Gemini Copilot)</span>
            </h1>
            <p className={`text-xs ${currentTheme.textMuted} font-medium mt-1`}>
              Mitra diskusi kreatif untuk merumuskan outline bab, merancang konflik dramatis, dan menyempurnakan naskah Anda.
            </p>
          </div>

          {/* Key Config Button */}
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-amber-300 border-2 border-amber-500/50 text-xs font-black px-3.5 py-2 rounded-full transition shadow-md"
            title="Kelola Kunci API Gemini"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {activeCustomKey ? "API Key: Kustom" : "API Key: Terpusat Proyek"}
            </span>
          </button>
        </div>

        {/* Action Selector with High Contrast Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => setSelectedAction("outline")}
            className={`p-3.5 rounded-2xl border-2 text-left transition space-y-1 ${
              selectedAction === "outline" ? "bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md" : `bg-slate-900 border-slate-800 text-white font-bold hover:border-slate-700`
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <div className="text-xs font-black">Outline Bab</div>
            <div className="text-[10px] opacity-90 font-medium">Rancang alur cerita</div>
          </button>

          <button
            onClick={() => setSelectedAction("conflict")}
            className={`p-3.5 rounded-2xl border-2 text-left transition space-y-1 ${
              selectedAction === "conflict" ? "bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md" : `bg-slate-900 border-slate-800 text-white font-bold hover:border-slate-700`
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <div className="text-xs font-black">Konflik / Twist</div>
            <div className="text-[10px] opacity-90 font-medium">Cari kejutan plot</div>
          </button>

          <button
            onClick={() => setSelectedAction("dialogue")}
            className={`p-3.5 rounded-2xl border-2 text-left transition space-y-1 ${
              selectedAction === "dialogue" ? "bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md" : `bg-slate-900 border-slate-800 text-white font-bold hover:border-slate-700`
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <div className="text-xs font-black">Draf Dialog</div>
            <div className="text-[10px] opacity-90 font-medium">Pertukaran kata tokoh</div>
          </button>

          <button
            onClick={() => setSelectedAction("custom")}
            className={`p-3.5 rounded-2xl border-2 text-left transition space-y-1 ${
              selectedAction === "custom" ? "bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md" : `bg-slate-900 border-slate-800 text-white font-bold hover:border-slate-700`
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <div className="text-xs font-black">Tanya AI Studio</div>
            <div className="text-[10px] opacity-90 font-medium">Konsultasi umum</div>
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleGenerate} className={`${currentTheme.bgCard} border-2 ${currentTheme.border} rounded-2xl p-5 space-y-3 shadow-md`}>
          <label className="text-xs font-black block">
            {selectedAction === "outline" && "Premis atau Catatan Awal untuk Outline Bab:"}
            {selectedAction === "conflict" && "Deskripsi Situasi Cerita Saat Ini:"}
            {selectedAction === "dialogue" && "Topik atau Emosi yang Dibahas dalam Dialog:"}
            {selectedAction === "custom" && "Pertanyaan atau Permintaan untuk Asisten AI:"}
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Tuliskan detail atau catatan Anda di sini..."
            className={`w-full h-28 border-2 ${currentTheme.border} ${currentTheme.bgMain} ${currentTheme.textMain} font-medium rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none font-sans`}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-5 py-2.5 rounded-xl transition shadow-md flex items-center space-x-1.5 hover:scale-102 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 stroke-[3]" />
              <span>{loading ? "Gemini Berpikir..." : "Kirim ke Asisten AI"}</span>
            </button>
          </div>
        </form>

        {/* Result Area */}
        {(response || loading) && (
          <div className={`${currentTheme.bgCard} border-2 ${currentTheme.border} rounded-2xl p-6 space-y-3 shadow-lg`}>
            <div className={`flex items-center space-x-2 border-b-2 ${currentTheme.border} pb-3`}>
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-black">Hasil Tanggapan Asisten AI</h3>
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans font-medium">
              {loading ? (
                <div className="flex items-center justify-center py-12 space-x-2 text-amber-600 font-bold">
                  <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Sedang merumuskan gagasan kreatif...</span>
                </div>
              ) : (
                response
              )}
            </div>
          </div>
        )}
      </div>

      {/* GEMINI_API_KEY Config Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border-2 border-amber-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold">Pengaturan GEMINI_API_KEY</h3>
              </div>
              <button onClick={() => setShowApiKeyModal(false)} className="text-slate-400 hover:text-white font-black text-lg">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-medium">
              <div className="p-3 bg-slate-900 border-2 border-emerald-500/40 rounded-xl space-y-1 text-emerald-300">
                <div className="flex items-center space-x-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Sistem Default Terpusat (1 Key Studio)</span>
                </div>
                <p className="text-[11px] text-slate-300 font-normal">
                  Secara default, seluruh tim penulis menggunakan <strong>1 Server GEMINI_API_KEY</strong> yang sama pada file lingkungan proyek (<code className="text-amber-300">.env</code>). Penulis tidak wajib mengisi kunci pribadi.
                </p>
              </div>

              <div className="p-3 bg-slate-900 border-2 border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center space-x-1.5 font-bold text-amber-300">
                  <Info className="w-4 h-4 text-amber-400" />
                  <span>Opsi API Key Pribadi Penulis</span>
                </div>
                <p className="text-[11px] text-slate-300 font-normal">
                  Jika Anda ingin menggunakan kuota pribadi Anda sendiri dari Google AI Studio, masukkan kunci Anda di bawah ini. Kunci ini hanya disimpan aman di peramban Anda.
                </p>
              </div>

              <form onSubmit={handleSaveCustomKey} className="space-y-3 pt-2">
                <label className="block text-xs font-black text-amber-300">
                  Custom GEMINI_API_KEY (Opsional):
                </label>
                <input
                  type="password"
                  value={customKeyInput}
                  onChange={(e) => setCustomKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                />

                <div className="flex items-center justify-between pt-2">
                  {activeCustomKey ? (
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem("studio_custom_gemini_key");
                        setActiveCustomKey("");
                        setCustomKeyInput("");
                        setShowApiKeyModal(false);
                      }}
                      className="text-xs text-red-400 hover:text-red-300 font-bold underline"
                    >
                      Hapus Custom Key (Kembali ke Default Studio)
                    </button>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Menggunakan Server Key Terpusat</span>
                    </span>
                  )}

                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-full transition shadow-lg"
                  >
                    Simpan Pengaturan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
