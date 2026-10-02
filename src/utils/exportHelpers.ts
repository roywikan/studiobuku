import { Chapter, Project } from "../types";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak } from "docx";

export const slugify = (text: string): string => {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "naskah";
};

export const PUBLIC_DOMAIN = "https://studio.buku.biz.id";

export const getPublicProjectUrl = (projectTitle: string): string => {
  return `${PUBLIC_DOMAIN}/p/${slugify(projectTitle)}`;
};

export const getPublicChapterUrl = (projectTitle: string, chapterTitle: string): string => {
  return `${PUBLIC_DOMAIN}/p/${slugify(projectTitle)}/${slugify(chapterTitle)}`;
};

/**
 * Ekspor naskah proyek ke format Plain Text (.txt)
 */
export const exportToTxt = (project: Project, chapters: Chapter[], authorName: string = "Penulis"): void => {
  const safeChapters = Array.isArray(chapters) ? chapters : [];
  const authorCopyright = `Hak cipta milik: ${authorName || "masing masing user penulisnya"}, Nulis Buku Bareng di https://Studio.Buku.Biz.ID`;

  let fullText = `${(project.title || "Naskah").toUpperCase()}\n${project.subtitle || ""}\nGenre: ${project.genre || "Fiksi"}\n${authorCopyright}\n\nSINOPSIS:\n${project.synopsis || ""}\n\n=====================\n\n`;

  safeChapters.forEach((ch, idx) => {
    fullText += `\n\n--- BAB ${idx + 1}: ${ch.title} ---\n${ch.subtitle || ""}\n\n${ch.content || ""}\n\n`;
  });

  const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugify(project.title)}_naskah.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Ekspor naskah proyek ke format Microsoft Word (.docx) siap cetak dan review penerbit
 */
export const exportToDocx = async (project: Project, chapters: Chapter[], authorName: string = "Penulis"): Promise<void> => {
  try {
    const safeChapters = Array.isArray(chapters) ? chapters : [];
    const totalWords = safeChapters.reduce(
      (acc, c) => acc + (c.content ? c.content.split(/\s+/).filter(Boolean).length : 0),
      0
    );
    const authorCopyright = `Hak cipta milik: ${authorName || "masing masing user penulisnya"}, Nulis Buku Bareng di https://Studio.Buku.Biz.ID`;

    const docChildren: Paragraph[] = [];

    // Header Tagline
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
            text: project.title || "Naskah Buku",
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
            text: authorCopyright,
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
            text: `Genre: ${project.genre || "Fiksi"}   |   Total Kata: ${totalWords.toLocaleString("id-ID")}   |   Jumlah: ${safeChapters.length} Bab`,
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

    // Daftar Isi
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

    safeChapters.forEach((ch, idx) => {
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

    // Bab demi Bab
    safeChapters.forEach((ch, idx) => {
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

      if (idx < safeChapters.length - 1) {
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
    a.download = `${slugify(project.title)}_naskah_editor.docx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Gagal mengekspor naskah ke DOCX:", err);
  }
};

/**
 * Ekspor naskah proyek ke format PDF siap cetak dengan penomoran halaman dan margin rapi
 */
export const exportToPdf = (project: Project, chapters: Chapter[], authorName: string = "Penulis"): void => {
  try {
    const safeChapters = Array.isArray(chapters) ? chapters : [];
    const totalWords = safeChapters.reduce(
      (acc, c) => acc + (c.content ? c.content.split(/\s+/).filter(Boolean).length : 0),
      0
    );
    const authorCopyright = `Hak cipta milik: ${authorName || "masing masing user penulisnya"}, Nulis Buku Bareng di https://Studio.Buku.Biz.ID`;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    const bottomLimit = pageHeight - margin - 12;

    // Cover / Title Page
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
    const titleLines = doc.splitTextToSize(project.title || "Naskah Buku", contentWidth);
    doc.text(titleLines, pageWidth / 2, y, { align: "center" });
    y += titleLines.length * 10 + 4;

    if (project.subtitle) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      const subLines = doc.splitTextToSize(project.subtitle, contentWidth);
      doc.text(subLines, pageWidth / 2, y, { align: "center" });
      y += subLines.length * 6 + 10;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(
      `Genre: ${project.genre || "Fiksi"}   |   Total Kata: ${totalWords.toLocaleString("id-ID")}   |   Jumlah: ${safeChapters.length} Bab`,
      pageWidth / 2,
      y,
      { align: "center" }
    );
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

      const boxHeight = synLines.length * 5 + 8;
      doc.setFillColor(248, 246, 240);
      doc.setDrawColor(220, 210, 190);
      doc.roundedRect(margin, y - 4, contentWidth, boxHeight, 3, 3, "FD");

      doc.text(synLines, margin + 5, y + 2);
      y += boxHeight + 15;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text(authorCopyright, pageWidth / 2, 275, { align: "center" });

    // Halaman Bab
    doc.addPage();
    let currentPage = 2;

    safeChapters.forEach((ch, idx) => {
      if (idx > 0) {
        doc.addPage();
        currentPage++;
      }

      y = margin + 10;

      // Header Bab
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(180, 130, 20);
      doc.text(`BAB ${idx + 1}`, margin, y);
      y += 7;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(20, 20, 20);
      const chTitleLines = doc.splitTextToSize(ch.title, contentWidth);
      doc.text(chTitleLines, margin, y);
      y += chTitleLines.length * 8 + 4;

      if (ch.subtitle) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(11);
        doc.setTextColor(90, 90, 90);
        const chSubLines = doc.splitTextToSize(ch.subtitle, contentWidth);
        doc.text(chSubLines, margin, y);
        y += chSubLines.length * 6 + 6;
      }

      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.4);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Isi Bab
      const paragraphs = (ch.content || "(Bab ini masih kosong)").split("\n");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(30, 30, 30);

      paragraphs.forEach((pText) => {
        const trimmed = pText.trim();
        if (!trimmed) {
          y += 3;
          return;
        }

        const lines = doc.splitTextToSize(trimmed, contentWidth);
        const requiredHeight = lines.length * 5.8 + 4;

        if (y + requiredHeight > bottomLimit) {
          doc.setFontSize(8.5);
          doc.setTextColor(120, 120, 120);
          doc.text(`Halaman ${currentPage}`, pageWidth / 2, pageHeight - margin + 5, { align: "center" });

          doc.addPage();
          currentPage++;
          y = margin + 10;
          doc.setFontSize(10.5);
          doc.setTextColor(30, 30, 30);
        }

        doc.text(lines, margin, y);
        y += lines.length * 5.8 + 4;
      });

      // Footer nomor halaman
      doc.setFontSize(8.5);
      doc.setTextColor(120, 120, 120);
      doc.text(`Halaman ${currentPage}`, pageWidth / 2, pageHeight - margin + 5, { align: "center" });
    });

    doc.save(`${slugify(project.title)}_naskah_cetak.pdf`);
  } catch (err) {
    console.error("Gagal mengekspor naskah ke PDF:", err);
  }
};
