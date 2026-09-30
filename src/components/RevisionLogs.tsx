import React from "react";
import { RevisionLog } from "../types";
import { WriterTheme } from "../theme";
import { History, FileText, User, Clock } from "lucide-react";

interface RevisionLogsProps {
  logs: RevisionLog[];
  currentTheme: WriterTheme;
}

export const RevisionLogs: React.FC<RevisionLogsProps> = ({ logs, currentTheme }) => {
  return (
    <div className={`flex-1 ${currentTheme.bgMain} ${currentTheme.textMain} p-6 overflow-y-auto transition-colors duration-300 min-h-[calc(100vh-5rem)]`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className={`border-b-2 ${currentTheme.border} pb-4`}>
          <h1 className="text-xl font-black flex items-center space-x-2">
            <History className="w-6 h-6 text-amber-500" />
            <span>Log Revisi & Aktivitas Studio</span>
          </h1>
          <p className={`text-xs ${currentTheme.textMuted} font-medium mt-1`}>
            Riwayat aktivitas penulisan, penyuntingan bab, dan pembaruan naskah yang dilakukan oleh tim Studio Buku.
          </p>
        </div>

        <div className="space-y-3">
          {logs.map((log) => {
            const timeAgo = new Date(log.timestamp).toLocaleString("id-ID", {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={log.id}
                className={`${currentTheme.bgCard} border-2 ${currentTheme.border} rounded-2xl p-4 flex items-start space-x-4 shadow-sm transition`}
              >
                <div className="p-2.5 rounded-xl bg-amber-400 text-slate-950 font-black shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black">{log.chapterTitle || "Proyek Naskah"}</h3>
                    <span className={`text-[11px] ${currentTheme.textMuted} font-mono font-bold flex items-center space-x-1`}>
                      <Clock className="w-3 h-3" />
                      <span>{timeAgo}</span>
                    </span>
                  </div>
                  <p className={`text-xs ${currentTheme.textMain} font-medium`}>{log.action}</p>
                  <div className="flex items-center space-x-2 pt-1 text-[11px]">
                    <span className="flex items-center space-x-1 bg-slate-900 text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                      <User className="w-3 h-3 text-amber-400" />
                      <span>{log.authorName}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {logs.length === 0 && (
            <div className={`py-12 text-center ${currentTheme.textMuted} font-bold`}>
              Belum ada log revisi tercatat.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
