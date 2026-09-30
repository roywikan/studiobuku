interface Env {
  DB: any;
  GEMINI_API_KEY?: string;
}

const defaultData = {
  authors: [
    { id: "auth_1", name: "Rian Hidayat", role: "Penulis Utama", avatar: "👨‍💻", color: "bg-emerald-500" },
    { id: "auth_2", name: "Kirana Maharani", role: "Penulis Studio", avatar: "👩‍🎨", color: "bg-indigo-500" }
  ],
  projects: [
    {
      id: "proj_1",
      title: "Gema Di Ujung Senja",
      subtitle: "Novel Fiksi Psikologis & Perjalanan Dua Jiwa",
      genre: "Fiksi / Drama",
      synopsis: "Kisah tentang dua sahabat masa kecil yang terpisah selama satu dekade dan dipertemukan kembali dalam proyek restorasi arsip tua di Yogyakarta.",
      createdAt: new Date().toISOString()
    }
  ],
  chapters: [
    {
      id: "chap_1",
      projectId: "proj_1",
      title: "Bab 1: Stasiun Tugu Pukul Empat Sore",
      subtitle: "Pertemuan setelah sepuluh tahun berlalu",
      content: "Kereta rel listrik berdecit pelan saat memasuki peron jalur tiga Stasiun Tugu. Aroma uap panas bercampur bau khas stasiun tua menyambut kedatangan sore itu. Langit Yogyakarta tampak jingga kemerahan, menepis mendung yang menggantung sejak siang.\n\nArya berdiri di dekat pilar besi bercat hijau pudar. Tangannya menggenggam tiket kertas yang sudah agak kusut. Di seberangnya, seorang perempuan berjas hujan abu-abu melangkah turun dari gerbong ekonomi, membawa ransel kanvas lusuh yang sama persis seperti sepuluh tahun lalu.\n\n'Kamu terlambat lima menit, Kiran,' sapa Arya dengan senyum tipis.\n\nKirana mendengus pelan, lalu tertawa kecil. 'Kemacetan Ring Road tidak bisa diajak kompromi, Ary. Tapi setidaknya kita tepat waktu untuk memulai semua ini.'",
      order: 1,
      status: "final",
      lastEditedBy: "Rian Hidayat",
      updatedAt: new Date().toISOString()
    },
    {
      id: "chap_2",
      projectId: "proj_1",
      title: "Bab 2: Arsip yang Terlupakan",
      subtitle: "Menemukan kotak kayu berdebu di loteng",
      content: "Rumah kakek di kawasan Kotabaru menyimpan lorong waktu tersendiri. Debu lembut menari di bawah sorotan cahaya matahari yang menembus genting kaca.\n\n'Di sinilah kakek menyimpan catatan harian tahun 1965,' ujar Kirana sambil menyeka permukaan kotak kayu jati berukir melati.\n\nArya mendekat, membawa lampu senter kecil. Bau kertas tua semacam vanili kering dan tinta cina langsung menusuk indra penciuman mereka. Lembar demi lembar catatan itu menyimpan teka-teki keluarga yang selama ini terkubur rapat.",
      order: 2,
      status: "review",
      lastEditedBy: "Kirana Maharani",
      updatedAt: new Date().toISOString()
    }
  ],
  ideas: [
    {
      id: "idea_1",
      projectId: "proj_1",
      title: "Simbol Kunci Inggris Tua",
      content: "Kunci inggris peninggalan ayah Arya jadi metafora rekonsiliasi. Setiap bab bisa disisipkan kutipan tentang memperbaiki mesin yang macet.",
      category: "Plot",
      authorId: "auth_1",
      pinned: true,
      createdAt: new Date().toISOString()
    }
  ],
  logs: [
    {
      id: "log_1",
      projectId: "proj_1",
      chapterId: "chap_1",
      chapterTitle: "Bab 1: Stasiun Tugu Pukul Empat Sore",
      authorName: "Rian Hidayat",
      action: "Membuat bab baru dan menulis draf awal",
      timestamp: new Date().toISOString()
    }
  ],
  annotations: [],
  glossary: [
    {
      id: "glos_1",
      projectId: "proj_1",
      term: "Arya Perkasa",
      category: "Karakter",
      definition: "Tokoh utama pria, 28 tahun, konservator arsip sejarah lulusan UGM.",
      aliases: "Ary, Arya",
      updatedAt: new Date().toISOString()
    },
    {
      id: "glos_2",
      projectId: "proj_1",
      term: "Kirana Maharani",
      category: "Karakter",
      definition: "Tokoh utama wanita, jurnalis lepas berjiwa petualang.",
      aliases: "Kiran, Kirana",
      updatedAt: new Date().toISOString()
    }
  ]
};

