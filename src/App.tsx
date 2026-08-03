import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { CreateSession } from './components/CreateSession';
import { RecentSessionsList } from './components/RecentSessionsList';
import { CalendarGrid } from './components/CalendarGrid';
import { ParticipantList } from './components/ParticipantList';
import { NameModal } from './components/NameModal';
import { Dashboard } from './components/Dashboard';
import { TvPresentation } from './components/TvPresentation';
import { LandingPage } from './components/LandingPage';
import { Session, Participant, Availability, FinalizedSlot } from './types';
import { getSession, getSessionAvailabilities, saveParticipantAvailability, setSessionFinalizedSlot } from './lib/storage';
import { generateSlotsForRange } from './lib/dateUtils';
import { computeHeatmapGrid, findBestSlotWindows } from './lib/heatmap';
import { getOrCreateUserId } from './lib/user';
import { trackPageView } from './lib/analytics';
import { Loader2, AlertCircle } from 'lucide-react';

export function App() {
  const [userId] = useState<string>(() => getOrCreateUserId());

  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);

  const isDashboard = currentPath.startsWith('/dashboard') || currentPath.startsWith('/stats');
  const isTvPage = currentPath.startsWith('/tv') || currentPath.startsWith('/promo') || currentPath.startsWith('/presentation');

  const [sessionId, setSessionId] = useState<string | null>(() => {
    const path = window.location.pathname;
    if (path.includes('/session/')) {
      const parts = path.split('/session/');
      const rawId = parts[parts.length - 1];
      if (rawId) {
        const cleanedId = rawId.split('?')[0].split('#')[0].replace(/\/+$/, '');
        return cleanedId || null;
      }
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('session') || null;
  });

  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(sessionId && !isDashboard && !isTvPage));
  const [error, setError] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(30); // Default 30 minutes
  const [isNameModalOpen, setIsNameModalOpen] = useState<boolean>(false);

  const [currentName, setCurrentName] = useState<string>(() => {
    return localStorage.getItem('alignus_my_name') || localStorage.getItem('syncmeet_my_name') || '';
  });

  const [hoveredParticipantId, setHoveredParticipantId] = useState<string | null>(null);

  const lastSaveTime = React.useRef<number>(0);

  // Track page views on route/path changes
  useEffect(() => {
    trackPageView(currentPath);
  }, [currentPath]);

  const handleNameChange = (name: string) => {
    setCurrentName(name);
    localStorage.setItem('alignus_my_name', name);
  };

  const handleSaveModalName = (name: string) => {
    handleNameChange(name);
    setIsNameModalOpen(false);
  };

  const navigateToSession = (id: string) => {
    setSessionId(id);
    setCurrentPath(`/session/${id}`);
    window.history.pushState({}, '', `/session/${id}`);
  };

  const navigateToHome = () => {
    setSessionId(null);
    setSession(null);
    setCurrentPath('/');
    window.history.pushState({}, '', '/');
  };

  const navigateToDashboard = () => {
    setSessionId(null);
    setSession(null);
    setCurrentPath('/dashboard');
    window.history.pushState({}, '', '/dashboard');
  };

  const navigateToTv = () => {
    setSessionId(null);
    setSession(null);
    setCurrentPath('/tv');
    window.history.pushState({}, '', '/tv');
  };

  const myParticipant = participants.find(
    p => (p.userId && p.userId === userId) || (!p.userId && currentName.trim() && p.name.trim().toLowerCase() === currentName.trim().toLowerCase())
  );

  const myParticipantRef = React.useRef(myParticipant);
  useEffect(() => {
    myParticipantRef.current = myParticipant;
  }, [myParticipant]);

  const loadedSessionIdRef = React.useRef<string | null>(null);

  const loadSessionData = useCallback(async () => {
    if (!sessionId || isDashboard) return;
    const fetchTime = Date.now();
    try {
      const s = await getSession(sessionId);
      if (!s) {
        setError('Session not found or link has expired.');
        return;
      }
      setSession(prev => (JSON.stringify(prev) === JSON.stringify(s) ? prev : s));
      setError(null);

      const { participants: pts, availabilities: avs } = await getSessionAvailabilities(sessionId);
      setParticipants(prevPts => (JSON.stringify(prevPts) === JSON.stringify(pts) ? prevPts : pts));

      setAvailabilities(prevAvs => {
        const activeMyPt = myParticipantRef.current;
        if (fetchTime < lastSaveTime.current && activeMyPt) {
          const myPtId = activeMyPt.id;
          const myLocalAvails = prevAvs.filter(a => a.participantId === myPtId);
          const serverOthersAvails = avs.filter(a => a.participantId !== myPtId);
          return [...serverOthersAvails, ...myLocalAvails];
        }
        return JSON.stringify(prevAvs) === JSON.stringify(avs) ? prevAvs : avs;
      });
    } catch (err) {
      console.error('Error fetching session:', err);
      setError('Failed to load session data.');
    } finally {
      setLoading(false);
    }
  }, [sessionId, isDashboard]);

  useEffect(() => {
    if (sessionId && !isDashboard) {
      if (loadedSessionIdRef.current !== sessionId) {
        loadedSessionIdRef.current = sessionId;
        setLoading(true);
      }
      loadSessionData();
    } else {
      loadedSessionIdRef.current = null;
      setLoading(false);
    }
  }, [sessionId, isDashboard, loadSessionData]);

  // Real-Time Polling Sync (Every 2 Seconds)
  useEffect(() => {
    if (!sessionId || isDashboard) return;
    const interval = setInterval(() => {
      loadSessionData();
    }, 2000);
    return () => clearInterval(interval);
  }, [sessionId, isDashboard, loadSessionData]);

  // Automatically prompt first-time user for name if not set
  useEffect(() => {
    if (sessionId && !loading && session && !currentName.trim() && !isDashboard) {
      setIsNameModalOpen(true);
    }
  }, [sessionId, loading, session, currentName, isDashboard]);

  const handleSaveMySlots = async (
    slots: Array<{ startSlot: string; endSlot: string; isPreferred?: boolean }>
  ) => {
    if (!sessionId || !currentName.trim() || session?.finalizedSlot) return;

    lastSaveTime.current = Date.now();

    const normalizedSlots = slots.map(s => ({
      startSlot: s.startSlot,
      endSlot: s.endSlot,
      isPreferred: false,
    }));

    // Optimistic update of local participants & availabilities state in App.tsx
    let myPtId = myParticipant?.id;
    if (!myPtId) {
      myPtId = crypto.randomUUID();
      const newParticipant: Participant = {
        id: myPtId,
        sessionId,
        userId,
        name: currentName.trim(),
        note: null,
        createdAt: new Date().toISOString(),
      };
      setParticipants(prev => [...prev, newParticipant]);
    }

    const newMyAvails: Availability[] = normalizedSlots.map(s => ({
      id: crypto.randomUUID(),
      participantId: myPtId,
      startSlot: s.startSlot,
      endSlot: s.endSlot,
      isPreferred: false,
    }));

    setAvailabilities(prevAvails => {
      const others = prevAvails.filter(a => a.participantId !== myPtId);
      return [...others, ...newMyAvails];
    });

    // 5-second timeout for server save
    const savePromise = saveParticipantAvailability(sessionId, userId, currentName.trim(), normalizedSlots);
    const timeoutPromise = new Promise<{ participant: Participant; availabilitiesCount: number }>((_, reject) => {
      setTimeout(() => reject(new Error('Връзката със сървъра отне повече от 5 секунди. Моля, опитайте отново.')), 5000);
    });

    try {
      const result = await Promise.race([savePromise, timeoutPromise]);
      if (result.participant) {
        const realPtId = result.participant.id;
        setParticipants(prev => {
          const exists = prev.some(p => p.id === realPtId);
          if (exists) {
            return prev.map(p => (p.id === realPtId ? result.participant : p));
          }
          const withoutTemp = prev.filter(p => p.id !== myPtId);
          return [...withoutTemp, result.participant];
        });

        if (realPtId !== myPtId) {
          setAvailabilities(prev =>
            prev.map(a => (a.participantId === myPtId ? { ...a, participantId: realPtId } : a))
          );
        }
      }
    } catch (err) {
      console.error('Failed saving availability:', err);
      throw err;
    }
  };

  const isCreator = Boolean(session && (!session.creatorUserId || session.creatorUserId === userId));

  const handleFinalizeSlot = async (slot: FinalizedSlot | null) => {
    if (!sessionId) return;
    try {
      await setSessionFinalizedSlot(sessionId, slot, userId);
      await loadSessionData();
    } catch (err) {
      console.error('Failed finalizing slot:', err);
    }
  };

  const mySelectedSlots = React.useMemo(() => {
    if (!myParticipant) return {};
    const map: Record<string, { isPreferred: boolean }> = {};
    availabilities
      .filter(a => a.participantId === myParticipant.id)
      .forEach(a => {
        map[a.startSlot] = { isPreferred: a.isPreferred };
      });
    return map;
  }, [myParticipant, availabilities]);

  const { heatmapMap, bestWindows } = React.useMemo(() => {
    if (!session) {
      return { heatmapMap: {}, bestWindows: [] };
    }

    const { allSlots, slotsByDate } = generateSlotsForRange(session.dateRange);
    const heatmap = computeHeatmapGrid(allSlots, participants, availabilities);
    const windows = findBestSlotWindows(slotsByDate, heatmap, participants.length, selectedDuration);

    return { heatmapMap: heatmap, bestWindows: windows };
  }, [session, participants, availabilities, selectedDuration]);

  if (isTvPage) {
    return <TvPresentation onBackToApp={navigateToHome} />;
  }

  if (!sessionId && !isDashboard) {
    return (
      <LandingPage
        userId={userId}
        onSessionCreated={navigateToSession}
        onOpenTvShowcase={navigateToTv}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans relative">
      <Navbar
        sessionTitle={session?.title}
        onNavigateHome={navigateToHome}
        onNavigateTv={navigateToTv}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4">
        {isDashboard ? (
          <Dashboard onNavigateHome={navigateToHome} />
        ) : !sessionId ? (
          <div className="space-y-6">
            <CreateSession userId={userId} onSessionCreated={navigateToSession} />
            <RecentSessionsList userId={userId} onSelectSession={navigateToSession} />
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs font-bold text-slate-500">Loading session calendar...</p>
          </div>
        ) : error || !session ? (
          <div className="max-w-md mx-auto py-12 text-center space-y-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h2 className="text-lg font-bold text-slate-900">Session Not Found</h2>
            <p className="text-xs text-slate-500">{error || 'Invalid session link.'}</p>
            <button
              onClick={navigateToHome}
              className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-indigo-700 transition-colors"
            >
              Create New Session
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Participant Bar & Active Roster */}
            <ParticipantList
              participants={participants}
              availabilities={availabilities}
              currentName={currentName}
              currentUserId={userId}
              onNameChange={handleNameChange}
              onOpenNameModal={() => setIsNameModalOpen(true)}
              hoveredParticipantId={hoveredParticipantId}
              onHoverParticipant={setHoveredParticipantId}
            />

            {!isCreator && !session.finalizedSlot && (
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-2 text-xs text-amber-800 font-medium flex items-center justify-between shadow-2xs">
                <span className="flex items-center gap-1.5">
                  <span className="text-base">📌</span>
                  Only the session creator can finalize the meeting time slot.
                </span>
              </div>
            )}

            {/* Embedded Top Pick Card inside CalendarGrid */}
            <div className="w-full">
              <CalendarGrid
                dateRange={session.dateRange}
                heatmapMap={heatmapMap}
                participants={participants}
                currentParticipantName={currentName}
                mySelectedSlots={mySelectedSlots}
                onSaveMySlots={handleSaveMySlots}
                hoveredParticipantId={hoveredParticipantId}
                sessionTitle={session.title}
                bestWindows={bestWindows}
                selectedDuration={selectedDuration}
                onDurationChange={setSelectedDuration}
                finalizedSlot={session.finalizedSlot}
                onFinalizeSlot={isCreator ? handleFinalizeSlot : undefined}
              />
            </div>
          </div>
        )}
      </main>

      {/* Name Input & Edit Modal */}
      <NameModal
        isOpen={isNameModalOpen}
        currentName={currentName}
        onSaveName={handleSaveModalName}
        onClose={() => setIsNameModalOpen(false)}
        participants={participants}
        currentUserId={userId}
      />
    </div>
  );
}

export default App;

