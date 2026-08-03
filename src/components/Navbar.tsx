import React, { useState } from 'react';
import { Calendar, Share2, Check, Database, Tv } from 'lucide-react';
import { isNeonConfigured } from '../db';

interface NavbarProps {
  sessionTitle?: string;
  onNavigateHome?: () => void;
  onNavigateTv?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  sessionTitle,
  onNavigateHome,
  onNavigateTv,
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-3 lg:px-6 py-2 shadow-2xs transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Compact Logo & Title */}
        <div className="flex items-center space-x-2 cursor-pointer group" onClick={onNavigateHome}>
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Calendar className="w-4 h-4 text-white stroke-[2.5]" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-black text-base tracking-tight text-slate-900">
              Align<span className="text-indigo-600">Us</span>
            </span>
            {sessionTitle && (
              <>
                <span className="text-slate-300">•</span>
                <p className="text-xs text-slate-600 font-bold truncate max-w-[150px] sm:max-w-xs">
                  {sessionTitle}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {onNavigateTv && (
            <button
              onClick={onNavigateTv}
              className="flex items-center space-x-1.5 text-xs font-bold px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all border border-indigo-200/80 shadow-2xs active:scale-95"
              title="Open TV Photo Showcase Mode"
            >
              <Tv className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">TV Showcase</span>
            </button>
          )}

          <div 
            title={isNeonConfigured ? "Connected to Neon DB Postgres" : "Local Browser Storage Active"}
            className={`hidden sm:flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
              isNeonConfigured 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <Database className="w-3 h-3" />
            <span>{isNeonConfigured ? 'Neon DB' : 'Local'}</span>
          </div>

          {sessionTitle && (
            <button
              onClick={handleShare}
              className={`flex items-center space-x-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-2xs active:scale-95 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Share</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};


