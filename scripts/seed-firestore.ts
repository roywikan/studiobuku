import { initializeApp } from 'firebase/app';
import { getFirestore, doc, writeBatch } from 'firebase/firestore';
import { INITIAL_SEED_DB } from '../src/seedData.js';
import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
if (!fs.existsSync(configPath)) {
  console.error("firebase-applet-config.json not found!");
  process.exit(1);
}

const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function seedFirestore() {
  console.log(`Starting Firestore Seeding to Database ID: ${firebaseConfig.firestoreDatabaseId}...`);
  console.log(`Uploading ${INITIAL_SEED_DB.projects.length} projects and ${INITIAL_SEED_DB.chapters.length} chapters...`);

  const { projects, chapters, authors } = INITIAL_SEED_DB;

  // 1. Upload Projects in batches
  let batch = writeBatch(db);
  let operationCount = 0;

  for (const project of projects) {
    const projRef = doc(db, 'projects', project.id);
    batch.set(projRef, project);
    operationCount++;

    if (operationCount >= 400) {
      await batch.commit();
      console.log(`Committed batch of ${operationCount} projects...`);
      batch = writeBatch(db);
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    await batch.commit();
    console.log(`Committed final projects batch...`);
  }

  // 2. Upload Chapters in batches
  batch = writeBatch(db);
  operationCount = 0;

  for (const chapter of chapters) {
    const chapRef = doc(db, 'chapters', chapter.id);
    batch.set(chapRef, chapter);
    operationCount++;

    if (operationCount >= 400) {
      await batch.commit();
      console.log(`Committed batch of ${operationCount} chapters...`);
      batch = writeBatch(db);
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    await batch.commit();
    console.log(`Committed final chapters batch...`);
  }

  // 3. Upload Authors
  batch = writeBatch(db);
  for (const author of authors) {
    const authorRef = doc(db, 'authors', author.id);
    batch.set(authorRef, author);
  }
  await batch.commit();

  console.log("SUCCESS! All 60 projects, 480 chapters, and authors uploaded to Cloud Firestore!");
  process.exit(0);
}

seedFirestore().catch((err) => {
  console.error("Error seeding Firestore:", err);
  process.exit(1);
});
