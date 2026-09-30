export interface Author {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
}

export interface Chapter {
  id: string;
  projectId: string;
  title: string;
  subtitle?: string;
  content: string;
  order: number;
  status: "draft" | "review" | "final";
  lastEditedBy: string;
  updatedAt: string;
}

export interface Idea {
  id: string;
  projectId: string;
  title: string;
  content: string;
  category: "Plot" | "Karakter" | "Riset" | "Dialog" | "Lainnya";
  authorId: string;
  pinned: boolean;
  createdAt: string;
}

export interface RevisionLog {
  id: string;
  projectId: string;
  chapterId?: string;
  chapterTitle?: string;
  authorName: string;
  action: string;
  timestamp: string;
}

export interface Annotation {
  id: string;
  projectId: string;
  chapterId: string;
  chapterTitle: string;
  text: string;
  authorName: string;
  createdAt: string;
  resolved: boolean;
}

export interface GlossaryItem {
  id: string;
  projectId: string;
  term: string;
  category: "Karakter" | "Lokasi" | "Istilah Dunia" | "Aturan Magic/Sains" | "Lainnya";
  definition: string;
  authorName?: string;
  aliases?: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  subtitle: string;
  genre: string;
  synopsis: string;
  createdAt: string;
}

export interface DB {
  projects: Project[];
  chapters: Chapter[];
  ideas: Idea[];
  logs: RevisionLog[];
  authors: Author[];
  annotations: Annotation[];
  glossary?: GlossaryItem[];
}
