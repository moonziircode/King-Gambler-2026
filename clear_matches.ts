import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

initializeApp();
const db = getFirestore();

async function run() {
  const s = await db.collection('matches').get();
  let b = db.batch();
  console.log('deleting', s.size);
  s.forEach(d => b.delete(d.ref));
  await b.commit();
}
run();
