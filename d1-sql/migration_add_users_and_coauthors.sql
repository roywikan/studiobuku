-- ==========================================================
-- MIGRATION: Add users & project_coauthors to Cloudflare D1
-- Database: studiobuku-db
-- ==========================================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS project_coauthors (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_id TEXT,
  role TEXT NOT NULL DEFAULT 'editor',
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Seed Super Admin roy.wikan@gmail.com and default authors
INSERT OR REPLACE INTO users (id, email, name, avatar_url, role, created_at) VALUES 
('user_superadmin_roy', 'roy.wikan@gmail.com', 'Roy Wikan (Super Admin)', '👨‍💼', 'superadmin', '2026-09-30T00:00:00.000Z'),
('auth_1', 'rian.hidayat@studiobuku.com', 'Rian Hidayat', '👨‍💻', 'author', '2026-09-30T00:00:00.000Z'),
('auth_2', 'kirana.maharani@studiobuku.com', 'Kirana Maharani', '👩‍🎨', 'author', '2026-09-30T00:00:00.000Z'),
('auth_3', 'bagus.setiawan@studiobuku.com', 'Bagus Setiawan', '🎓', 'author', '2026-09-30T00:00:00.000Z'),
('auth_4', 'siti.rahmania@studiobuku.com', 'Siti Rahmania', '📚', 'editor', '2026-09-30T00:00:00.000Z');
