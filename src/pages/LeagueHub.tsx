import React, { useState, useEffect, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, orderBy, onSnapshot, getDocs, where, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Users, Crosshair, MessageSquare, Settings, Copy, Check, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { handleFirestoreError, OperationType } from '../lib/firestore-error';
import { format } from 'date-fns';

export default function LeagueHub() {
  const { leagueId } = useParams();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [league, setLeague] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [userPredictions, setUserPredictions] = useState<Record<string, any>>({});
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [role, setRole] = useState<'host' | 'player'>('player');

  useEffect(() => {
    if (!leagueId || !user) return;
    
    let unsubMembers: any;
    let unsubChat: any;
    let unsubMatches: any;
    let unsubPredictions: any;

    async function loadLeague() {
      try {
        const lDoc = await getDoc(doc(db, 'leagues', leagueId!));
        if (!lDoc.exists()) {
          setLoading(false);
          return;
        }
        setLeague(lDoc.data());
        
        const mDoc = await getDoc(doc(db, 'leagues', leagueId!, 'members', user!.uid));
        if (!mDoc.exists()) {
          setLeague(null); // Not a member
          setLoading(false);
          return;
        }
        setRole(mDoc.data().role);
        
        // Members list
        unsubMembers = onSnapshot(query(collection(db, 'leagues', leagueId!, 'members'), orderBy('points', 'desc')), async (snap) => {
           const memberList: any[] = [];
           for (const d of snap.docs) {
             const mData = d.data();
             // Fetch user profile stats
             const uDoc = await getDoc(doc(db, 'users', d.id));
             memberList.push({ id: d.id, ...mData, profile: uDoc.data() });
           }
           setMembers(memberList);
        });

        // Chat
        unsubChat = onSnapshot(query(collection(db, 'leagues', leagueId!, 'chat'), orderBy('createdAt', 'asc')), (snap) => {
           setChatMessages(snap.docs.map(d => ({id: d.id, ...d.data() })));
        });

        // Matches
        unsubMatches = onSnapshot(query(collection(db, 'matches'), orderBy('kickoffTime', 'asc')), (snap) => {
           setMatches(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });

        // Current User Predictions
        unsubPredictions = onSnapshot(query(collectionGroup(db, 'predictions'), where('userId', '==', user!.uid)), (snap) => {
           const preds: Record<string, any> = {};
           snap.docs.forEach(d => {
             preds[d.data().matchId] = { id: d.id, ...d.data()};
           });
           setUserPredictions(preds);
        });

        setLoading(false);
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, `leagues/${leagueId}`);
        setLoading(false);
      }
    }
    
    loadLeague();
    
    return () => {
      unsubMembers && unsubMembers();
      unsubChat && unsubChat();
      unsubMatches && unsubMatches();
      unsubPredictions && unsubPredictions();
    }
  }, [leagueId, user]);

  const handleCopyCode = () => {
     navigator.clipboard.writeText(league.code);
     setCopied(true);
     setTimeout(() => setCopied(false), 2000);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    try {
      const msgRef = doc(collection(db, 'leagues', leagueId!, 'chat'));
      await setDoc(msgRef, {
        userId: user?.uid,
        text: chatText.trim(),
        createdAt: serverTimestamp()
      });
      setChatText('');
    } catch (e) {
      console.error(e);
    }
  };

  const handlePredictionChange = async (matchId: string, kickoffTime: number, scoreA: number, scoreB: number) => {
    if (Date.now() >= kickoffTime) return; // Locked
    try {
       const pRef = doc(db, 'matches', matchId, 'predictions', user!.uid);
       const pDoc = await getDoc(pRef);
       if (!pDoc.exists()) {
         await setDoc(pRef, {
            userId: user!.uid,
            matchId: matchId,
            scoreA,
            scoreB,
            kickoffTime,
            updatedAt: serverTimestamp(),
            points: 0
         });
       } else {
         await setDoc(pRef, {
            scoreA,
            scoreB,
            updatedAt: serverTimestamp()
         }, { merge: true });
       }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!league) return <Navigate to="/dashboard" />;

  return (
    <div className="w-full max-w-4xl flex flex-col md:h-[calc(100vh-8rem)]">
      
      <div className="bg-gradient-to-r from-slate-900 to-[#0F172A] text-white p-6 relative overflow-hidden shrink-0 rounded-t-3xl border border-slate-800 border-b-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 opacity-20 rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <h1 className="text-3xl font-black italic uppercase mb-2 relative z-10">{league.name}</h1>
        <div className="flex items-center gap-4 text-slate-400 text-sm relative z-10">
          <div className="flex items-center gap-1"><Users className="w-4 h-4"/> {members.length} Members</div>
          <div className="flex items-center gap-1 font-mono tracking-widest bg-slate-950 px-2 py-1 rounded text-emerald-400 border border-emerald-500/20">CODE: {league.code}</div>
        </div>
      </div>

      <div className="flex overflow-x-auto bg-[#0F172A] border border-slate-800 border-x shrink-0 hide-scrollbar px-2">
        {[
          { id: 'leaderboard', icon: Trophy, label: 'LEADERBOARD' },
          { id: 'predictions', icon: Crosshair, label: 'PREDICTIONS' },
          { id: 'chat', icon: MessageSquare, label: 'CHAT' },
          { id: 'settings', icon: Settings, label: 'SETTINGS' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-6 py-4 font-black tracking-wider text-xs transition-colors whitespace-nowrap
              ${activeTab === t.id ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-900 border border-slate-800 border-t-0 rounded-b-3xl relative">
        {activeTab === 'leaderboard' && (
          <div className="p-6">
            <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
              <table className="w-full text-left">
                <thead className="bg-[#0F172A] border-b border-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Player</th>
                    <th className="px-6 py-4 text-center">Score</th>
                    <th className="px-6 py-4 text-center hidden sm:table-cell">Exacts</th>
                    <th className="px-6 py-4 text-center hidden sm:table-cell">Closes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {members.map((m, i) => (
                    <tr key={m.id} className={m.id === user?.uid ? 'bg-emerald-500/5 border-emerald-500/20' : 'hover:bg-slate-800/30'}>
                      <td className="px-6 py-4 font-black">
                        {i === 0 ? <span className="text-amber-500">1</span> : <span className="text-slate-400">{i + 1}</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={m.profile?.photoURL || 'https://via.placeholder.com/40'} alt="" className="w-8 h-8 rounded-full bg-slate-800" />
                          <span className={`font-bold ${m.id === user?.uid ? 'text-emerald-400 uppercase tracking-tighter' : 'text-slate-100'}`}>
                            {m.profile?.displayName || 'Unknown'}
                            {m.role === 'host' && <span className="ml-2 text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Host</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-lg font-mono text-emerald-400">{m.points}</td>
                      <td className="px-6 py-4 text-center text-slate-500 font-mono hidden sm:table-cell">{m.exacts}</td>
                      <td className="px-6 py-4 text-center text-slate-500 font-mono hidden sm:table-cell">{m.closes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="p-6 space-y-6">
            {matches.map(match => {
              const locked = Date.now() >= match.kickoffTime;
              const pred = userPredictions[match.id];
              return (
                <div key={match.id} className={`bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-3xl p-6 md:p-8 border ${locked ? 'border-amber-500/30' : 'border-slate-700'} relative flex flex-col md:flex-row items-center gap-6`}>
                  <div className="flex-1 text-center md:text-left w-full">
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center justify-center md:justify-start gap-2">
                       {match.round} • {format(new Date(match.date), 'MMM d, yyyy • HH:mm')}
                       {locked ? <span className="flex items-center gap-1 text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3"/> Locked</span> : null}
                    </div>
                    <div className="flex items-center justify-around w-full">
                       <span className="font-black text-2xl italic w-24 text-right truncate text-slate-100">{match.teamA}</span>
                       <span className="text-slate-600 font-black px-4">VS</span>
                       <span className="font-black text-2xl italic w-24 text-left truncate text-slate-100">{match.teamB}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-slate-500 text-sm font-mono">{locked ? "YOUR PICK" : "SET PICK"}</div>
                    <div className="flex items-center gap-4">
                      <input 
                        type="number" min="0" max="50" 
                        value={pred?.scoreA ?? ''} 
                        onChange={e => handlePredictionChange(match.id, match.kickoffTime, parseInt(e.target.value) || 0, pred?.scoreB || 0)}
                        className="w-16 h-20 bg-slate-900 border-2 border-slate-700 rounded-xl text-center text-4xl font-black text-emerald-400 focus:border-emerald-500 outline-none disabled:opacity-50 disabled:border-slate-800 disabled:text-slate-500"
                        disabled={locked}
                      />
                      <span className="text-3xl text-slate-700">:</span>
                      <input 
                        type="number" min="0" max="50" 
                        value={pred?.scoreB ?? ''} 
                        onChange={e => handlePredictionChange(match.id, match.kickoffTime, pred?.scoreA || 0, parseInt(e.target.value) || 0)}
                        className="w-16 h-20 bg-slate-900 border-2 border-slate-700 rounded-xl text-center text-4xl font-black text-emerald-400 focus:border-emerald-500 outline-none disabled:opacity-50 disabled:border-slate-800 disabled:text-slate-500"
                        disabled={locked}
                      />
                    </div>
                  </div>
                  
                  {locked && match.status === 'finished' && (
                     <div className="text-sm font-bold flex flex-col items-end md:ml-6 mt-4 md:mt-0">
                       <span className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">ACTUAL</span>
                       <span className="text-emerald-400 text-3xl font-black">{match.scoreA} - {match.scoreB}</span>
                       <span className="text-amber-500 text-sm font-mono mt-1 px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20">+{pred?.points || 0} PTS</span>
                     </div>
                  )}
                </div>
              )
            })}
            
            {matches.length === 0 && (
               <div className="text-center p-8 text-slate-500">No matches scheduled yet!</div>
            )}
            
            <div className="flex justify-center mt-6">
              <span className="text-sm text-slate-500 flex items-center gap-2 font-mono"><Check className="w-4 h-4 text-emerald-500"/> PREDICTIONS AUTOSAVE</span>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-full bg-[#05070A] absolute inset-0 rounded-b-3xl overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
               {chatMessages.map(msg => {
                 const isMe = msg.userId === user?.uid;
                 const sender = members.find(m => m.id === msg.userId);
                 return (
                   <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                     {!isMe && <img src={sender?.profile?.photoURL || 'https://via.placeholder.com/40'} className="w-8 h-8 rounded-full bg-slate-800 mr-2 self-end border border-slate-700" />}
                     <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${isMe ? 'bg-emerald-500 text-slate-950 rounded-br-none font-medium' : 'bg-slate-900 border border-slate-800 text-slate-300 rounded-bl-none'}`}>
                       {!isMe && <div className="text-[10px] font-bold text-emerald-500 mb-1 tracking-wider uppercase">{sender?.profile?.displayName}</div>}
                       <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                     </div>
                   </div>
                 )
               })}
            </div>
            <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
               <form onSubmit={handleChatSubmit} className="flex gap-2">
                 <input 
                   type="text" 
                   value={chatText} 
                   onChange={e => setChatText(e.target.value)}
                   placeholder="Trash talk goes here..."
                   className="flex-1 bg-[#0F172A] border border-slate-800 rounded-xl px-4 py-3 focus:border-emerald-500 focus:bg-slate-950 outline-none text-sm transition-all text-slate-100"
                 />
                 <Button type="submit" className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6" disabled={!chatText.trim()}>SEND</Button>
               </form>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-6">
             <div className="max-w-md mx-auto bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-800 text-center">
               <h3 className="text-xl font-bold text-slate-100 mb-2 uppercase tracking-tight">Invite Friends</h3>
               <p className="text-slate-400 text-sm mb-6">Share this code with your friends so they can join your league.</p>
               
               <div className="flex items-center gap-2 mb-8">
                 <div className="flex-1 bg-[#0F172A] py-3 rounded-xl font-mono text-2xl font-bold tracking-[0.25em] text-emerald-400 border border-slate-800">
                    {league.code}
                 </div>
                 <Button onClick={handleCopyCode} variant="outline" className="h-full px-4 py-3 shrink-0 bg-[#0F172A] border-slate-800 hover:bg-slate-800 text-slate-300">
                   {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-slate-400" />}
                 </Button>
               </div>
               
               <div className="text-left mt-8 pt-6 border-t border-slate-800">
                  <h4 className="font-bold text-slate-300 mb-4 uppercase tracking-wider text-xs">League Settings</h4>
                  <div className="text-sm text-slate-500 space-y-2 font-mono">
                    <p>ROLE: <strong className="uppercase text-slate-300">{role}</strong></p>
                    <p>CREATED: <span className="text-slate-300">{league.createdAt?.toDate ? format(league.createdAt.toDate(), 'PPP') : 'Unknown'}</span></p>
                  </div>
               </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
