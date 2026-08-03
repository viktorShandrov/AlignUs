import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  Users, 
  Clock, 
  Zap, 
  ShieldCheck, 
  Maximize2, 
  Minimize2, 
  Flame,
  Check,
  Globe,
  Sliders,
  Layers
} from 'lucide-react';

interface TvPresentationProps {
  onBackToApp?: () => void;
}

type VariantType = 'neon' | 'cyber' | 'executive';

interface Scenario {
  id: string;
  name: string;
  subtitle: string;
  duration: string;
  participants: { name: string; avatar: string; color: string }[];
  slots: { day: string; time: string; count: number; total: number; isBest?: boolean }[];
  bestTime: string;
  dateStr: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'product-sync',
    name: 'Product & Design Sync',
    subtitle: '4 Participants • 30 Min Slot',
    duration: '30m',
    dateStr: 'This Week',
    participants: [
      { name: 'Viktor S.', avatar: 'VS', color: 'bg-indigo-500' },
      { name: 'Elena R.', avatar: 'ER', color: 'bg-teal-500' },
      { name: 'Alex M.', avatar: 'AM', color: 'bg-amber-500' },
      { name: 'Sophia L.', avatar: 'SL', color: 'bg-fuchsia-500' },
    ],
    slots: [
      { day: 'Wed', time: '14:00 - 14:30', count: 4, total: 4, isBest: true },
      { day: 'Thu', time: '11:00 - 11:30', count: 4, total: 4, isBest: true },
      { day: 'Fri', time: '13:00 - 13:30', count: 3, total: 4 },
    ],
    bestTime: 'Wed @ 14:00 (4/4 Available)',
  },
  {
    id: 'exec-board',
    name: 'Executive Review',
    subtitle: '5 Members • 60 Min Slot',
    duration: '60m',
    dateStr: 'Next Week',
    participants: [
      { name: 'Viktor S.', avatar: 'VS', color: 'bg-indigo-500' },
      { name: 'Marcus K.', avatar: 'MK', color: 'bg-cyan-500' },
      { name: 'Diana P.', avatar: 'DP', color: 'bg-rose-500' },
      { name: 'Julian B.', avatar: 'JB', color: 'bg-emerald-500' },
      { name: 'Clara W.', avatar: 'CW', color: 'bg-violet-500' },
    ],
    slots: [
      { day: 'Tue', time: '15:00 - 16:00', count: 5, total: 5, isBest: true },
      { day: 'Wed', time: '14:00 - 15:00', count: 5, total: 5, isBest: true },
      { day: 'Thu', time: '10:00 - 11:00', count: 3, total: 5 },
    ],
    bestTime: 'Tue @ 15:00 (5/5 Available)',
  },
  {
    id: 'sprint-demo',
    name: 'Tech Demo',
    subtitle: '3 Engineers • 45 Min Slot',
    duration: '45m',
    dateStr: 'Tomorrow',
    participants: [
      { name: 'Viktor S.', avatar: 'VS', color: 'bg-indigo-500' },
      { name: 'David T.', avatar: 'DT', color: 'bg-blue-500' },
      { name: 'Maria C.', avatar: 'MC', color: 'bg-amber-500' },
    ],
    slots: [
      { day: 'Tomorrow', time: '11:15 - 12:00', count: 3, total: 3, isBest: true },
      { day: 'Tomorrow', time: '14:00 - 14:45', count: 3, total: 3, isBest: true },
      { day: 'Tomorrow', time: '16:30 - 17:15', count: 2, total: 3 },
    ],
    bestTime: 'Tomorrow @ 11:15 (3/3 Available)',
  }
];

