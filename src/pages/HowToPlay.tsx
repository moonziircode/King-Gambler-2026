import React from 'react';
import { Target, CheckCircle2, ChevronRight, Calculator, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

export default function HowToPlay() {
  return (
    <div className="w-full max-w-4xl bg-slate-900 p-8 md:p-12 rounded-3xl shadow-xl border border-slate-800">
      <h1 className="text-3xl font-black italic uppercase text-slate-100 mb-6 border-b border-slate-800 pb-6 flex items-center gap-3">
        <Calculator className="w-8 h-8 text-emerald-500" />
        Scoring & Rules
      </h1>

      <div className="space-y-8">
        <p className="text-lg text-slate-400 leading-relaxed font-medium">
          The prediction system is designed to reward precision. You earn points based on how close your prediction is to the actual final result of a World Cup match. Predictions are valid only for 90 minutes (plus injury time).
        </p>

        <div className="grid gap-6">
          <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex gap-4 items-start">
            <div className="bg-emerald-500 text-slate-950 p-2 rounded-xl font-black text-lg mt-1 w-12 text-center shrink-0">
               +3
            </div>
            <div>
               <h3 className="text-xl font-black uppercase italic text-emerald-400 mb-2 flex items-center gap-2">
                 Exact Score
                 <Target className="w-5 h-5 text-emerald-500" />
               </h3>
               <p className="text-slate-300 mb-2 font-medium">You predict the exact final score.</p>
               <div className="bg-[#0F172A] border border-slate-800 p-3 rounded-lg text-sm text-emerald-400 font-mono inline-block">
                 Prediction: 2-1 | Result: 2-1
               </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 flex gap-4 items-start">
            <div className="bg-blue-500 text-slate-950 p-2 rounded-xl font-black text-lg mt-1 w-12 text-center shrink-0">
               +1.5
            </div>
            <div>
               <h3 className="text-xl font-black uppercase italic text-blue-400 mb-2 flex items-center gap-2">
                 Close Result
                 <CheckCircle2 className="w-5 h-5 text-blue-500" />
               </h3>
               <p className="text-slate-300 mb-2 font-medium">
                 You predict the correct outcome (Win/Loss/Draw) AND either:<br/>
                 - The goal difference is exactly matched.<br/>
                 - You predicted the exact number of goals for one of the teams.
               </p>
               <div className="flex flex-col sm:flex-row gap-2">
                 <div className="bg-[#0F172A] border border-slate-800 p-3 rounded-lg text-sm text-blue-400 font-mono">
                   Pred: 1-0 | Res: 2-1 (Difference)
                 </div>
                 <div className="bg-[#0F172A] border border-slate-800 p-3 rounded-lg text-sm text-blue-400 font-mono">
                   Pred: 2-0 | Res: 2-1 (Exact goals)
                 </div>
               </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-700 bg-slate-800/30 flex gap-4 items-start">
            <div className="bg-slate-600 text-white p-2 rounded-xl font-black text-lg mt-1 w-12 text-center shrink-0">
               +1
            </div>
            <div>
               <h3 className="text-xl font-black uppercase italic text-slate-100 mb-2">
                 Correct Outcome
               </h3>
               <p className="text-slate-300 mb-2 font-medium">You predict the correct winner or correctly predict a draw, but the score is off.</p>
               <div className="bg-[#0F172A] border border-slate-800 p-3 rounded-lg text-sm text-slate-400 font-mono inline-block">
                 Prediction: 3-0 | Result: 1-0
               </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-slate-800">
           <h3 className="text-xl font-black italic uppercase text-slate-100 mb-4 flex items-center gap-2">
             <ChevronRight className="w-5 h-5 text-amber-500" />
             Rules to Note
           </h3>
           <ul className="list-disc list-inside space-y-3 text-slate-400 font-medium tracking-wide">
              <li><strong className="text-slate-200">Blind Predictions:</strong> All predictions are completely hidden from other players until the match kicks off.</li>
              <li><strong className="text-slate-200">Deadline:</strong> You must enter your predictions before the match kick-off time. No late entries or edits are permitted.</li>
              <li><strong className="text-slate-200">Leaderboard Updates:</strong> Leaderboards update asynchronously shortly after the end of a match.</li>
           </ul>
        </div>
        
        <div className="flex justify-center pt-8">
           <Link to="/dashboard">
             <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black h-12 px-8 rounded-xl">BACK TO DASHBOARD</Button>
           </Link>
        </div>
      </div>
    </div>
  );
}
