import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';
import { Plus, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '../firebase';
import { collectionGroup, query, where, getDocs, doc, setDoc, getDoc, serverTimestamp, writeBatch, collection } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-error';
interface JoinedLeague {
  id: string;
  name: string;
  role: string;
  points: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [leagues, setLeagues] = useState<JoinedLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [newLeagueName, setNewLeagueName] = useState('');
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (!user) return;
    
    async function fetchLeagues() {
      try {
        const q = query(collectionGroup(db, 'members'), where('userId', '==', user?.uid));
        const membershipDocs = await getDocs(q);
        
        const loadedLeagues: JoinedLeague[] = [];
        for (const mDoc of membershipDocs.docs) {
          const leagueId = mDoc.ref.parent.parent?.id;
          if (leagueId) {
            const leagueSnap = await getDoc(doc(db, 'leagues', leagueId));
            if (leagueSnap.exists()) {
              loadedLeagues.push({
                id: leagueId,
                name: leagueSnap.data().name,
                role: mDoc.data().role,
                points: mDoc.data().points
              });
            }
          }
        }
        setLeagues(loadedLeagues);
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'members');
      } finally {
        setLoading(false);
      }
    }
    
    fetchLeagues();
  }, [user]);

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeagueName.trim()) return;
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const leagueId = doc(collection(db, 'leagues')).id; // Generate ID
      
      const batch = writeBatch(db);
      
      const leagueRef = doc(db, 'leagues', leagueId);
      batch.set(leagueRef, {
        name: newLeagueName,
        hostId: user?.uid,
        code: code,
        createdAt: serverTimestamp()
      });
      
      const memberRef = doc(db, 'leagues', leagueId, 'members', user!.uid);
      batch.set(memberRef, {
        userId: user?.uid,
        role: 'host',
        joinedAt: serverTimestamp(),
        points: 0,
        exacts: 0,
        closes: 0
      });
      
      await batch.commit();
      
      setLeagues(prev => [...prev, { id: leagueId, name: newLeagueName, role: 'host', points: 0 }]);
      setNewLeagueName('');
    } catch (e) {
       console.error("Error creating league", e);
       setError("Failed to create league");
    }
  };

  const handleJoinLeague = async () => {
    if (joinCode.length < 6) return;
    try {
      // Find league by code
      const q = query(collection(db, 'leagues'), where('code', '==', joinCode.toUpperCase()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setError('League not found with that code.');
        return;
      }
      
      const leagueDoc = snap.docs[0];
      const leagueId = leagueDoc.id;
      
      // Check if already a member
      const memberRef = doc(db, 'leagues', leagueId, 'members', user!.uid);
      const memberSnap = await getDoc(memberRef);
      if (memberSnap.exists()) {
         setError('You are already a member of this league.');
         return;
      }
      
      await setDoc(memberRef, {
        userId: user?.uid,
        role: 'player',
        joinedAt: serverTimestamp(),
        points: 0,
        exacts: 0,
        closes: 0
      });
      
      setLeagues(prev => [...prev, { id: leagueId, name: leagueDoc.data().name, role: 'player', points: 0 }]);
      setJoinCode('');
      setError('');
    } catch(e) {
      console.error(e);
      setError("Failed to join league.");
    }
  };

  return (
    <div className="w-full">
      <h1 className="text-3xl font-black text-slate-100 mb-8 uppercase italic tracking-tight">My Dashboard</h1>

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6">{error}</div>}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-500" />
            MY LEAGUES
          </h2>
          
          {loading ? (
            <div className="h-32 flex items-center justify-center bg-slate-900 rounded-3xl border border-slate-800"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : leagues.length === 0 ? (
            <div className="bg-slate-900 rounded-3xl p-8 text-center border border-slate-800 flex flex-col items-center">
               <Users className="w-12 h-12 text-slate-700 mb-4" />
               <p className="text-slate-400 mb-4">You haven't joined any leagues yet.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {leagues.map(league => (
                <Link to={`/league/${league.id}`} key={league.id} className="group bg-slate-900 flex items-center justify-between p-5 rounded-3xl border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all">
                  <div>
                    <h3 className="font-bold text-slate-100 uppercase italic tracking-tighter truncate max-w-[200px]">{league.name}</h3>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs text-amber-500 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{league.points} PTS</span>
                      <span className="text-xs text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded">{league.role.toUpperCase()}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
            <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <Plus className="w-5 h-5 text-emerald-500" />
              Create League
            </h3>
            <form onSubmit={handleCreateLeague} className="space-y-3">
              <input 
                type="text" 
                value={newLeagueName}
                onChange={e => setNewLeagueName(e.target.value)}
                placeholder="League Name..."
                className="w-full px-4 py-3 bg-[#0F172A] border border-slate-700 rounded-xl focus:border-emerald-500 outline-none text-slate-100 text-sm font-medium"
              />
              <Button type="submit" className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl">CREATE</Button>
            </form>
          </div>
          
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
            <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <Users className="w-5 h-5 text-blue-500" />
              Join League
            </h3>
            <div className="space-y-3">
              <input 
                type="text" 
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                placeholder="PROMO CODE"
                className="w-full px-4 py-3 bg-[#0F172A] border border-slate-700 rounded-xl focus:border-blue-500 outline-none text-slate-100 text-sm uppercase font-mono tracking-[0.2em]"
              />
              <Button onClick={handleJoinLeague} className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl" disabled={joinCode.length < 6}>JOIN LEAGUE</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
