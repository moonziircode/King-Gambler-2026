import React from 'react';
import { useAuth } from '../AuthContext';
import { Navigate } from 'react-router-dom';
import { ArrowRight, Trophy, Users, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage() {
  const { user, signIn } = useAuth();
  
  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="w-full max-w-4xl pt-12 flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 font-bold uppercase tracking-widest text-xs mb-4 border border-emerald-500/20">
          World Cup 2026 Edition
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-tight">
          Prove You're the <br className="hidden md:block"/>
          <span className="text-emerald-400">Ultimate Pundit</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Create private leagues, predict match scores, and compete with friends in the most engaging World Cup prediction game.
        </p>
        
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const code = (form.elements.namedItem('code') as HTMLInputElement).value;
              try {
                await signIn(code);
              } catch(err: any) {
                alert(err.message);
              }
            }}
            className="w-full max-w-md flex flex-col sm:flex-row gap-4"
          >
            <input 
              name="code"
              type="text" 
              placeholder="MASUKKAN KODE UNIK ANDA" 
              required
              className="flex-1 h-14 bg-[#0F172A] border-2 border-slate-700 rounded-xl text-center text-lg font-bold text-emerald-400 focus:border-emerald-500 outline-none uppercase tracking-widest placeholder:text-slate-600"
            />
        <button
  type="submit"
  className="h-14 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-lg px-8 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all shrink-0"
>
  MULAI
  <ArrowRight className="ml-2 w-5 h-5" />
</button>
          </form>
        </div>
      </motion.div>

      <div className="w-full mt-32 grid md:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900 rounded-3xl p-8 border border-slate-800 flex flex-col items-center text-center"
        >
          <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-3">1. Create or Join</h3>
          <p className="text-slate-400 leading-relaxed text-sm">Start your own private league or join your friends' using a quick invite code.</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900 rounded-3xl p-8 border border-slate-800 flex flex-col items-center text-center"
        >
          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-3">2. Predict Scores</h3>
          <p className="text-slate-400 leading-relaxed text-sm">Enter your predictions before the match kicks off. Blind picks ensure fairness.</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900 rounded-3xl p-8 border border-slate-800 flex flex-col items-center text-center"
        >
          <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/20">
            <Trophy className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-3">3. Win Glory</h3>
          <p className="text-slate-400 leading-relaxed text-sm">Earn points for exact scores and correct outcomes. Climb the live leaderboard.</p>
        </motion.div>
      </div>
    </div>
  );
}
