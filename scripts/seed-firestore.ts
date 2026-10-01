import { Firestore } from '@google-cloud/firestore';
import { INITIAL_SEED_DB } from '../src/seedData';
import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
if (!fs.existsSync(configPath)) {
  console.error("firebase-applet-config.json not found!");
  process.exit(1);
}

const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

async function seedFirestore() {
  console.log(`Starting Firestore Seeding to Project: ${firebaseConfig.projectId}, Database: ${firebaseConfig.firestoreDatabaseId}...`);
  console.log(`Uploading ${INITIAL_SEED_DB.projects.length} projects and ${INITIAL_SEED_DB.chapters.length} chapters...`);

  // Initialize Admin Firestore using project credentials
  const db = new Firestore({
    projectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId
  });

  const { projects, chapters, authors } = INITIAL_SEED_DB;

  // 1. Upload Projects in batches
  let batch = db.batch();
  let operationCount = 0;

  for (const project of projects) {
    const projRef = db.collection('projects').doc(project.id);
    batch.set(projRef, project);
    operationCount++;

    if (operationCount >= 400) {
      await batch.commit();
      console.log(`Committed batch of ${operationCount} projects...`);
      batch = db.batch();
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    await batch.commit();
    console.log(`Committed final projects batch...`);
  }

  // 2. Upload Chapters in batches
  batch = db.batch();
  operationCount = 0;

  for (const chapter of chapters) {
    const chapRef = db.collection('chapters').doc(chapter.id);
    batch.set(chapRef, chapter);
    operationCount++;

    if (operationCount >= 400) {
      await batch.commit();
      console.log(`Committed batch of ${operationCount} chapters...`);
      batch = db.batch();
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    await batch.commit();
    console.log(`Committed final chapters batch...`);
  }

  // 3. Upload Authors
  batch = db.batch();
  for (const author of authors) {
    const authorRef = db.collection('authors').doc(author.id);
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
