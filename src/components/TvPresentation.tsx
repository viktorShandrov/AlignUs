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
  ArrowRight,
  Flame,
  Check,
  Globe,
  Share2,
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
    name: 'Product & Design Alignment',
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
      { day: 'Wed', time: '10:00 - 10:30', count: 3, total: 4 },
      { day: 'Wed', time: '14:00 - 14:30', count: 4, total: 4, isBest: true },
      { day: 'Thu', time: '11:00 - 11:30', count: 4, total: 4, isBest: true },
      { day: 'Thu', time: '15:30 - 16:00', count: 2, total: 4 },
      { day: 'Fri', time: '13:00 - 13:30', count: 3, total: 4 },
    ],
    bestTime: 'Wed, Aug 5 @ 14:00 (4/4 Available)',
  },
  {
    id: 'exec-board',
    name: 'Executive Quarterly Review',
    subtitle: '5 Board Members • 60 Min Slot',
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
      { day: 'Tue', time: '09:00 - 10:00', count: 4, total: 5 },
      { day: 'Tue', time: '15:00 - 16:00', count: 5, total: 5, isBest: true },
      { day: 'Wed', time: '14:00 - 15:00', count: 5, total: 5, isBest: true },
      { day: 'Thu', time: '10:00 - 11:00', count: 3, total: 5 },
    ],
    bestTime: 'Tue, Aug 11 @ 15:00 (5/5 Available)',
  },
  {
    id: 'sprint-demo',
    name: 'Engineering Tech Demo',
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
    <div className={`min-h-screen w-full relative select-none font-sans overflow-x-hidden ${
      variant === 'neon' 
        ? 'bg-slate-950 text-white' 
        : variant === 'cyber'
        ? 'bg-black text-white'
        : 'bg-zinc-950 text-zinc-100'
    }`}>
      {/* Background Decorative Ambient Lighting */}
      {variant === 'neon' && (
        <>
          <div className="absolute top-0 left-1/4 w-[35rem] h-[35rem] bg-indigo-600/25 rounded-full blur-[140px] pointer-events-none animate-pulse-subtle" />
          <div className="absolute bottom-0 right-10 w-[40rem] h-[40rem] bg-teal-500/20 rounded-full blur-[150px] pointer-events-none" />
          <div className="absolute top-1/3 right-1/3 w-[25rem] h-[25rem] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
        </>
      )}

      {variant === 'cyber' && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60rem] h-[35rem] bg-gradient-to-b from-cyan-500/20 via-indigo-500/10 to-transparent blur-[120px] pointer-events-none" />
        </>
      )}

      {variant === 'executive' && (
        <>
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[130px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 blur-[130px] pointer-events-none" />
        </>
      )}

      {/* Floating Controls Bar */}
      <div className={`sticky top-0 z-50 px-6 py-3 transition-all duration-300 ${
        isFullscreen ? 'bg-black/40 opacity-20 hover:opacity-100 backdrop-blur-md' : 'bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Back Button */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={onBackToApp || (() => window.location.href = '/')}
              className="flex items-center space-x-2 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            >
              <span>← Back to App</span>
            </button>
            <div className="h-4 w-[1px] bg-slate-800" />
            <div className="flex items-center space-x-2">
              <Tv className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">TV Photo Showcase</span>
            </div>
          </div>

          {/* Controls: Theme & Scenario Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Variant Switcher */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-400" /> Theme:
              </span>
              {(['neon', 'cyber', 'executive'] as VariantType[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVariant(v)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                    variant === v
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {v === 'neon' ? 'Neon Stage ✨' : v === 'cyber' ? 'Cyber Grid 🌐' : 'Minimal Bold 💼'}
                </button>
              ))}
            </div>

            {/* Scenario Switcher */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider flex items-center gap-1">
                <Sliders className="w-3 h-3 text-teal-400" /> Demo:
              </span>
              {SCENARIOS.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => setActiveScenarioId(sc.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeScenarioId === sc.id
                      ? 'bg-teal-600 text-white shadow-sm'
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
              className="flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-500 text-white hover:brightness-110 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullscreen ? 'Exit Fullscreen' : 'TV Fullscreen (F)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN TV SHOWCASE STAGE */}
      <main className="max-w-7xl mx-auto px-6 py-8 sm:py-12 relative z-10 flex flex-col justify-center min-h-[calc(100vh-80px)]">
        
        {/* TOP HERO HEADER */}
        <div className="text-center max-w-4xl mx-auto mb-10 sm:mb-14">
          
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 backdrop-blur-xl mb-6 shadow-lg shadow-teal-950/50">
            <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
            <span className="text-xs font-extrabold tracking-widest text-teal-300 uppercase">
              AlignUs • Smart 3+ Group Meeting Scheduler
            </span>
          </div>

          {/* Main Title */}
          <h1 className={`text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6 ${
            variant === 'neon'
              ? 'text-white drop-shadow-[0_4px_30px_rgba(99,102,241,0.3)]'
              : variant === 'cyber'
              ? 'bg-gradient-to-r from-cyan-300 via-indigo-200 to-fuchsia-300 bg-clip-text text-transparent'
              : 'text-white'
          }`}>
            Group Meetings, <br />
            <span className={
              variant === 'neon'
                ? 'bg-gradient-to-r from-teal-300 via-indigo-300 to-cyan-300 bg-clip-text text-transparent'
                : variant === 'cyber'
                ? 'text-cyan-400'
                : 'text-emerald-400 underline decoration-emerald-500/50 underline-offset-8'
            }>
              Effortlessly Aligned.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-2xl font-medium text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Stop schedule ping-pong. Share one link, let 3+ participants mark availability, and auto-discover optimal overlapping meeting slots in seconds.
          </p>

          {/* Value Badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-bold text-slate-200">
            <div className="flex items-center space-x-2 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-800 shadow-md">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Zero Sign-Up Required</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-800 shadow-md">
              <Flame className="w-4 h-4 text-emerald-400" />
              <span>Visual Heatmap Matching</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-800 shadow-md">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Real-Time Group Sync</span>
            </div>
          </div>
        </div>

        {/* DEMO DISPLAY STAGE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-6xl mx-auto w-full">
          
          {/* LEFT: Scenario Detail & Participant Status */}
          <div className="lg:col-span-5 space-y-6">
            <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${
              variant === 'neon'
                ? 'bg-slate-900/90 backdrop-blur-2xl border-indigo-500/30 shadow-2xl shadow-indigo-950/60'
                : variant === 'cyber'
                ? 'bg-slate-950/90 backdrop-blur-2xl border-cyan-500/30 shadow-2xl shadow-cyan-950/60'
                : 'bg-zinc-900 border-zinc-800 shadow-xl'
            }`}>
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-950/80 px-3 py-1 rounded-full border border-teal-800">
                  Live Session Scenario
                </span>
                <span className="text-xs font-extrabold text-slate-400">
                  {scenario.dateStr}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                {scenario.name}
              </h3>
              <p className="text-sm font-semibold text-slate-400 mb-6 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                {scenario.subtitle}
              </p>

              {/* Participants Stack */}
              <div className="space-y-3 pt-4 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
                  <span>ACTIVE PARTICIPANTS ({scenario.participants.length})</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    All Responded
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {scenario.participants.map((p, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800"
                    >
                      <div className={`w-7 h-7 rounded-lg ${p.color} text-white flex items-center justify-center font-black text-xs shadow-sm`}>
                        {p.avatar}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-200 truncate">{p.name}</p>
                        <p className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 stroke-[3]" /> Available
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Winning Slot Highlight Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-teal-950/80 to-slate-900 border border-emerald-500/40 shadow-xl shadow-emerald-950/40 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 shrink-0 shadow-lg shadow-emerald-500/30">
                <Sparkles className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                  ✨ Optimal Overlapping Winner Slot
                </p>
                <p className="text-base sm:text-lg font-black text-white mt-0.5">
                  {scenario.bestTime}
                </p>
                <p className="text-xs text-slate-300 font-semibold mt-1">
                  Automated visual consensus in 0.4s
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Visual Interactive Heatmap Display Grid */}
          <div className="lg:col-span-7">
            <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${
              variant === 'neon'
                ? 'bg-slate-900/90 backdrop-blur-2xl border-indigo-500/40 shadow-2xl shadow-indigo-950/80'
                : variant === 'cyber'
                ? 'bg-slate-950/90 backdrop-blur-2xl border-cyan-500/40 shadow-2xl shadow-cyan-950/80'
                : 'bg-zinc-900 border-zinc-800 shadow-2xl'
            }`}>
              
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-extrabold text-white">Availability Heatmap</h4>
                    <p className="text-xs font-bold text-slate-400">Darker Green = Higher Participant Overlap</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs font-bold">
                  <span className="flex items-center gap-1 text-slate-400">
                    <span className="w-3 h-3 rounded bg-emerald-500" /> 100%
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <span className="w-3 h-3 rounded bg-emerald-700" /> 75%
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <span className="w-3 h-3 rounded bg-amber-600" /> 50%
                  </span>
                </div>
              </div>

              {/* Slot Cards List */}
              <div className="space-y-3">
                {scenario.slots.map((s, i) => {
                  const matchPercentage = Math.round((s.count / s.total) * 100);

                  return (
                    <div 
                      key={i}
                      className={`p-4 rounded-2xl transition-all border flex items-center justify-between ${
                        s.isBest
                          ? 'bg-gradient-to-r from-emerald-950/90 to-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-950/40 scale-[1.02]'
                          : matchPercentage >= 75
                          ? 'bg-slate-950/70 border-teal-800/50'
                          : 'bg-slate-950/40 border-slate-800/80 opacity-70'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`px-3 py-1.5 rounded-xl font-black text-xs text-center min-w-[60px] ${
                          s.isBest ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-200'
                        }`}>
                          {s.day}
                        </div>
                        <div>
                          <p className="text-base font-extrabold text-white">{s.time}</p>
                          <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Users className="w-3.5 h-3.5 text-indigo-400" />
                            {s.count} of {s.total} members available ({matchPercentage}%)
                          </p>
                        </div>
                      </div>

                      {/* Right Indicator Badge */}
                      <div>
                        {s.isBest ? (
                          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black tracking-wide shadow-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                            <span>WINNER SLOT</span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold px-3 py-1 rounded-lg bg-slate-800 text-slate-400">
                            Partial
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Callout */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-400">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <span>Automatic Local Timezone Conversion Included</span>
                </div>
                <div className="text-indigo-300 font-extrabold">
                  alignus.app
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* BOTTOM BRAND FOOTER (VIBRANT & CAMERA READY) */}
        <div className="mt-12 sm:mt-16 text-center border-t border-slate-800/60 pt-6">
          <div className="inline-flex items-center space-x-3 bg-slate-900/90 border border-slate-800 px-6 py-3 rounded-2xl shadow-xl">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md">
              A
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Align<span className="text-indigo-400">Us</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-teal-400">
              The Modern Group Meeting Scheduler
            </span>
          </div>
        </div>

      </main>
    </div>
  );
};
