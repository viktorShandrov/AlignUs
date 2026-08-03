import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { CreateSession } from './components/CreateSession';
import { CalendarGrid } from './components/CalendarGrid';
import { ParticipantList } from './components/ParticipantList';
import { NameModal } from './components/NameModal';
import { Dashboard } from './components/Dashboard';
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

  const [sessionId, setSessionId] = useState<string | null>(() => {
    const path = window.location.pathname;
    if (path.includes('/session/')) {
      const parts = path.split('/session/');
      return parts[parts.length - 1] || null;
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('session') || null;
  });

  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(sessionId && !isDashboard));
  const [error, setError] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(60); // Default 1 hour
  const [isNameModalOpen, setIsNameModalOpen] = useState<boolean>(false);

  const [currentName, setCurrentName] = useState<string>(() => {
    return localStorage.getItem('syncmeet_my_name') || '';
  });

  const [hoveredParticipantId, setHoveredParticipantId] = useState<string | null>(null);

  const lastSaveTime = React.useRef<number>(0);

  // Track page views on route/path changes
  useEffect(() => {
    trackPageView(currentPath);
  }, [currentPath]);

  const handleNameChange = (name: string) => {
    setCurrentName(name);
    localStorage.setItem('syncmeet_my_name', name);
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

  const myParticipant = participants.find(
    p => (p.userId && p.userId === userId) || (!p.userId && currentName.trim() && p.name.trim().toLowerCase() === currentName.trim().toLowerCase())
  );

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
        if (fetchTime < lastSaveTime.current && myParticipant) {
          const myPtId = myParticipant.id;
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
  }, [sessionId, isDashboard, myParticipant]);

  useEffect(() => {
    if (sessionId && !isDashboard) {
      setLoading(true);
      loadSessionData();
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
    slots: Array<{ startSlot: string; endSlot: string; isPreferred: boolean }>
  ) => {
    if (!sessionId || !currentName.trim()) return;

    lastSaveTime.current = Date.now();

    // Optimistic update of local availabilities state in App.tsx
    const myPtId = myParticipant?.id;
    if (myPtId) {
      const newMyAvails: Availability[] = slots.map(s => ({
        id: crypto.randomUUID(),
        participantId: myPtId,
        startSlot: s.startSlot,
        endSlot: s.endSlot,
        isPreferred: s.isPreferred,
      }));

      setAvailabilities(prevAvails => {
        const others = prevAvails.filter(a => a.participantId !== myPtId);
        return [...others, ...newMyAvails];
      });
    }

    try {
      const result = await saveParticipantAvailability(sessionId, userId, currentName.trim(), slots);
      if (result.participant) {
        setParticipants(prev => {
          const exists = prev.some(p => p.id === result.participant.id);
          if (exists) {
            return prev.map(p => (p.id === result.participant.id ? result.participant : p));
          }
          return [...prev, result.participant];
        });
      }
    } catch (err) {
      console.error('Failed saving availability:', err);
      await loadSessionData();
      throw err;
    }
  };

  const handleFinalizeSlot = async (slot: FinalizedSlot | null) => {
    if (!sessionId) return;
    try {
      await setSessionFinalizedSlot(sessionId, slot);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans relative">
      <Navbar
        sessionTitle={session?.title}
        onNavigateHome={navigateToHome}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4">
        {isDashboard ? (
          <Dashboard onNavigateHome={navigateToHome} />
        ) : !sessionId ? (
          <CreateSession onSessionCreated={navigateToSession} />
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
            {/* Top Participant Bar & Active Roster */}
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
                onFinalizeSlot={handleFinalizeSlot}
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

