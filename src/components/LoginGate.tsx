import React, { useState, useEffect } from "react";
import { StudioBukuLogo } from "./StudioBukuLogo";
import { Lock, LogIn, Key, User, ShieldCheck, Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";

export interface UserSession {
  email: string;
  name: string;
  avatar: string;
  authMethod: "google" | "password";
  loginTime: string;
}

interface LoginGateProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginGate: React.FC<LoginGateProps> = ({ onLoginSuccess }) => {
  const [activeMode, setActiveTab] = useState<"google" | "password">("google");
  
  // Password Mode Form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Listen to Firebase Auth state changes automatically
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const session: UserSession = {
          email: user.email || "penulis@gmail.com",
          name: user.displayName || user.email?.split("@")[0] || "Penulis Google",
          avatar: user.photoURL || "👨‍💻",
          authMethod: "google",
          loginTime: new Date().toLocaleTimeString("id-ID")
        };
        onLoginSuccess(session);
      }
    });
    return () => unsubscribe();
  }, [onLoginSuccess]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg("Harap isi username dan password.");
      return;
    }

    const session: UserSession = {
      email: `${username.toLowerCase().replace(/\s+/g, ".")}@studiobuku.com`,
      name: username.trim(),
      avatar: "✍️",
      authMethod: "password",
      loginTime: new Date().toLocaleTimeString("id-ID")
    };

    onLoginSuccess(session);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg("");
    setUnauthorizedDomain(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const session: UserSession = {
        email: user.email || "penulis@gmail.com",
        name: user.displayName || user.email?.split("@")[0] || "Penulis Google",
        avatar: user.photoURL || "👨‍💻",
        authMethod: "google",
        loginTime: new Date().toLocaleTimeString("id-ID")
      };

      onLoginSuccess(session);
    } catch (err: any) {
      console.error("Firebase Google Sign-In error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setErrorMsg("Jendela masuk Google ditutup sebelum selesai.");
      } else if (err.code === "auth/popup-blocked") {
        setErrorMsg("Popup diblokir browser. Harap izinkan popup untuk studio ini.");
      } else if (err.code === "auth/unauthorized-domain") {
        const currentDomain = window.location.hostname;
        setUnauthorizedDomain(currentDomain);
        setErrorMsg(`Domain '${currentDomain}' belum didaftarkan di Firebase Authorized Domains.`);
      } else {
        setErrorMsg(err.message || "Gagal masuk dengan Akun Google.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-50 flex items-center justify-center p-4 font-sans select-none text-white">
      <div className="max-w-md w-full bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Glow Accent Header */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-2 relative z-10">
          <div className="inline-flex items-center justify-center p-3 bg-amber-400/10 rounded-2xl border border-amber-400/30 mb-2">
            <StudioBukuLogo tagline="Studio Penulisan Terotentikasi" />
          </div>
          <h2 className="text-xl font-black text-amber-300 flex items-center justify-center space-x-2">
            <Lock className="w-5 h-5 text-amber-400" />
            <span>Akses Terproteksi Studio Buku</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-sm mx-auto font-medium">
            Masuk dengan Akun Google Firebase Auth atau Sandi Penulis untuk mengakses ruang kerja naskah Anda.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-black">
          <button
            onClick={() => setActiveTab("google")}
            className={`py-2.5 rounded-xl transition flex items-center justify-center space-x-2 ${
              activeMode === "google"
                ? "bg-amber-400 text-slate-950 shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Google Auth</span>
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`py-2.5 rounded-xl transition flex items-center justify-center space-x-2 ${
              activeMode === "password"
                ? "bg-amber-400 text-slate-950 shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Password / PIN</span>
          </button>
        </div>

        {unauthorizedDomain && (
          <div className="bg-amber-500/10 border-2 border-amber-500/50 rounded-2xl p-4 text-xs space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center space-x-2 text-amber-300 font-extrabold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span>Satu Langkah Tambahan untuk Domain Custom</span>
            </div>
            <p className="text-slate-200 leading-relaxed text-[11px]">
              Firebase Auth mewajibkan daftar <strong className="text-amber-300">Authorized Domains</strong> untuk alasan keamanan domain kustom.
            </p>
            <div className="bg-slate-950/80 p-2.5 rounded-xl font-mono text-[11px] text-amber-400 border border-slate-800 break-all">
              Domain Anda: <strong>{unauthorizedDomain}</strong>
            </div>
            <p className="text-slate-300 text-[11px]">
              Silakan tambahkan domain <code className="text-amber-300">studio.buku.biz.id</code> dan <code className="text-amber-300">studiobuku.pages.dev</code> ke daftar Authorized Domains pada:
            </p>
            <a
              href="https://console.firebase.google.com/project/gen-lang-client-0987418952/authentication/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs transition shadow-md w-full justify-center"
            >
              <span>Buka Firebase Auth Settings</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => setActiveTab("password")}
                className="text-[11px] text-amber-300 hover:underline font-bold"
              >
                👉 Atau gunakan Mode Password / PIN sekarang
              </button>
            </div>
          </div>
        )}

        {errorMsg && !unauthorizedDomain && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded-xl text-xs font-bold leading-relaxed">
            {errorMsg}
          </div>
        )}

        {/* Google OAuth Mode */}
        {activeMode === "google" && (
          <div className="space-y-4 pt-1">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-white hover:bg-slate-100 disabled:bg-slate-300 text-slate-900 font-black py-3 px-4 rounded-2xl flex items-center justify-center space-x-3 transition shadow-xl transform active:scale-95 border-2 border-slate-200"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span className="text-xs">
                {isLoading ? "Menghubungkan ke Google..." : "Masuk Otentik dengan Akun Google"}
              </span>
            </button>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-[11px] text-slate-300 space-y-1.5">
              <div className="font-extrabold text-amber-300 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Otentikasi Resmi Firebase Auth:</span>
              </div>
              <p className="leading-relaxed opacity-90">
                Setiap kali Anda menekan tombol di atas, popup otentikasi Google akan muncul dan meminta Anda memilih akun Gmail Anda sendiri secara langsung.
              </p>
            </div>
          </div>
        )}

        {/* Password / Username Form Mode */}
        {activeMode === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-black text-amber-300 mb-1">Username / Nama Penulis:</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Misal: Penulis Sukses"
                  className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-amber-300 mb-1">Sandi / PIN Studio Rahasia:</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password atau PIN anda"
                  className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center space-x-2 transition shadow-xl mt-2"
            >
              <LogIn className="w-4 h-4 text-slate-950" />
              <span>Masuk Ke Studio Penulisan</span>
            </button>
          </form>
        )}

        <div className="pt-2 text-center border-t border-slate-800 text-[10px] text-slate-400">
          Studio Buku (Nulis Bareng Studio) • Tampilan Reader Publik tetap aman & Read-Only.
        </div>
      </div>
    </div>
  );
};