export async function onRequest(context: { request: Request; env: Env; params: { path: string[] } }) {
  const { request, env, params } = context;
  const path = params.path ? params.path.join("/") : "";

  const jsonHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Gemini-Api-Key"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: jsonHeaders });
  }

  try {
    // GET /api/data
    if (path === "data" || path === "") {
      if (!env.DB) {
        return new Response(JSON.stringify(defaultData), { headers: jsonHeaders });
      }

      try {
        const projectsRes = await env.DB.prepare("SELECT * FROM projects").all();
        const chaptersRes = await env.DB.prepare("SELECT * FROM chapters ORDER BY \"order\" ASC").all();
        const ideasRes = await env.DB.prepare("SELECT * FROM ideas").all();
        const logsRes = await env.DB.prepare("SELECT * FROM logs ORDER BY timestamp DESC LIMIT 50").all();
        const glossaryRes = await env.DB.prepare("SELECT * FROM glossary").all();
        const annotationsRes = await env.DB.prepare("SELECT * FROM annotations").all();

        const dbData = {
          authors: defaultData.authors,
          projects: (projectsRes.results && projectsRes.results.length > 0) ? projectsRes.results : defaultData.projects,
          chapters: (chaptersRes.results && chaptersRes.results.length > 0) ? chaptersRes.results : defaultData.chapters,
          ideas: ideasRes.results || defaultData.ideas,
          logs: logsRes.results || defaultData.logs,
          glossary: (glossaryRes.results && glossaryRes.results.length > 0) ? glossaryRes.results : defaultData.glossary,
          annotations: annotationsRes.results || []
        };

        return new Response(JSON.stringify(dbData), { headers: jsonHeaders });
      } catch (e) {
        return new Response(JSON.stringify(defaultData), { headers: jsonHeaders });
      }
    }

    // POST /api/projects
    if (path === "projects" && request.method === "POST") {
      const body = await request.json() as any;
      const newProj = {
        id: "proj_" + Date.now(),
        title: body.title || "Proyek Buku Baru",
        subtitle: body.subtitle || "Naskah Fiksi / Non-Fiksi Studio",
        genre: body.genre || "Fiksi",
        synopsis: body.synopsis || "Sinopsis naskah...",
        createdAt: new Date().toISOString()
      };

      if (env.DB) {
        await env.DB.prepare("INSERT INTO projects (id, title, subtitle, genre, synopsis, createdAt) VALUES (?, ?, ?, ?, ?, ?)")
          .bind(newProj.id, newProj.title, newProj.subtitle, newProj.genre, newProj.synopsis, newProj.createdAt)
          .run();

        const firstChap = {
          id: "chap_" + Date.now(),
          projectId: newProj.id,
          title: "Bab 1: Permulaan",
          subtitle: "Draf awal cerita",
          content: "Tulis isi naskah bab pertama Anda di sini...",
          order: 1,
          status: "draft",
          lastEditedBy: body.authorName || "Penulis Studio",
          updatedAt: new Date().toISOString()
        };

        await env.DB.prepare("INSERT INTO chapters (id, projectId, title, subtitle, content, \"order\", status, lastEditedBy, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
          .bind(firstChap.id, firstChap.projectId, firstChap.title, firstChap.subtitle, firstChap.content, firstChap.order, firstChap.status, firstChap.lastEditedBy, firstChap.updatedAt)
          .run();
      }

      return new Response(JSON.stringify(newProj), { headers: jsonHeaders });
    }

    // POST /api/chapters
    if (path === "chapters" && request.method === "POST") {
      const body = await request.json() as any;
      const newChap = {
        id: "chap_" + Date.now(),
        projectId: body.projectId || "proj_1",
        title: body.title || "Bab Baru",
        subtitle: body.subtitle || "",
        content: body.content || "",
        order: body.order || 1,
        status: body.status || "draft",
        lastEditedBy: body.authorName || "Penulis",
        updatedAt: new Date().toISOString()
      };

      if (env.DB) {
        await env.DB.prepare("INSERT INTO chapters (id, projectId, title, subtitle, content, \"order\", status, lastEditedBy, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
          .bind(newChap.id, newChap.projectId, newChap.title, newChap.subtitle, newChap.content, newChap.order, newChap.status, newChap.lastEditedBy, newChap.updatedAt)
          .run();
      }

      return new Response(JSON.stringify(newChap), { headers: jsonHeaders });
    }

    // PUT /api/chapters/:id
    if (path.startsWith("chapters/") && request.method === "PUT") {
      const chapId = path.split("/")[1];
      const body = await request.json() as any;

      if (env.DB) {
        await env.DB.prepare("UPDATE chapters SET title = ?, subtitle = ?, content = ?, status = ?, lastEditedBy = ?, updatedAt = ? WHERE id = ?")
          .bind(body.title, body.subtitle || "", body.content, body.status || "draft", body.authorName || "Penulis", new Date().toISOString(), chapId)
          .run();
      }

      return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
    }

    // POST /api/ai/assist
    if (path === "ai/assist" && request.method === "POST") {
      const body = await request.json() as any;
      const apiKey = env.GEMINI_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "API Key Gemini belum terkonfigurasi di Cloudflare Settings." }), { status: 400, headers: jsonHeaders });
      }

      const promptText = `Anda adalah asisten penulisan kreatif profesional untuk Studio Buku.\n\n${body.text || "Berikan saran penulisan."}`;
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      });

      const geminiData = await geminiRes.json() as any;
      const resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "Gagal mendapatkan respons dari Gemini AI.";

      return new Response(JSON.stringify({ result: resultText }), { headers: jsonHeaders });
    }

    return new Response(JSON.stringify(defaultData), { headers: jsonHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, default: defaultData }), { status: 200, headers: jsonHeaders });
  }
}
