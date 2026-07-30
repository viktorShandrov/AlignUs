import React, { useState } from 'react';
import { Calendar, Share2, Check, Sparkles, Database } from 'lucide-react';
import { isNeonConfigured } from '../db';

interface NavbarProps {
  sessionTitle?: string;
  onNavigateHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ sessionTitle, onNavigateHome }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5 shadow-xl transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={onNavigateHome}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 via-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
            <Calendar className="w-5.5 h-5.5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Sync<span className="text-teal-400">Meet</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                Real-Time
              </span>
            </div>
            {sessionTitle && (
              <p className="text-xs text-slate-400 font-medium truncate max-w-[200px] sm:max-w-xs">
                {sessionTitle}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {/* DB Indicator badge */}
          <div 
            title={isNeonConfigured ? "Connected to Neon DB Postgres" : "Local Browser Storage Active (Add VITE_NEON_DATABASE_URL to enable Neon DB)"}
            className={`hidden md:flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
              isNeonConfigured 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isNeonConfigured ? 'Neon DB' : 'Local Storage'}</span>
          </div>

          {sessionTitle && (
            <button
              onClick={handleShare}
              className={`flex items-center space-x-2 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl transition-all shadow-md active:scale-95 ${
                copied
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                  : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/20'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Share Session</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
