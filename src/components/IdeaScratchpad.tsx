import React, { useState } from "react";
import { Idea, Author } from "../types";
import { WriterTheme } from "../theme";
import { Lightbulb, Plus, Pin, Trash2 } from "lucide-react";

interface IdeaScratchpadProps {
  ideas: Idea[];
  authors: Author[];
  currentAuthor: Author;
  projectId: string;
  onAddIdea: (idea: Partial<Idea>) => void;
  onUpdateIdea: (id: string, updates: Partial<Idea>) => void;
  onDeleteIdea: (id: string) => void;
  currentTheme: WriterTheme;
}

export const IdeaScratchpad: React.FC<IdeaScratchpadProps> = ({
  ideas,
  authors,
  currentAuthor,
  projectId,
  onAddIdea,
  onUpdateIdea,
  onDeleteIdea,
  currentTheme,
}) => {
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<Idea["category"]>("Plot");
  const [filterCategory, setFilterCategory] = useState<string>("All");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddIdea({
      projectId,
      title: newTitle,
      content: newContent,
      category: newCategory,
      authorId: currentAuthor.id,
      pinned: false
    });
    setNewTitle("");
    setNewContent("");
  };

  const safeIdeas = Array.isArray(ideas) ? ideas : [];
  const safeAuthors = Array.isArray(authors) ? authors : [];
  const filteredIdeas = safeIdeas.filter(i => i && (filterCategory === "All" || i.category === filterCategory));
  const categories: Idea["category"][] = ["Plot", "Karakter", "Riset", "Dialog", "Lainnya"];

  const getAuthorName = (authorId: string) => {
    const auth = safeAuthors.find(a => a && a.id === authorId);
    return auth ? auth.name : "Penulis Studio";
  };

  return (
    <div className={`flex-1 ${currentTheme.bgMain} ${currentTheme.textMain} p-6 overflow-y-auto transition-colors duration-300 min-h-[calc(100vh-5rem)]`}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 ${currentTheme.border} pb-4`}>
          <div>
            <h1 className="text-xl font-black flex items-center space-x-2">
              <Lightbulb className="w-6 h-6 text-amber-500" />
              <span>Papan Gagasan Studio (Scratchpad)</span>
            </h1>
            <p className={`text-xs ${currentTheme.textMuted} font-medium mt-1`}>
              Ruang bebas bagi Anda dan tim penulis studio untuk menuangkan coretan ide, alur cerita, dan riset bersama.
            </p>
          </div>

          {/* High Contrast Category Filter */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 md:pb-0">
            <button
              onClick={() => setFilterCategory("All")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black transition border-2 ${
                filterCategory === "All"
                  ? "bg-amber-400 text-slate-950 border-amber-300 shadow-md"
                  : `bg-slate-900 text-white border-slate-700 hover:bg-slate-800`
              }`}
            >
              Semua ({ideas.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black transition whitespace-nowrap border-2 ${
                  filterCategory === cat
                    ? "bg-amber-400 text-slate-950 border-amber-300 shadow-md"
                    : `bg-slate-900 text-white border-slate-700 hover:bg-slate-800`
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Add Idea Form */}
        <form onSubmit={handleCreate} className={`${currentTheme.bgCard} border-2 ${currentTheme.border} rounded-2xl p-5 shadow-lg space-y-3`}>
          <div className="text-xs font-black flex items-center space-x-1.5">
            <Plus className="w-4 h-4 text-amber-500 stroke-[3]" />
            <span>Tambah Catatan Gagasan Baru</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Judul gagasan (mis. Latar Belakang Tokoh...)"
              className={`border-2 ${currentTheme.border} ${currentTheme.bgMain} ${currentTheme.textMain} font-bold rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400`}
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              className={`border-2 ${currentTheme.border} bg-slate-900 text-white font-extrabold rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400`}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-4 py-2 rounded-xl transition shadow-md hover:scale-102"
            >
              Simpan ke Papan Ide
            </button>
          </div>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Tulis detail gagasan, dialog singkat, atau poin sketsa di sini..."
            className={`w-full border-2 ${currentTheme.border} ${currentTheme.bgMain} ${currentTheme.textMain} font-medium rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none h-20`}
          />
        </form>

        {/* Ideas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIdeas.map((idea) => (
            <div
              key={idea.id}
              className={`${currentTheme.bgCard} border-2 ${currentTheme.border} rounded-2xl p-4 flex flex-col justify-between transition relative group shadow-sm hover:shadow-md ${
                idea.pinned ? "ring-2 ring-amber-400 shadow-md" : ""
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                      {idea.category}
                    </span>
                    <span className={`text-[10px] font-bold ${currentTheme.textMuted}`}>Oleh {getAuthorName(idea.authorId)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onUpdateIdea(idea.id, { pinned: !idea.pinned })}
                      className={`p-1 rounded transition ${idea.pinned ? "text-amber-500" : "text-slate-400 hover:text-slate-600"}`}
                      title={idea.pinned ? "Lepas Pin" : "Pin Ide"}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteIdea(idea.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition"
                      title="Hapus Ide"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-extrabold">{idea.title}</h3>
                <p className={`text-xs ${currentTheme.textMain} font-medium whitespace-pre-wrap leading-relaxed opacity-95`}>
                  {idea.content || "(Tidak ada catatan tambahan)"}
                </p>
              </div>

              <div className={`mt-4 pt-3 border-t-2 ${currentTheme.border} flex items-center justify-between text-[10px] ${currentTheme.textMuted} font-bold`}>
                <span>{new Date(idea.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}

          {filteredIdeas.length === 0 && (
            <div className={`col-span-full py-12 text-center ${currentTheme.textMuted} font-bold`}>
              Belum ada gagasan dalam kategori ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
