import React from 'react';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';
import { Trophy, LogOut, Home, Info } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#05070A] font-sans text-slate-100 flex flex-col">
      <header className="bg-[#0F172A] border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👑</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">KING GAMBLER <span className="text-emerald-400">2026</span></span>
          </Link>
          
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link to="/rules" className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 transition-colors">
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">RULES</span>
            </Link>
            
            {user && profile && (
              <div className="flex items-center gap-4">
                <Link to="/dashboard" className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 transition-colors">
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">DASHBOARD</span>
                </Link>
                <div className="flex items-center gap-3 pl-8 border-l border-slate-800">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-white">{profile.displayName}</div>
                    <div className="text-xs text-amber-500 font-mono">{profile.totalPoints} POINTS</div>
                  </div>
                  {profile.photoURL ? (
                    <img src={profile.photoURL} alt={profile.displayName} className="w-10 h-10 rounded-full bg-slate-700 border-2 border-emerald-500" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border-2 border-emerald-500 font-bold text-sm">
                      {profile.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <button onClick={logout} className="p-1.5 hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-red-400" title="Log out">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </nav>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center py-8 px-4 w-full h-full max-w-5xl mx-auto">
        {children}
      </main>
    </div>
  );
};
