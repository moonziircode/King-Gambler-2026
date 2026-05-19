import React, { useState } from 'react';
import { db } from '../firebase';
import { writeBatch, doc } from 'firebase/firestore';
import matchesData from '../data/matches.json';
import { useAuth } from '../AuthContext';

export default function SeedMatches() {
  const [status, setStatus] = useState('Idle');
  const { user } = useAuth();

  const handleSeed = async () => {
    if (!user) return setStatus('Login first!');
    setStatus('Seeding...');
    try {
      const batch = writeBatch(db);
      let count = 0;
      matchesData.forEach((m: any) => {
        batch.set(doc(db, 'matches', m.id), m);
        count++;
      });
      await batch.commit();
      setStatus(`Successfully seeded ${count} matches!`);
    } catch (e: any) {
      console.error(e);
      setStatus(`Error: ${e.message}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl text-white mb-4">Seed 2026 Matches</h1>
      <button onClick={handleSeed} className="bg-emerald-500 text-black px-4 py-2 font-bold rounded">
        START SEEDING
      </button>
      <p className="mt-4 text-white">{status}</p>
    </div>
  );
}