export const TvPresentation: React.FC<TvPresentationProps> = ({ onBackToApp }) => {
  const [variant, setVariant] = useState<VariantType>('neon');
  const [activeScenarioId, setActiveScenarioId] = useState<string>('product-sync');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const scenario = SCENARIOS.find(s => s.id === activeScenarioId) || SCENARIOS[0];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Error attempting to enable fullscreen:', err);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          console.warn('Error attempting to exit fullscreen:', err);
        });
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className={`h-screen w-screen max-h-screen max-w-screen overflow-hidden select-none font-sans relative flex flex-col justify-between p-4 sm:p-8 ${
      variant === 'neon' 
        ? 'bg-slate-950 text-white' 
        : variant === 'cyber'
        ? 'bg-black text-white'
        : 'bg-zinc-950 text-zinc-100'
    }`}>
      {/* Background Glow Halos */}
      {variant === 'neon' && (
        <>
          <div className="absolute top-0 left-1/3 w-[30rem] h-[30rem] bg-indigo-600/25 rounded-full blur-[130px] pointer-events-none animate-pulse-subtle" />
          <div className="absolute bottom-0 right-10 w-[35rem] h-[35rem] bg-teal-500/20 rounded-full blur-[140px] pointer-events-none" />
        </>
      )}

      {variant === 'cyber' && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[50rem] h-[30rem] bg-gradient-to-b from-cyan-500/20 via-indigo-500/10 to-transparent blur-[110px] pointer-events-none" />
        </>
      )}

      {variant === 'executive' && (
        <>
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 blur-[120px] pointer-events-none" />
        </>
      )}

      {/* TOP FLOATING CONTROLS (Slim Header) */}
      <header className="relative z-50 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBackToApp || (() => window.location.href = '/')}
            className="flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 transition-colors border border-slate-800 shadow-md"
          >
            <span>← Back</span>
          </button>
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-bold">
            <Tv className="w-4 h-4 text-indigo-400" />
            <span className="uppercase tracking-wider">TV Mode</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Selector */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 px-2 uppercase flex items-center gap-1">
              <Layers className="w-3 h-3 text-indigo-400" /> Theme:
            </span>
            {(['neon', 'cyber', 'executive'] as VariantType[]).map((v) => (
              <button
                key={v}
                onClick={() => setVariant(v)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                  variant === v
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {v === 'neon' ? 'Neon' : v === 'cyber' ? 'Cyber' : 'Minimal'}
              </button>
            ))}
          </div>

          {/* Scenario Selector */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 px-2 uppercase flex items-center gap-1">
              <Sliders className="w-3 h-3 text-teal-400" /> Demo:
            </span>
            {SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => setActiveScenarioId(sc.id)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeScenarioId === sc.id
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sc.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center space-x-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-500 text-white hover:brightness-110 shadow-md active:scale-95 transition-all"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          </button>
        </div>
      </header>

      {/* CENTER TV SHOWCASE CONTAINER (Strict 100% Fit) */}
      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-6xl mx-auto w-full py-2">
        
        {/* GIANT APP TITLE & MINIMAL SUBTITLE */}
        <div className="text-center mb-6 shrink-0">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-teal-500/40 bg-teal-500/10 backdrop-blur-md mb-3 shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
            <span className="text-[11px] font-extrabold tracking-widest text-teal-300 uppercase">
              SMART 3+ GROUP MEETING SCHEDULER
            </span>
          </div>

          {/* Main Title: ALIGNUS */}
          <h1 className={`text-6xl sm:text-8xl md:text-9xl font-black tracking-tight leading-none mb-3 ${
            variant === 'neon'
              ? 'text-white drop-shadow-[0_4px_35px_rgba(99,102,241,0.4)]'
              : variant === 'cyber'
              ? 'bg-gradient-to-r from-cyan-300 via-indigo-200 to-fuchsia-300 bg-clip-text text-transparent'
              : 'text-white'
          }`}>
            Align<span className={
              variant === 'neon'
                ? 'text-indigo-400'
                : variant === 'cyber'
                ? 'text-cyan-400'
                : 'text-emerald-400'
            }>Us</span>
          </h1>

          <p className="text-lg sm:text-2xl font-bold text-slate-300 tracking-wide max-w-2xl mx-auto">
            Instant Visual Availability Matching for Groups & Teams
          </p>
        </div>

        {/* COMPACT DEMO SHOWCASE STAGE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center w-full">
          
          {/* LEFT: Live Status Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className={`p-5 rounded-3xl border transition-all ${
              variant === 'neon'
                ? 'bg-slate-900/90 backdrop-blur-2xl border-indigo-500/30 shadow-xl'
                : variant === 'cyber'
                ? 'bg-slate-950/90 backdrop-blur-2xl border-cyan-500/30 shadow-xl'
                : 'bg-zinc-900 border-zinc-800 shadow-xl'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-400 bg-teal-950/90 px-2.5 py-0.5 rounded-full border border-teal-800">
                  {scenario.name}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {scenario.duration} Slot
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span>RESPONDED PARTICIPANTS</span>
                  <span className="text-emerald-400 font-extrabold">4/4 Ready</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {scenario.participants.map((p, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center space-x-2 p-2 rounded-xl bg-slate-950/70 border border-slate-800"
                    >
                      <div className={`w-6 h-6 rounded-lg ${p.color} text-white flex items-center justify-center font-black text-[10px]`}>
                        {p.avatar}
                      </div>
                      <span className="text-xs font-bold text-slate-200 truncate">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Winning Slot Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-teal-950/90 to-slate-900 border border-emerald-500/50 shadow-lg flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 shrink-0 shadow-md">
                <Sparkles className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="truncate">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                  ✨ Winning Overlap Slot
                </p>
                <p className="text-base sm:text-lg font-black text-white truncate">
                  {scenario.bestTime}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Heatmap Visual Card */}
          <div className="lg:col-span-7">
            <div className={`p-5 rounded-3xl border transition-all ${
              variant === 'neon'
                ? 'bg-slate-900/90 backdrop-blur-2xl border-indigo-500/40 shadow-2xl'
                : variant === 'cyber'
                ? 'bg-slate-950/90 backdrop-blur-2xl border-cyan-500/40 shadow-2xl'
                : 'bg-zinc-900 border-zinc-800 shadow-2xl'
            }`}>
              
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white">Visual Overlap Heatmap</h4>
                    <p className="text-[10px] font-semibold text-slate-400">Zero Signup Required</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-300">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> 100% Match
                  </span>
                </div>
              </div>

              {/* Slot Cards List */}
              <div className="space-y-2">
                {scenario.slots.map((s, i) => {
                  const matchPercentage = Math.round((s.count / s.total) * 100);

                  return (
                    <div 
                      key={i}
                      className={`p-3 rounded-xl transition-all border flex items-center justify-between ${
                        s.isBest
                          ? 'bg-gradient-to-r from-emerald-950/95 to-slate-900 border-emerald-500/60 shadow-md scale-[1.01]'
                          : 'bg-slate-950/60 border-slate-800/80 opacity-70'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`px-2.5 py-1 rounded-lg font-black text-xs min-w-[55px] text-center ${
                          s.isBest ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {s.day}
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-white">{s.time}</p>
                          <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                            <Users className="w-3 h-3 text-indigo-400" />
                            {s.count}/{s.total} available ({matchPercentage}%)
                          </p>
                        </div>
                      </div>

                      {s.isBest && (
                        <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                          <span>BEST MATCH</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* MINIMAL BOTTOM BRAND STRIP */}
      <footer className="relative z-10 text-center shrink-0 pt-2">
        <div className="inline-flex items-center space-x-2 text-slate-400 text-xs font-bold bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-800">
          <Globe className="w-3.5 h-3.5 text-teal-400" />
          <span>alignus.app • Instant Group Meeting Alignment</span>
        </div>
      </footer>
    </div>
  );
};
