import React from "react";
import { Helmet } from "react-helmet-async";
import { Heart, CheckCircle2, ShieldCheck, ArrowLeft, Sparkles, LogIn } from "lucide-react";

interface PricingViewProps {
  onBack?: () => void;
  onOpenLogin?: () => void;
}

export const PricingView: React.FC<PricingViewProps> = ({ onBack, onOpenLogin }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
      <Helmet>
        <title>Biaya & Wadah Dukungan Sukarela - Studio Buku</title>
        <meta name="description" content="Studio Buku 100% gratis untuk seluruh penulis dan pembaca. Dukung operasional server dan infrastruktur penulisan naskah kolaboratif di Indonesia." />
        <meta property="og:title" content="Biaya & Dukungan - Studio Buku" />
        <meta property="og:description" content="Studio Buku 100% gratis untuk seluruh penulis dan pembaca di Indonesia." />
        <meta property="og:url" content="https://studio.buku.biz.id/pricing" />
        <link rel="canonical" href="https://studio.buku.biz.id/pricing" />
      </Helmet>
      
      {/* NORMAL FRONTPAGE HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <a href="/" className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight hover:text-amber-600 transition">
            Studio Buku
          </a>

          <div className="flex items-center space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>
            )}

            <button
              onClick={onOpenLogin}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-5 py-2 rounded-full text-xs transition shadow-sm flex items-center space-x-1.5 cursor-pointer transform active:scale-95"
            >
              <LogIn className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-4xl mx-auto w-full px-4 py-10 sm:py-14 space-y-10 flex-1">
        
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 bg-amber-50 border border-amber-200 text-amber-800 px-3.5 py-1 rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Transparansi Biaya & Wadah Dukungan Komunitas</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            100% Gratis Untuk Penulis & Pembaca
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-medium">
            Studio Buku dibangun untuk mendukung ekosistem penulisan buku kolaboratif (*co-authorship*) di Indonesia tanpa memungut biaya pendaftaran maupun langganan.
          </p>
        </div>

        {/* PRICING & DONATION GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* FREE ACCESS CARD */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-sm hover:shadow-md transition">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Akses Utama
                </span>
                <span className="text-2xl font-black text-emerald-600">Rp 0</span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">Akses Penulis & Pembaca</h2>
                <p className="text-xs text-slate-500 mt-1">Gratis selamanya tanpa batasan proyek naskah.</p>
              </div>

              <div className="space-y-3 pt-2 text-xs text-slate-700 font-medium">
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Membuat proyek naskah buku kolaboratif (*co-authorship*) tanpa batas</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Editor bab dengan fitur autosave instan & log revisi</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Papan ide (*scratchpad*) & glosarium istilah dunia naskah</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Publikasi otomatis ke Galeri Naskah Publik & halaman baca HTML</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Integrasi Asisten AI untuk membantu riset & penyuntingan</span>
                </div>
              </div>
            </div>

            <a
              href="/"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-2xl text-xs transition text-center shadow-sm block"
            >
              Mulai Menulis Gratis
            </a>
          </div>

          {/* DONATION CARD */}
          <div className="bg-white border-2 border-amber-300 rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1">
                  <Heart className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>Dukungan Sukarela</span>
                </span>
                <span className="text-xs font-bold text-amber-700">Gotong Royong</span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">Donasi Operational Server</h2>
                <p className="text-xs text-slate-600 mt-1">
                  Membantu pemeliharaan database, server, domain, dan infrastruktur gratis bagi para penulis.
                </p>
              </div>

              {/* QRIS preview */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 text-center">
                <p className="text-xs font-bold text-slate-800">Scan QRIS (DANA / ShopeePay / GoPay / OVO / BCA / Mandiri)</p>
                <div className="flex justify-center">
                  <img
                    src="/QRIS-DANA.jpeg"
                    alt="QRIS Donasi Studio Buku"
                    className="w-44 h-auto rounded-xl border border-slate-300 shadow-sm object-contain bg-white p-1"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="text-center space-y-1">
              <p className="text-xs text-slate-600 font-medium">
                Dukungan dari Anda sangat berarti untuk menjaga wadah penulisan ini tetap bebas dan terbuka untuk siapa saja.
              </p>
            </div>
          </div>

        </div>

        {/* FAQ SECTION */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <span>Pertanyaan Umum Tentang Biaya</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 leading-relaxed">
            <div>
              <p className="font-bold text-slate-900 mb-1">Apakah ada biaya tersembunyi setelah naskah selesai?</p>
              <p>Tidak ada. Naskah Anda sepenuhnya milik Anda. Anda bebas mengunduh, mengekspor, atau mempublikasikan buku Anda kapan saja.</p>
            </div>
            <div>
              <p className="font-bold text-slate-900 mb-1">Bagaimana jika saya tidak memberikan donasi?</p>
              <p>Layanan tetap 100% aktif dan dapat digunakan tanpa pembatasan fitur apapun. Donasi bersifat murni sukarela.</p>
            </div>
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 space-y-3 font-sans">
        <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600 font-medium">
          <a href="/terms" className="hover:text-amber-600 transition">Syarat & Ketentuan</a>
          <span>•</span>
          <a href="/privacy" className="hover:text-amber-600 transition">Kebijakan Privasi</a>
          <span>•</span>
          <a href="/pricing" className="hover:text-amber-600 transition">Biaya & Donasi</a>
        </div>
        <p className="font-semibold text-slate-700">Studio Buku • Hak Cipta 2026 Studio.Buku.Biz.ID</p>
        <p className="text-[11px] text-slate-400">Platform Penulisan Buku Kolaboratif Indonesia</p>
      </footer>

    </div>
  );
};
