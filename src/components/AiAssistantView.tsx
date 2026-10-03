import React, { useState, useEffect } from "react";
import { Sparkles, Wand2, BookOpen, Send, Lightbulb, Key, CheckCircle2, ShieldCheck, Info, RefreshCw, Zap } from "lucide-react";
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

  // Multi-Key Pool Info from Server
  const [poolInfo, setPoolInfo] = useState<{
    totalKeys: number;
    activeModel: string;
    hasServerKeys: boolean;
    keysMasked?: string[];
  } | null>(null);

  const [lastMeta, setLastMeta] = useState<{
    keyIndex?: number;
    totalKeys?: number;
    modelUsed?: string;
    attemptsUsed?: number;
  } | null>(null);

  // Custom API Key Management State
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState("");
  const [activeCustomKey, setActiveCustomKey] = useState<string>("");

  const fetchPoolStatus = async (customKey = "") => {
    try {
      const headers: Record<string, string> = {};
      if (customKey) headers["x-gemini-api-key"] = customKey;
      const res = await fetch("/api/ai/pool-status", { headers });
      if (res.ok) {
        const data = await res.json();
        setPoolInfo(data);
      }
    } catch (e) {
      console.warn("Gagal mengambil status pool:", e);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("studio_custom_gemini_key") || "";
    setActiveCustomKey(saved);
    setCustomKeyInput(saved);
    fetchPoolStatus(saved);
  }, []);

  const handleSaveCustomKey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = customKeyInput.trim();
    if (cleanKey) {
      localStorage.setItem("studio_custom_gemini_key", cleanKey);
      setActiveCustomKey(cleanKey);
      fetchPoolStatus(cleanKey);
    } else {
      localStorage.removeItem("studio_custom_gemini_key");
      setActiveCustomKey("");
      fetchPoolStatus("");
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
        setLastMeta({
          keyIndex: data.keyIndex,
          totalKeys: data.totalKeys,
          modelUsed: data.modelUsed,
          attemptsUsed: data.attemptsUsed
        });
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
        
        {/* Header Bar & Multi-Key Pool Info */}
        <div className={`border-b-2 ${currentTheme.border} pb-4 flex flex-wrap items-center justify-between gap-4`}>
          <div>
            <h1 className="text-xl font-black flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              <span>Asisten AI Studio Buku (Gemini 3.8 Flash)</span>
            </h1>
            <p className={`text-xs ${currentTheme.textMuted} font-medium mt-1`}>
              Mitra penulisan naskah kolaboratif dengan sistem rotasi multi-kunci otomatis & fallback HTTP 429.
            </p>
          </div>

          {/* Key Config Button & Pool Pill */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-850 text-amber-300 border-2 border-amber-500/50 text-xs font-black px-3.5 py-2 rounded-full transition shadow-md cursor-pointer"
              title="Kelola Kumpulan Kunci API Gemini & Status Load Balancer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {poolInfo ? `Pool: ${poolInfo.totalKeys} Key Aktif` : "Pool Gemini"}
              </span>
            </button>
          </div>
        </div>

        {/* Action Selector with High Contrast Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => setSelectedAction("outline")}
            className={`p-3.5 rounded-2xl border-2 text-left transition space-y-1 cursor-pointer ${
              selectedAction === "outline" ? "bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md" : `bg-slate-900 border-slate-800 text-white font-bold hover:border-slate-700`
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <div className="text-xs font-black">Outline Bab</div>
            <div className="text-[10px] opacity-90 font-medium">Rancang alur cerita</div>
          </button>

          <button
            onClick={() => setSelectedAction("conflict")}
            className={`p-3.5 rounded-2xl border-2 text-left transition space-y-1 cursor-pointer ${
              selectedAction === "conflict" ? "bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md" : `bg-slate-900 border-slate-800 text-white font-bold hover:border-slate-700`
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <div className="text-xs font-black">Konflik / Twist</div>
            <div className="text-[10px] opacity-90 font-medium">Cari kejutan plot</div>
          </button>

          <button
            onClick={() => setSelectedAction("dialogue")}
            className={`p-3.5 rounded-2xl border-2 text-left transition space-y-1 cursor-pointer ${
              selectedAction === "dialogue" ? "bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md" : `bg-slate-900 border-slate-800 text-white font-bold hover:border-slate-700`
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <div className="text-xs font-black">Draf Dialog</div>
            <div className="text-[10px] opacity-90 font-medium">Buat percakapan hidup</div>
          </button>

          <button
            onClick={() => setSelectedAction("custom")}
            className={`p-3.5 rounded-2xl border-2 text-left transition space-y-1 cursor-pointer ${
              selectedAction === "custom" ? "bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md" : `bg-slate-900 border-slate-800 text-white font-bold hover:border-slate-700`
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <div className="text-xs font-black">Diskusi Bebas</div>
            <div className="text-[10px] opacity-90 font-medium">Tanya apa saja</div>
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black block">
              {selectedAction === "outline" && "Premis / Sinopsis Cerita:"}
              {selectedAction === "conflict" && "Konteks Situasi Saat Ini:"}
              {selectedAction === "dialogue" && "Nama Karakter & Topik Perdebatan:"}
              {selectedAction === "custom" && "Instruksi Khusus untuk AI Gemini:"}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ketik ide atau instruksi Anda di sini..."
              rows={4}
              className={`w-full rounded-2xl p-4 text-xs font-medium focus:outline-none border-2 transition ${currentTheme.bgCard} ${currentTheme.border} focus:border-amber-400 resize-none font-sans`}
            />
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-[11px] ${currentTheme.textMuted} font-medium`}>
              Model: <strong className="text-amber-400">gemini-3.8-flash</strong> • Load Balancer Aktif
            </span>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-6 py-2.5 rounded-full transition shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim ke Gemini</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Response Box */}
        {(loading || response) && (
          <div className={`p-6 rounded-3xl border-2 ${currentTheme.border} ${currentTheme.bgCard} space-y-3 shadow-xl`}>
            <div className="flex items-center justify-between border-b pb-3 border-current/10">
              <span className="text-xs font-black flex items-center space-x-1.5 text-amber-500">
                <Sparkles className="w-4 h-4" />
                <span>Hasil Saran Asisten AI</span>
              </span>
              {lastMeta && (
                <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-black">
                  Key #{lastMeta.keyIndex} dari {lastMeta.totalKeys} Pool ({lastMeta.modelUsed || "gemini-3.8-flash"})
                </span>
              )}
            </div>

            <div className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-sans font-medium">
              {loading ? (
                <div className="flex items-center space-x-2 py-8 justify-center text-amber-500">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="font-bold">Gemini sedang merumuskan gagasan penulisan...</span>
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
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold">Pool Kunci API Gemini & Load Balancer</h3>
              </div>
              <button onClick={() => setShowApiKeyModal(false)} className="text-slate-400 hover:text-white font-black text-lg cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-medium">
              {/* Pool Active Status Box */}
              <div className="p-3 bg-slate-900 border-2 border-amber-500/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-amber-300 font-bold">
                  <div className="flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Multi-Key Pool Server Aktif ({poolInfo?.totalKeys || 0} Kunci)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-black border border-emerald-500/40">
                    Auto-Fallback 429
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-normal">
                  Sistem backend mendistribusikan beban secara acak / round-robin ke hingga <strong>5 Gemini API Keys</strong> di Cloudflare Variables & Secrets (<code className="text-amber-300">GEMINI_API_KEY_1</code> s.d. <code className="text-amber-300">GEMINI_API_KEY_5</code>). Jika satu kunci terkena batas kuota (HTTP 429), server otomatis melompat ke kunci berikutnya secara transparan.
                </p>

                {poolInfo?.keysMasked && poolInfo.keysMasked.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Daftar Kunci Terhubung:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {poolInfo.keysMasked.map((m, i) => (
                        <span key={i} className="text-[10px] font-mono bg-slate-950 border border-slate-700 px-2 py-0.5 rounded text-amber-200">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Key Option */}
              <div className="p-3 bg-slate-900 border-2 border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center space-x-1.5 font-bold text-amber-300">
                  <Info className="w-4 h-4 text-amber-400" />
                  <span>Opsi API Key Pribadi Penulis</span>
                </div>
                <p className="text-[11px] text-slate-300 font-normal">
                  Jika Anda ingin menyuntikkan API key pribadi Anda sendiri ke dalam antrean, masukkan di bawah ini. Kunci ini hanya disimpan di peramban Anda dan akan diprioritaskan pertama kali.
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
                        fetchPoolStatus("");
                        setShowApiKeyModal(false);
                      }}
                      className="text-xs text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
                    >
                      Hapus Custom Key (Pakai Pool Server)
                    </button>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Menggunakan Pool Server Otomatis</span>
                    </span>
                  )}

                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-full transition shadow-lg cursor-pointer"
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
