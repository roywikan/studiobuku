import fs from "fs";
import path from "path";
import { INITIAL_SEED_DB } from "../src/seedData";
import { DB, Project, Chapter, GlossaryItem } from "../src/types";

function slugify(text: string): string {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "naskah";
}

function escapeHtml(unsafe: string): string {
  return (unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function readDatabase(): DB {
  const dbPath = path.join(process.cwd(), "db.json");
  if (fs.existsSync(dbPath)) {
    try {
      const data = fs.readFileSync(dbPath, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      console.warn("Failed to parse db.json, falling back to INITIAL_SEED_DB");
    }
  }
  return INITIAL_SEED_DB;
}

function renderStaticPreviewPage(db: DB, projectSlug: string, chapterSlug?: string): string {
  const cleanProjSlug = projectSlug.toLowerCase();
  let project = db.projects.find(p => p.id === projectSlug || slugify(p.title) === cleanProjSlug);

  if (!project && chapterSlug) {
    const cleanChapSlug = chapterSlug.toLowerCase();
    const foundChap = db.chapters.find(c => c.id === chapterSlug || slugify(c.title) === cleanChapSlug);
    if (foundChap) {
      project = db.projects.find(p => p.id === foundChap.projectId);
    }
  }

  if (!project) project = db.projects[0];

  const projChapters = db.chapters
    .filter(c => c.projectId === project.id)
    .sort((a, b) => a.order - b.order);

  const projGlossary = (db.glossary || []).filter(g => g.projectId === project.id);

  let currentChap: Chapter | undefined;
  if (chapterSlug) {
    const cleanChapSlug = chapterSlug.toLowerCase();
    currentChap = projChapters.find(c => c.id === chapterSlug || slugify(c.title) === cleanChapSlug);
  }

  const isFullBook = !currentChap;
  const BASE_DOMAIN = "https://studio.buku.biz.id";
  const projSlugClean = slugify(project.title);

  const canonicalUrl = !isFullBook && currentChap
    ? `${BASE_DOMAIN}/p/${projSlugClean}/${slugify(currentChap.title)}`
    : `${BASE_DOMAIN}/p/${projSlugClean}`;

  const pageTitle = !isFullBook && currentChap
    ? `${currentChap.title} — ${project.title} | Studio Buku`
    : `${project.title}${project.subtitle ? ` (${project.subtitle})` : ''} | Studio Buku`;

  const rawSnippet = !isFullBook && currentChap?.content
    ? currentChap.content.substring(0, 150).replace(/[#*`_\[\]]/g, ' ')
    : (project.synopsis || "").substring(0, 150);

  const pageDesc = `${rawSnippet}... Baca naskah ${project.title} karya ${project.ownerName || 'Penulis Studio Buku'} secara penuh di Studio Buku.`;

  const wordCount = isFullBook
    ? projChapters.reduce((acc, c) => acc + (c.content ? c.content.split(/\s+/).length : 0), 0)
    : (currentChap?.content ? currentChap.content.split(/\s+/).length : 0);

  const readTime = Math.ceil(wordCount / 200);

  // Render Full HTML Chapters for Googlebot
  let chaptersContentHtml = "";
  if (isFullBook) {
    chaptersContentHtml = projChapters.map((c, idx) => `
      <section style="margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border);">
        <div style="font-size: 0.75rem; font-weight: 800; color: var(--accent); text-transform: uppercase;">BAB ${idx + 1}</div>
        <h2 style="font-size: 1.5rem; font-weight: 900; color: var(--accent); margin: 8px 0;">${escapeHtml(c.title)}</h2>
        ${c.subtitle ? `<p style="font-style: italic; opacity: 0.8; margin-bottom: 16px;">${escapeHtml(c.subtitle)}</p>` : ''}
        <div>
          ${(c.content || '').split(/\n\s*\n/).map(para => `<p style="text-indent: 1.5rem; line-height: 1.8; margin-bottom: 16px;">${escapeHtml(para)}</p>`).join('')}
        </div>
      </section>
    `).join('');
  } else if (currentChap) {
    chaptersContentHtml = `
      <section style="margin-top: 24px;">
        <h2 style="font-size: 1.6rem; font-weight: 900; color: var(--accent); margin: 8px 0;">${escapeHtml(currentChap.title)}</h2>
        ${currentChap.subtitle ? `<p style="font-style: italic; opacity: 0.8; margin-bottom: 16px;">${escapeHtml(currentChap.subtitle)}</p>` : ''}
        <div>
          ${(currentChap.content || '').split(/\n\s*\n/).map(para => `<p style="text-indent: 1.5rem; line-height: 1.8; margin-bottom: 16px;">${escapeHtml(para)}</p>`).join('')}
        </div>
      </section>
    `;
  }

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(pageDesc)}" />
  <meta name="keywords" content="${escapeHtml(project.title)}, ${escapeHtml(project.genre)}, Studio Buku, Naskah Digital" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  <link rel="canonical" href="${canonicalUrl}" />

  <!-- OpenGraph Social Cards -->
  <meta property="og:type" content="book" />
  <meta property="og:title" content="${escapeHtml(pageTitle)}" />
  <meta property="og:description" content="${escapeHtml(pageDesc)}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:site_name" content="Studio Buku" />
  <meta property="og:image" content="https://studio.buku.biz.id/studio-buku-logo.jpg" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(pageDesc)}" />
  <meta name="twitter:image" content="https://studio.buku.biz.id/studio-buku-logo.jpg" />

  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
  ${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Book",
    "name": project.title,
    "headline": !isFullBook && currentChap ? currentChap.title : project.title,
    "description": pageDesc,
    "genre": project.genre || "Fiksi",
    "inLanguage": "id",
    "url": canonicalUrl,
    "author": { "@type": "Person", "name": project.ownerName || "Penulis Studio Buku" },
    "publisher": { "@type": "Organization", "name": "Studio Buku", "url": BASE_DOMAIN }
  }, null, 2)}
  </script>

  <style>
    :root { --bg: #0f172a; --text: #f8fafc; --paper: #1e293b; --border: #334155; --accent: #fbbf24; }
    body { background: var(--bg); color: var(--text); font-family: Georgia, serif; margin: 0; padding: 20px; }
    .container { max-width: 820px; margin: 20px auto; background: var(--paper); padding: 32px; border-radius: 16px; border: 1px solid var(--border); }
    h1 { color: var(--accent); font-family: system-ui, sans-serif; font-size: 2rem; margin-bottom: 8px; }
    a { color: var(--accent); }
  </style>
</head>
<body>
  <div class="container">
    <header style="border-bottom: 1px solid var(--border); padding-bottom: 16px; margin-bottom: 24px;">
      <a href="${BASE_DOMAIN}" style="font-weight: 900; text-decoration: none; font-family: system-ui;">📚 Studio Buku</a>
      <h1>${escapeHtml(isFullBook ? project.title : (currentChap ? currentChap.title : project.title))}</h1>
      <p style="font-size: 0.9rem; opacity: 0.8; font-family: system-ui;">
        Naskah: <strong>${escapeHtml(project.title)}</strong> | Genre: ${escapeHtml(project.genre)} | Volume: ${wordCount.toLocaleString('id-ID')} Kata
      </p>
    </header>

    <main>
      ${chaptersContentHtml}
    </main>

    <footer style="margin-top: 40px; border-top: 1px solid var(--border); pt-16px; text-align: center; font-size: 0.8rem; font-family: system-ui; opacity: 0.8;">
      <p>Hak cipta milik : masing masing user penulisnya, Nulis Buku Bareng di <a href="https://Studio.Buku.Biz.ID">https://Studio.Buku.Biz.ID</a></p>
    </footer>
  </div>
</body>
</html>`;
}

function runPreRender() {
  console.log("🚀 Starting build-time static HTML pre-rendering for public projects...");
  const db = readDatabase();
  const publicProjects = (db.projects || []).filter(p => !p.isPrivate);

  const distDir = path.join(process.cwd(), "dist");
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  let generatedPagesCount = 0;

  publicProjects.forEach(p => {
    const projSlug = slugify(p.title);
    const pChapters = (db.chapters || []).filter(c => c.projectId === p.id);

    // 1. Generate Main Project Static Page
    const projDir = path.join(distDir, "p", projSlug);
    fs.mkdirSync(projDir, { recursive: true });

    const projHtml = renderStaticPreviewPage(db, projSlug);
    fs.writeFileSync(path.join(projDir, "index.html"), projHtml, "utf-8");
    generatedPagesCount++;

    // 2. Generate Individual Chapter Static Pages
    pChapters.forEach(c => {
      const chapSlug = slugify(c.title);
      const chapDir = path.join(projDir, chapSlug);
      fs.mkdirSync(chapDir, { recursive: true });

      const chapHtml = renderStaticPreviewPage(db, projSlug, chapSlug);
      fs.writeFileSync(path.join(chapDir, "index.html"), chapHtml, "utf-8");
      generatedPagesCount++;
    });
  });

  console.log(`✅ Successfully pre-rendered ${generatedPagesCount} static public project HTML pages in /dist/p/ for search bots & social sharing.`);
}

runPreRender();
