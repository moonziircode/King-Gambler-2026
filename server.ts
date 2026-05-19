import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert } from 'firebase-admin/app';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

// We need an admin SDK connection to update match points securely without users having permission.
// In the AI Studio environment, we can interact with our provisioned Firebase project.
// However, since we don't have the explicit service account json key file provided by default,
// wait! AI studio provisions the database and provides it natively if we have the ADC 
// (Application Default Credentials). Alternatively, we might not have admin SDK access natively
// without setting up GOOGLE_APPLICATION_CREDENTIALS.
// Let's use it and if it fails, we fall back to a mock or manual trigger from client if ADC is present?
// No, the set_up_firebase tool creates the DB in the project, so ADC might "just work".
// Let's initialize without parameters to use ADC:
try {
  initializeApp();
} catch (e) {
  console.log("Firebase Admin already initialized or missing ADC", e);
}

const db = getFirestore();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Simple endpoint to trigger match updates (for testing/demo)
  app.post('/api/admin/update-match-score', async (req, res) => {
    try {
      const { matchId, scoreA, scoreB, status } = req.body;
      if (!matchId) return res.status(400).json({ error: 'matchId is required' });
      
      const matchRef = db.collection('matches').doc(matchId);
      const matchDoc = await matchRef.get();
      
      if (!matchDoc.exists) return res.status(404).json({ error: 'Match not found' });
      
      // Update Match
      await matchRef.update({
        scoreA,
        scoreB,
        status: status || 'finished'
      });

      // Recalculate Points for all predictions of this match
      // Note: In real life, World Cup matches finish and we run a batch job.
      const predictionsSnapshot = await matchRef.collection('predictions').get();
      
      let batch = db.batch();
      let batchCount = 0;
      
      // We will map user points updates
      const userPointsMap: Record<string, { exacts: number, closes: number, points: number }> = {};
      
      for (const pred of predictionsSnapshot.docs) {
        const pData = pred.data();
        let earnedPoints = 0;
        let isExact = 0;
        let isClose = 0;
        
        // Same logic as requested for Exact (3), Close (1.5), Correct (1)
        if (pData.scoreA === scoreA && pData.scoreB === scoreB) {
          earnedPoints = 3;
          isExact = 1;
        } else {
          // Check correct result (win, loss, draw)
          const actualDiff = scoreA - scoreB;
          const predDiff = pData.scoreA - pData.scoreB;
          
          const actualResult = actualDiff > 0 ? 'A' : actualDiff < 0 ? 'B' : 'DRAW';
          const predResult = predDiff > 0 ? 'A' : predDiff < 0 ? 'B' : 'DRAW';
          
          if (actualResult === predResult) {
            // Check if goal diff is correct, OR exact goals for one team
            if ((actualDiff === predDiff) || (pData.scoreA === scoreA) || (pData.scoreB === scoreB)) {
              earnedPoints = 1.5;
              isClose = 1;
            } else {
              earnedPoints = 1;
            }
          }
        }
        
        batch.update(pred.ref, { points: earnedPoints });
        batchCount++;
        
        if (!userPointsMap[pData.userId]) {
          userPointsMap[pData.userId] = { exacts: 0, closes: 0, points: 0 };
        }
        userPointsMap[pData.userId].exacts += isExact;
        userPointsMap[pData.userId].closes += isClose;
        userPointsMap[pData.userId].points += earnedPoints;
        
        if (batchCount > 400) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }
      
      await batch.commit();
      
      // Update User Profiles & League Members
      // This part can be heavy if many leagues. 
      // For simplicity, we just trigger a script that aggregates points or we just iterate here:
      for (const [userId, stats] of Object.entries(userPointsMap)) {
         // This is a naive implementation: we should just add stats up by reading their current profile
         try {
           const userRef = db.collection('users').doc(userId);
           const uDoc = await userRef.get();
           if (uDoc.exists) {
             const ud = uDoc.data()!;
             await userRef.update({
               totalPoints: (ud.totalPoints || 0) + stats.points,
               exacts: (ud.exacts || 0) + stats.exacts,
               closes: (ud.closes || 0) + stats.closes
             });
           }
         } catch(e) {
            console.error("Failed to update user profile", userId, e);
         }
      }
      
      res.json({ success: true, processed: predictionsSnapshot.size });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
