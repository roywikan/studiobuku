import React, { useState } from "react";
import { Chapter, Project } from "../types";
import { Globe, BookOpen, ExternalLink, Copy, Check, X } from "lucide-react";
import { getPublicProjectUrl, getPublicChapterUrl } from "../utils/exportHelpers";

interface PublicPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  chapters?: Chapter[];
  currentChapterId?: string;
}

export const PublicPreviewModal: React.FC<PublicPreviewModalProps> = ({
  isOpen,
  onClose,
  project,
  chapters = [],
  currentChapterId
}) => {
  const [copiedType, setCopiedType] = useState<"chapter" | "project" | null>(null);

  if (!isOpen) return null;

  const currentChapter = chapters.find(c => c.id === currentChapterId) || chapters[0];
  const projectPublicUrl = getPublicProjectUrl(project.title);
  const chapterPublicUrl = currentChapter
    ? getPublicChapterUrl(project.title, currentChapter.title)
    : projectPublicUrl;

  const handleCopy = (url: string, type: "chapter" | "project") => {
    navigator.clipboard.writeText(url);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-950 border-2 border-emerald-500/50 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-white animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-extrabold">Preview & Link Reader HTML Publik</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-black text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Tautan HTML Publik domain resmi <strong>studio.buku.biz.id</strong> dirancang khusus untuk pembaca, rekan editor, penerbit, donatur, dan mesin pencari (SEO & Googlebot).
        </p>

        <div className="space-y-4">
          {/* Link 1: Single Chapter Reader */}
          {currentChapter && (
            <div className="p-4 bg-slate-900 border-2 border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300 flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>1. Reader HTML Per Bab ({currentChapter.title})</span>
                </span>
                <a
                  href={chapterPublicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-400 hover:underline"
                >
                  <span>Buka Reader</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={chapterPublicUrl}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono select-all"
                />
                <button
                  onClick={() => handleCopy(chapterPublicUrl, "chapter")}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-lg transition shadow flex items-center space-x-1 cursor-pointer"
                >
                  {copiedType === "chapter" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === "chapter" ? "Tersalin!" : "Salin Link"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Link 2: Full Project Reader */}
          <div className="p-4 bg-slate-900 border-2 border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-400 flex items-center space-x-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>2. Reader HTML Naskah Utuh Proyek ({project.title})</span>
              </span>
              <a
                href={projectPublicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-400 hover:underline"
              >
                <span>Buka Naskah Utuh</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={projectPublicUrl}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono select-all"
              />
              <button
                onClick={() => handleCopy(projectPublicUrl, "project")}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black rounded-lg transition shadow flex items-center space-x-1 cursor-pointer"
              >
                {copiedType === "project" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === "project" ? "Tersalin!" : "Salin Link"}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-700 text-xs font-bold rounded-full transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
