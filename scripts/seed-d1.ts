import { autoBootstrapD1, getFullD1Database } from "../src/server/d1";

async function main() {
  console.log("⚡ Bootstrapping Cloudflare D1 studiobuku-db database...");
  const res = autoBootstrapD1();
  const db = getFullD1Database();
  console.log(`✅ ${res.message}`);
  console.log(`- Total Projects: ${db.projects.length}`);
  console.log(`- Total Chapters: ${db.chapters.length}`);
  console.log(`- Total Authors: ${db.authors.length}`);
  console.log(`- Total Users: ${db.users.length}`);
  console.log(`- Total Co-Authorships: ${db.coauthors.length}`);
  console.log(`👑 Super Admin roy.wikan@gmail.com siap digunakan.`);
}

main().catch(console.error);

