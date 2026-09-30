import React, { useState } from "react";
import { Share2, Copy, Check, Users } from "lucide-react";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, projectName }) => {
  const [copied, setCopied] = useState(false);
  const inviteLink = `${window.location.origin}/?invite=collab_${Math.random().toString(36).substring(7)}`;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-950 border-2 border-amber-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-white">
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black">Undang Penulis Studio & Rekan Menulis</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm font-black">✕</button>
        </div>

        <p className="text-xs text-slate-300 font-medium leading-relaxed">
          Bagikan tautan undangan ini kepada rekan penulis Anda untuk berkolaborasi secara real-time pada proyek <strong>{projectName}</strong>.
        </p>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">Tautan Akses Kolaborasi Studio</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 bg-slate-900 border-2 border-slate-700 rounded-xl px-3.5 py-2 text-xs text-amber-300 font-mono font-bold select-all"
            />
            <button
              onClick={handleCopy}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-1 shrink-0 shadow-md"
            >
              {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4 stroke-[3]" />}
              <span>{copied ? "Disalin!" : "Salin"}</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-900 p-3.5 rounded-xl border-2 border-slate-800 text-[11px] text-slate-300 space-y-1">
          <div className="font-black text-amber-300 flex items-center space-x-1.5">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Izin Akses Studio:</span>
          </div>
          <p className="font-medium">Penulis yang memiliki tautan ini dapat membaca, menyunting bab, menambahkan ide, dan melihat riwayat revisi bersama.</p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-700 text-xs font-bold rounded-full transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
