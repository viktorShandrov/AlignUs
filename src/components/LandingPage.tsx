import React, { useState } from 'react';
import { CreateSession } from './CreateSession';
import { 
  Sparkles, 
  Calendar, 
  Users, 
  Clock, 
  Zap, 
  ShieldCheck, 
  Flame, 
  ArrowRight, 
  CheckCircle2, 
  Tv, 
  Globe, 
  Layers, 
  Share2,
  Check
} from 'lucide-react';

interface LandingPageProps {
  userId?: string;
  onSessionCreated: (sessionId: string) => void;
  onOpenTvShowcase: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  userId,
  onSessionCreated,
  onOpenTvShowcase,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden">
      {/* Background Decorative Ambient Lighting */}
      <div className="absolute top-0 left-1/3 w-[35rem] h-[35rem] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none animate-pulse-subtle" />
      <div className="absolute bottom-1/3 right-10 w-[40rem] h-[40rem] bg-teal-500/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 left-10 w-[30rem] h-[30rem] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* TOP BRAND NAVIGATION */}
      <nav className="relative z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5 cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-600/30">
              A
            </div>
            <span className="font-black text-xl tracking-tight text-white">
              Align<span className="text-indigo-400">Us</span>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-1.5 text-xs font-black px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-500 hover:brightness-110 text-white transition-all shadow-lg shadow-indigo-500/25 active:scale-95"
            >
              <span>+ Create Session</span>
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-12 pb-16 text-center">
        {/* Top Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md mb-8 shadow-lg shadow-indigo-950/50">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span className="text-xs font-extrabold tracking-widest text-indigo-300 uppercase">
            Smart 3+ Group Meeting Scheduler
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-[1.08] mb-6 text-white">
          Group Meetings, <br />
          <span className="bg-gradient-to-r from-teal-300 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
            Effortlessly Aligned.
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-lg sm:text-2xl font-medium text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10">
          Stop standard schedule ping-pong. Share one link, let your team drag availability, and automatically discover winning meeting slots in seconds.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 text-base font-black px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/35 transition-all active:scale-95"
          >
            <span>Create Free Meeting Session</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* INTERACTIVE DEMO PREVIEW CARD */}
        <div className="max-w-5xl mx-auto p-6 sm:p-8 rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-indigo-500/30 shadow-2xl shadow-indigo-950/80 text-left">
          
          <div className="flex flex-wrap items-center justify-between pb-6 mb-6 border-b border-slate-800 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">Visual Availability Heatmap Demo</h3>
                <p className="text-xs font-semibold text-slate-400">See overlapping slots for 4 team members</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                <Check className="w-3.5 h-3.5 stroke-[3]" /> 100% Match Overlap
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 to-slate-900 border border-emerald-500/60 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs">
                  Wednesday
                </span>
                <span className="text-[10px] font-black text-emerald-400 uppercase">WINNER</span>
              </div>
              <p className="text-lg font-black text-white">14:00 - 14:30</p>
              <p className="text-xs font-semibold text-slate-300 mt-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-400" /> 4/4 Available (100%)
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-teal-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 font-bold text-xs">
                  Thursday
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">MATCH</span>
              </div>
              <p className="text-lg font-black text-white">11:00 - 11:30</p>
              <p className="text-xs font-semibold text-slate-400 mt-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-400" /> 4/4 Available (100%)
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 opacity-70">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs">
                  Friday
                </span>
                <span className="text-[10px] font-semibold text-slate-500 uppercase">PARTIAL</span>
              </div>
              <p className="text-lg font-black text-white">13:00 - 13:30</p>
              <p className="text-xs font-semibold text-slate-400 mt-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-400" /> 3/4 Available (75%)
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* FEATURE HIGHLIGHTS */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-16 border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Designed for Instant Team Consensus
          </h2>
          <p className="text-slate-400 font-medium text-base sm:text-lg">
            No friction, no logins, no complex calendar integrations needed. Just share a link and align.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Zero Auth Required</h3>
            <p className="text-sm font-medium text-slate-400 leading-relaxed">
              Participants enter their name and drag their free times in seconds without creating accounts.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Visual Heatmap</h3>
            <p className="text-sm font-medium text-slate-400 leading-relaxed">
              Real-time color intensity shows best overlap slots instantly as participants submit choices.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Timezone Sync</h3>
            <p className="text-sm font-medium text-slate-400 leading-relaxed">
              Automatic local timezone conversion ensures everyone sees slots in their own local time.
            </p>
          </div>
        </div>
      </section>

      {/* CREATE SESSION MODAL OVERLAY */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 max-w-xl w-full relative shadow-2xl animate-fadeIn">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-extrabold text-lg px-2"
            >
              ✕
            </button>
            <CreateSession userId={userId} onSessionCreated={onSessionCreated} />
          </div>
        </div>
      )}
    </div>
  );
};
