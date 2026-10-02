import React, { useState } from "react";
import { Chapter, Project, Annotation, Author } from "../types";
import { WriterTheme } from "../theme";
import { BookOpen, Download, Printer, ChevronLeft, ChevronRight, FileDown, FileText, MessageSquarePlus, CheckCircle, Trash2, BookMarked, Globe, ExternalLink, Copy, Check } from "lucide-react";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak } from "docx";

interface BookVisualizerProps {
  project: Project;
  chapters: Chapter[];
  annotations: Annotation[];
  currentAuthor: Author;
  onAddAnnotation: (ann: Partial<Annotation>) => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  currentTheme: WriterTheme;
}

export const BookVisualizer: React.FC<BookVisualizerProps> = ({
  project,
  chapters,
  annotations,
  currentAuthor,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  currentTheme,
}) => {
  const [viewMode, setViewMode] = useState<"paged" | "continuous">("continuous");
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [newAnnText, setNewAnnText] = useState<{ [chapterId: string]: string }>({});
  const [showAnnotationsPanel, setShowAnnotationsPanel] = useState(true);

  // Public Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [copiedType, setCopiedType] = useState<"chapter" | "project" | null>(null);

  const safeChapters = Array.isArray(chapters) ? chapters : [];
  const safeAnnotations = Array.isArray(annotations) ? annotations : [];

  const authorCopyrightText = `Hak cipta milik : ${currentAuthor?.name || "masing masing user penulisnya"}, Nulis Buku Bareng di https://Studio.Buku.Biz.ID`;

  const totalWords = safeChapters.reduce((acc, c) => acc + (c.content ? c.content.split(/\s+/).filter(Boolean).length : 0), 0);
  const currentChapter = safeChapters[activeChapterIndex] || safeChapters[0];

  const slugify = (text: string) => {
    return (text || "")
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "naskah";
  };

  const PUBLIC_DOMAIN = "https://studio.buku.biz.id";
  const projSlug = slugify(project.title);
  const chapSlug = currentChapter ? slugify(currentChapter.title) : "bab-1";

  const chapterPublicUrl = `${PUBLIC_DOMAIN}/p/${projSlug}/${chapSlug}`;
  const projectPublicUrl = `${PUBLIC_DOMAIN}/p/${projSlug}`;

  const handleCopy = (url: string, type: "chapter" | "project") => {
    navigator.clipboard.writeText(url);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Export TXT
  const handleExportTxt = () => {
    let fullText = `${project.title.toUpperCase()}\n${project.subtitle}\nGenre: ${project.genre}\n${authorCopyrightText}\n\nSINOPSIS:\n${project.synopsis}\n\n=====================\n\n`;
    chapters.forEach((ch, idx) => {
      fullText += `\n\n--- BAB ${idx + 1}: ${ch.title} ---\n${ch.subtitle || ""}\n\n${ch.content}\n\n`;
    });
    const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, "_")}_naskah.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Professional DOCX Exporter
  const handleExportDocx = async () => {
    try {
      const docChildren: Paragraph[] = [];

      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 300, after: 200 },
          children: [
            new TextRun({
              text: "STUDIO BUKU • NASKAH SIAP EDIT & PUBLIKASI",
              bold: true,
              size: 18,
              color: "D97706",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 150 },
          children: [
            new TextRun({
              text: project.title,
              bold: true,
              size: 44,
              color: "111827",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: authorCopyrightText,
              italics: true,
              size: 18,
              color: "4B5563",
            }),
          ],
        })
      );

      if (project.subtitle) {
        docChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: project.subtitle,
                italics: true,
                size: 24,
                color: "4B5563",
              }),
            ],
          })
        );
      }

      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({
              text: `Genre: ${project.genre}   |   Total Kata: ${totalWords.toLocaleString("id-ID")}   |   Jumlah: ${chapters.length} Bab`,
              bold: true,
              size: 20,
              color: "374151",
            }),
          ],
        })
      );

      if (project.synopsis) {
        docChildren.push(
          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: "SINOPSIS PROYEK:",
                bold: true,
                size: 22,
                color: "1F2937",
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 500 },
            children: [
              new TextRun({
                text: project.synopsis,
                size: 22,
                color: "374151",
              }),
            ],
          })
        );
      }

      docChildren.push(new Paragraph({ children: [new PageBreak()] }));

      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 300 },
          children: [
            new TextRun({
              text: "DAFTAR ISI",
              bold: true,
              size: 28,
              color: "111827",
            }),
          ],
        })
      );

      chapters.forEach((ch, idx) => {
        docChildren.push(
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: `Bab ${idx + 1}: ${ch.title}`,
                bold: true,
                size: 22,
                color: "1F2937",
              }),
              ...(ch.subtitle
                ? [
                    new TextRun({
                      text: ` — ${ch.subtitle}`,
                      italics: true,
                      size: 20,
                      color: "6B7280",
                    }),
                  ]
                : []),
            ],
          })
        );
      });

      docChildren.push(new Paragraph({ children: [new PageBreak()] }));

      chapters.forEach((ch, idx) => {
        docChildren.push(
          new Paragraph({
            spacing: { before: 400, after: 100 },
            children: [
              new TextRun({
                text: `BAB ${idx + 1}`,
                bold: true,
                size: 20,
                color: "D97706",
              }),
            ],
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: ch.title,
                bold: true,
                size: 32,
                color: "111827",
              }),
            ],
          })
        );

        if (ch.subtitle) {
          docChildren.push(
            new Paragraph({
              spacing: { after: 300 },
              children: [
                new TextRun({
                  text: ch.subtitle,
                  italics: true,
                  size: 22,
                  color: "4B5563",
                }),
              ],
            })
          );
        }

        const paragraphs = (ch.content || "(Bab ini masih kosong)").split("\n");
        paragraphs.forEach((pText) => {
          const trimmed = pText.trim();
          if (trimmed) {
            docChildren.push(
              new Paragraph({
                spacing: { after: 200, line: 360 },
                indent: { firstLine: 400 },
                children: [
                  new TextRun({
                    text: trimmed,
                    size: 24,
                    color: "111827",
                  }),
                ],
              })
            );
          }
        });

        if (idx < chapters.length - 1) {
          docChildren.push(new Paragraph({ children: [new PageBreak()] }));
        }
      });

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: docChildren,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title.toLowerCase().replace(/\s+/g, "_")}_naskah_editor.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate DOCX:", err);
      alert("Gagal mengekspor naskah ke Word (.docx). Silakan coba lagi.");
    }
  };

  // PDF Exporter
  const handleExportPdf = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    const bottomLimit = pageHeight - margin - 12;

    const chapterPageMap: { [key: number]: number } = {};

    let y = 35;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(180, 130, 20);
    doc.text("STUDIO BUKU • NASKAH SIAP CETAK", pageWidth / 2, y, { align: "center" });
    y += 12;

    doc.setDrawColor(220, 160, 40);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);
    y += 18;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(20, 20, 20);
    const titleLines = doc.splitTextToSize(project.title, contentWidth);
    doc.text(titleLines, pageWidth / 2, y, { align: "center" });
    y += (titleLines.length * 10) + 4;

    if (project.subtitle) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      const subLines = doc.splitTextToSize(project.subtitle, contentWidth);
      doc.text(subLines, pageWidth / 2, y, { align: "center" });
      y += (subLines.length * 6) + 10;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(`Genre: ${project.genre}   |   Total Kata: ${totalWords.toLocaleString("id-ID")}   |   Jumlah: ${chapters.length} Bab`, pageWidth / 2, y, { align: "center" });
    y += 18;

    if (project.synopsis) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      doc.text("Sinopsis Proyek:", margin, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const synLines = doc.splitTextToSize(project.synopsis, contentWidth - 10);
      
      const boxHeight = (synLines.length * 5) + 8;
      doc.setFillColor(248, 246, 240);
      doc.setDrawColor(220, 210, 190);
      doc.roundedRect(margin, y - 4, contentWidth, boxHeight, 3, 3, "FD");
      
      doc.text(synLines, margin + 5, y + 2);
      y += boxHeight + 15;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text(authorCopyrightText, pageWidth / 2, 275, { align: "center" });

    doc.addPage();
    let currentPage = 2;
    const tocStartPage = 2;
    
    y = 25;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(30, 30, 30);
    doc.text("DAFTAR ISI", margin, y);
    y += 8;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;

    chapters.forEach((ch, idx) => {
      doc.addPage();
      currentPage++;
      chapterPageMap[idx] = currentPage;

      y = 25;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(180, 130, 20);
      doc.text(`BAB ${idx + 1}`, margin, y);
      y += 7;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(20, 20, 20);
      const chapTitleLines = doc.splitTextToSize(ch.title, contentWidth);
      doc.text(chapTitleLines, margin, y);
      y += (chapTitleLines.length * 8) + 2;

      if (ch.subtitle) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(11);
        doc.setTextColor(90, 90, 90);
        const subLines = doc.splitTextToSize(ch.subtitle, contentWidth);
        doc.text(subLines, margin, y);
        y += (subLines.length * 6) + 4;
      }

      doc.setDrawColor(230, 220, 200);
      doc.setLineWidth(0.4);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(35, 35, 35);

      const paragraphs = (ch.content || "(Bab ini masih kosong)").split("\n");

      for (let p = 0; p < paragraphs.length; p++) {
        const pText = paragraphs[p].trim();
        if (!pText) {
          y += 4;
          continue;
        }

        const pLines = doc.splitTextToSize(pText, contentWidth);
        for (let l = 0; l < pLines.length; l++) {
          if (y > bottomLimit) {
            doc.addPage();
            currentPage++;
            y = 25;
          }
          doc.text(pLines[l], margin, y);
          y += 5.5;
        }
        y += 3;
      }
    });

    doc.setPage(tocStartPage);
    y = 45;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);

    chapters.forEach((ch, idx) => {
      const pageNum = chapterPageMap[idx] || (idx + 3);
      const entryTitle = `Bab ${idx + 1}: ${ch.title}`;
      const pageStr = `${pageNum}`;

      doc.setFont("helvetica", "bold");
      doc.text(entryTitle, margin, y);

      doc.setFont("helvetica", "normal");
      doc.text(pageStr, pageWidth - margin, y, { align: "right" });

      const titleWidth = doc.getTextWidth(entryTitle);
      const pageStrWidth = doc.getTextWidth(pageStr);
      const dotStartX = margin + titleWidth + 3;
      const dotEndX = pageWidth - margin - pageStrWidth - 3;

      if (dotEndX > dotStartX) {
        doc.setDrawColor(180, 180, 180);
        doc.setLineDashPattern([0.8, 1.5], 0);
        doc.line(dotStartX, y - 1, dotEndX, y - 1);
        doc.setLineDashPattern([], 0);
      }

      y += 9;
    });

    const totalPages = doc.getNumberOfPages();
    for (let p = 3; p <= totalPages; p++) {
      doc.setPage(p);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text(`Studio Buku  •  ${project.title}`, margin, 12);
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.3);
      doc.line(margin, 14, pageWidth - margin, 14);

      doc.text(`${authorCopyrightText}  •  Halaman ${p} dari ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: "center" });
    }

    doc.save(`${project.title.toLowerCase().replace(/\s+/g, "_")}_naskah_studio_buku.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddAnnotation = (chapterId: string, chapterTitle: string) => {
    const text = newAnnText[chapterId];
    if (!text || !text.trim()) return;
    onAddAnnotation({
      projectId: project.id,
      chapterId,
      chapterTitle,
      text: text.trim(),
      authorName: currentAuthor.name,
    });
    setNewAnnText({ ...newAnnText, [chapterId]: "" });
  };

  return (
    <div className={`flex-1 flex flex-col h-[calc(100vh-5rem)] overflow-y-auto transition-colors duration-300 ${currentTheme.bgMain} ${currentTheme.textMain}`}>
      {/* Top Control Bar */}
      <div className={`sticky top-0 z-20 px-6 py-3.5 border-b-2 ${currentTheme.border} ${currentTheme.bgCard} flex flex-wrap items-center justify-between gap-4 shadow-md`}>
        <div className="flex items-center space-x-3">
          <BookOpen className="w-5 h-5 text-amber-500" />
          <h2 className="text-sm font-black truncate max-w-xs">{project.title} • Pratinjau Studio</h2>
          <span className="text-xs px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black hidden sm:inline shadow-sm">
            {totalWords} Kata ({chapters.length} Bab)
          </span>
        </div>

        <div className="flex flex-wrap items-center space-x-2.5 gap-y-2">
          {/* View Mode Switcher */}
          <div className="flex items-center space-x-1 border-2 border-slate-700 bg-slate-900 p-1 rounded-full text-xs">
            <button
              onClick={() => setViewMode("continuous")}
              className={`px-3 py-1 rounded-full transition font-extrabold ${viewMode === "continuous" ? "bg-amber-400 text-slate-950" : "text-white"}`}
            >
              Gulir Total
            </button>
            <button
              onClick={() => setViewMode("paged")}
              className={`px-3 py-1 rounded-full transition font-extrabold ${viewMode === "paged" ? "bg-amber-400 text-slate-950" : "text-white"}`}
            >
              Per Bab
            </button>
          </div>

          <button
            onClick={() => setShowAnnotationsPanel(!showAnnotationsPanel)}
            className={`inline-flex items-center space-x-1.5 text-xs px-3.5 py-1.5 rounded-full transition border-2 font-black shadow-sm ${
              showAnnotationsPanel ? "bg-amber-400 text-slate-950 border-amber-300" : "bg-slate-900 text-white border-slate-700"
            }`}
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>Anotasi ({annotations.filter(a => !a.resolved).length})</span>
          </button>

          {/* High Contrast Share Public Reader HTML Preview Button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 rounded-full transition shadow-lg font-black transform hover:scale-105 ring-2 ring-emerald-400/50"
            title="Bagikan Link Reader HTML Publik untuk Pembaca / Editor Eksternal"
          >
            <Globe className="w-4 h-4 stroke-[3]" />
            <span>Preview HTML Publik</span>
          </button>

          {/* Ekspor DOCX Button */}
          <button
            onClick={handleExportDocx}
            className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-full transition shadow-lg font-black transform hover:scale-105 ring-2 ring-blue-400/50"
            title="Ekspor & Unduh Naskah Format Word (.docx) untuk Editor/Penerbit"
          >
            <FileText className="w-4 h-4 stroke-[3]" />
            <span>Ekspor Word (.docx)</span>
          </button>

          {/* Ekspor PDF Button */}
          <button
            onClick={handleExportPdf}
            className="inline-flex items-center space-x-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs px-4 py-2 rounded-full transition shadow-lg font-black transform hover:scale-105 ring-2 ring-amber-300/50"
            title="Ekspor & Unduh Naskah Buku Siap Cetak (Format PDF)"
          >
            <FileDown className="w-4 h-4 stroke-[3]" />
            <span>Ekspor PDF</span>
          </button>

          {/* Export TXT Button */}
          <button
            onClick={handleExportTxt}
            className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-700 text-xs px-3.5 py-2 rounded-full transition shadow-md font-bold"
            title="Unduh Teks Polos (.txt)"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">TXT</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1 bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-700 text-xs px-3 py-2 rounded-full transition"
            title="Cetak Naskah"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Manuscript Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 md:p-12">
          <div className={`max-w-4xl mx-auto p-8 md:p-16 rounded-3xl shadow-xl border-2 ${currentTheme.border} ${currentTheme.previewPaperBg} ${currentTheme.previewPaperText} transition-all duration-300 font-serif`}>
            
            {/* Book Cover Header */}
            <div className="text-center space-y-4 pb-12 border-b-2 border-current/20 mb-10">
              <div className="text-xs uppercase tracking-widest opacity-70 font-mono font-bold">Studio Buku • Studio Edition</div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight">{project.title}</h1>
              <p className="text-base md:text-lg opacity-85 italic font-semibold">{project.subtitle}</p>
              <div className="pt-4 max-w-2xl mx-auto text-sm opacity-90 leading-relaxed bg-current/5 p-4 rounded-2xl font-sans font-medium">
                <strong>Sinopsis:</strong> {project.synopsis}
              </div>
            </div>

            {/* Mode 1: Paged View */}
            {viewMode === "paged" && (
              <>
                <div className="flex items-center justify-between pb-6 mb-8 border-b-2 border-current/15 text-xs font-sans">
                  <button
                    onClick={() => setActiveChapterIndex(Math.max(0, activeChapterIndex - 1))}
                    disabled={activeChapterIndex === 0}
                    className="inline-flex items-center space-x-1 opacity-90 hover:opacity-100 disabled:opacity-30 cursor-pointer font-black"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Bab Sebelumnya</span>
                  </button>
                  <span className="font-mono font-black">Bab {activeChapterIndex + 1} dari {chapters.length}</span>
                  <button
                    onClick={() => setActiveChapterIndex(Math.min(chapters.length - 1, activeChapterIndex + 1))}
                    disabled={activeChapterIndex === chapters.length - 1}
                    className="inline-flex items-center space-x-1 opacity-90 hover:opacity-100 disabled:opacity-30 cursor-pointer font-black"
                  >
                    <span>Bab Berikutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {currentChapter && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2 pb-6">
                      <h2 className="text-2xl md:text-3xl font-black">{currentChapter.title}</h2>
                      {currentChapter.subtitle && <p className="text-sm opacity-80 italic">{currentChapter.subtitle}</p>}
                    </div>

                    <div className="leading-loose whitespace-pre-wrap text-base md:text-lg space-y-6">
                      {currentChapter.content || "(Bab ini masih kosong.)"}
                    </div>

                    {/* Chapter Anotasi box */}
                    <div className="mt-10 pt-6 border-t-2 border-current/20 space-y-4 font-sans">
                      <div className="text-xs font-black uppercase tracking-wider opacity-90 flex items-center space-x-1.5">
                        <MessageSquarePlus className="w-4 h-4 text-amber-600" />
                        <span>Catatan Studio Bab Ini</span>
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newAnnText[currentChapter.id] || ""}
                          onChange={(e) => setNewAnnText({ ...newAnnText, [currentChapter.id]: e.target.value })}
                          placeholder="Tulis ide baru, koreksi, atau revisi untuk bab ini..."
                          className="flex-1 bg-current/5 border-2 border-current/30 rounded-xl px-3.5 py-2 text-xs focus:outline-none font-bold"
                        />
                        <button
                          onClick={() => handleAddAnnotation(currentChapter.id, currentChapter.title)}
                          className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs rounded-xl transition font-black shadow-md"
                        >
                          Kirim
                        </button>
                      </div>

                      <div className="space-y-2 pt-2">
                        {annotations.filter(a => a.chapterId === currentChapter.id).map(ann => (
                          <div key={ann.id} className={`p-3 rounded-xl border-2 text-xs flex items-start justify-between ${ann.resolved ? "opacity-60 bg-current/5" : "bg-current/10 border-current/30 font-medium"}`}>
                            <div className="space-y-1 pr-2">
                              <div className="flex items-center space-x-2 font-black">
                                <span>{ann.authorName}</span>
                                <span className="text-[10px] opacity-60">{new Date(ann.createdAt).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="whitespace-pre-wrap leading-relaxed">{ann.text}</p>
                            </div>
                            <div className="flex items-center space-x-1 shrink-0">
                              <button onClick={() => onUpdateAnnotation(ann.id, { resolved: !ann.resolved })} className="p-1 hover:text-emerald-500">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button onClick={() => onDeleteAnnotation(ann.id)} className="p-1 hover:text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Mode 2: Continuous View */}
            {viewMode === "continuous" && (
              <div className="space-y-20">
                {chapters.map((ch, idx) => (
                  <div key={ch.id} className="space-y-6 pb-16 border-b-2 border-current/15 last:border-b-0">
                    <div className="text-center space-y-2 pb-4">
                      <div className="text-xs uppercase font-mono tracking-widest opacity-60 font-bold">Bab {idx + 1}</div>
                      <h2 className="text-2xl md:text-3xl font-black">{ch.title}</h2>
                      {ch.subtitle && <p className="text-sm opacity-80 italic">{ch.subtitle}</p>}
                    </div>

                    <div className="leading-loose whitespace-pre-wrap text-base md:text-lg space-y-6">
                      {ch.content || "(Bab ini masih kosong.)"}
                    </div>

                    <div className="mt-8 pt-6 border-t-2 border-current/20 space-y-3 font-sans">
                      <div className="text-xs font-black uppercase tracking-wider opacity-90 flex items-center space-x-1.5">
                        <MessageSquarePlus className="w-4 h-4 text-amber-600" />
                        <span>Catatan Studio ({annotations.filter(a => a.chapterId === ch.id).length})</span>
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newAnnText[ch.id] || ""}
                          onChange={(e) => setNewAnnText({ ...newAnnText, [ch.id]: e.target.value })}
                          placeholder="Tulis ide baru atau revisi di bab ini..."
                          className="flex-1 bg-current/5 border-2 border-current/30 rounded-xl px-3.5 py-2 text-xs focus:outline-none font-bold"
                        />
                        <button
                          onClick={() => handleAddAnnotation(ch.id, ch.title)}
                          className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs rounded-xl transition font-black shadow-md"
                        >
                          Catat
                        </button>
                      </div>

                      <div className="space-y-2 pt-1">
                        {annotations.filter(a => a.chapterId === ch.id).map(ann => (
                          <div key={ann.id} className={`p-3 rounded-xl border-2 text-xs flex items-start justify-between ${ann.resolved ? "opacity-60 bg-current/5" : "bg-current/10 border-current/30"}`}>
                            <div className="space-y-1 pr-2">
                              <div className="flex items-center space-x-2 font-black">
                                <span>{ann.authorName}</span>
                                <span className="text-[10px] opacity-60">{new Date(ann.createdAt).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="whitespace-pre-wrap leading-relaxed">{ann.text}</p>
                            </div>
                            <div className="flex items-center space-x-1 shrink-0">
                              <button onClick={() => onUpdateAnnotation(ann.id, { resolved: !ann.resolved })} className="p-1 hover:text-emerald-500">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button onClick={() => onDeleteAnnotation(ann.id)} className="p-1 hover:text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* Annotations Sidebar */}
        {showAnnotationsPanel && (
          <aside className={`w-full lg:w-80 ${currentTheme.bgSidebar} border-t-2 lg:border-t-0 lg:border-l-2 ${currentTheme.border} flex flex-col h-1/3 lg:h-full`}>
            <div className={`p-4 border-b-2 ${currentTheme.border} flex items-center justify-between`}>
              <div className="flex items-center space-x-2">
                <BookMarked className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-black uppercase tracking-wider">Catatan Studio ({annotations.length})</h3>
              </div>
              <button onClick={() => setShowAnnotationsPanel(false)} className="text-xs font-black">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {annotations.map(ann => (
                <div key={ann.id} className={`p-3 rounded-2xl border-2 ${currentTheme.border} ${currentTheme.bgCard} text-xs space-y-2 shadow-sm`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-950 bg-amber-400 px-2 py-0.5 rounded-full truncate max-w-[150px]">{ann.chapterTitle}</span>
                    <span className={`text-[10px] font-bold ${currentTheme.textMuted}`}>{ann.authorName}</span>
                  </div>
                  <p className="leading-relaxed font-medium whitespace-pre-wrap">{ann.text}</p>
                  <div className={`flex items-center justify-between pt-2 border-t-2 ${currentTheme.border} text-[10px] ${currentTheme.textMuted} font-bold`}>
                    <span>{new Date(ann.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => onUpdateAnnotation(ann.id, { resolved: !ann.resolved })} className="hover:text-emerald-600 font-black">
                        {ann.resolved ? "Selesai ✓" : "Selesaikan"}
                      </button>
                      <button onClick={() => onDeleteAnnotation(ann.id)} className="hover:text-red-500">Hapus</button>
                    </div>
                  </div>
                </div>
              ))}

              {annotations.length === 0 && (
                <div className={`text-center py-12 ${currentTheme.textMuted} text-xs font-bold`}>
                  Belum ada catatan atau anotasi layar yang dibuat.
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* PUBLIC HTML READER SHARE MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border-2 border-emerald-500/50 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-white">
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-extrabold">Preview & Link Reader HTML Publik</h3>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-white font-black text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tautan HTML Publik domain resmi <strong>studio.buku.biz.id</strong> dirancang khusus untuk menarik minat <strong>akademisi, investor, donatur hibah penulisan, penerbit, dan editor profesional</strong>. Tautan ini mendukung SEO lengkap & crawling Google Bot.
            </p>

            <div className="space-y-4">
              {/* Link 1: Single Chapter Reader */}
              <div className="p-4 bg-slate-900 border-2 border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-300 flex items-center space-x-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>1. Reader HTML Per Bab ({currentChapter?.title})</span>
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
                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-lg transition shadow flex items-center space-x-1"
                  >
                    {copiedType === "chapter" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === "chapter" ? "Tersalin!" : "Salin Link"}</span>
                  </button>
                </div>
              </div>

              {/* Link 2: Full Project Reader */}
              <div className="p-4 bg-slate-900 border-2 border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-400 flex items-center space-x-1">
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
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black rounded-lg transition shadow flex items-center space-x-1"
                  >
                    {copiedType === "project" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === "project" ? "Tersalin!" : "Salin Link"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShowQrisModal(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black rounded-full transition shadow flex items-center space-x-1.5 cursor-pointer"
              >
                <span>💸 Lihat QRIS Donasi DANA</span>
              </button>

              <button
                onClick={() => setShowShareModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-700 text-xs font-bold rounded-full transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QRIS DANA DONATION MODAL */}
      {showQrisModal && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans"
          onClick={() => setShowQrisModal(false)}
        >
          <div
            className="bg-slate-950 border-2 border-amber-400 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-white text-center relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQrisModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 font-black text-lg"
            >
              ✕
            </button>

            <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-300 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              <span>💸 Donasi QRIS DANA Studio.Buku.Biz.ID</span>
            </div>

            <h3 className="text-lg font-black text-amber-300">Dukung Penulis & Proyek Naskah</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pindai / Scan QRIS DANA di bawah ini menggunakan aplikasi <strong>DANA, GoPay, OVO, ShopeePay, BCA, Mandiri, BRI, BNI</strong> atau m-banking / e-wallet lainnya.
            </p>

            <div className="bg-white p-3 rounded-xl border-2 border-amber-400 shadow-inner inline-block mx-auto max-w-[260px]">
              <img
                src="https://studio.buku.biz.id/QRIS-DANA.jpeg"
                alt="QRIS DANA milik Studio.Buku.Biz.ID"
                className="w-full h-auto rounded-lg object-contain"
              />
            </div>

            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <p className="font-bold text-amber-400">Penerima QRIS DANA: Studio.Buku.Biz.ID</p>
              <p className="text-[11px] opacity-80">
                Studio Buku tidak memungut biaya apapun dari para penulisnya. Terima kasih atas donasi & dukungan Anda untuk keberlangsungan wadah gratis penulisan karya naskah ini!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
