import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { CreateSession } from './components/CreateSession';
import { CalendarGrid } from './components/CalendarGrid';
import { ParticipantList } from './components/ParticipantList';
import { ResultSummary } from './components/ResultSummary';
import { Session, Participant, Availability } from './types';
import { getSession, getSessionAvailabilities, saveParticipantAvailability } from './lib/storage';
import { generateSlotsForRange } from './lib/dateUtils';
import { computeHeatmapGrid, findBestSlotWindows } from './lib/heatmap';
import { Loader2, AlertCircle } from 'lucide-react';

export function App() {
  // Session state from URL path or query / hash
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
  const [loading, setLoading] = useState<boolean>(Boolean(sessionId));
  const [error, setError] = useState<string | null>(null);

  // User participant identity state
  const [currentName, setCurrentName] = useState<string>(() => {
    return localStorage.getItem('syncmeet_my_name') || '';
  });

  const [hoveredParticipantId, setHoveredParticipantId] = useState<string | null>(null);

  // Sync participant name to localStorage
  const handleNameChange = (name: string) => {
    setCurrentName(name);
    localStorage.setItem('syncmeet_my_name', name);
  };

  // Navigate to session URL
  const navigateToSession = (id: string) => {
    setSessionId(id);
    window.history.pushState({}, '', `/session/${id}`);
  };

  // Navigate back to Home
  const navigateToHome = () => {
    setSessionId(null);
    setSession(null);
    window.history.pushState({}, '', '/');
  };

  // Fetch session data & availabilities
  const loadSessionData = useCallback(async () => {
    if (!sessionId) return;
    try {
      const s = await getSession(sessionId);
      if (!s) {
        setError('Session not found or link has expired.');
        return;
      }
      setSession(s);
      setError(null);

      const { participants: pts, availabilities: avs } = await getSessionAvailabilities(sessionId);
      setParticipants(pts);
      setAvailabilities(avs);
    } catch (err) {
      console.error('Error fetching session:', err);
      setError('Failed to load session data.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Initial load
  useEffect(() => {
    if (sessionId) {
      setLoading(true);
      loadSessionData();
    }
  }, [sessionId, loadSessionData]);

  // High-frequency Real-Time Polling Sync (Every 2 Seconds)
  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(() => {
      loadSessionData();
    }, 2000);
    return () => clearInterval(interval);
  }, [sessionId, loadSessionData]);

  // Save current user's availability selections with instant re-fetch
  const handleSaveMySlots = async (
    slots: Array<{ startSlot: string; endSlot: string; isPreferred: boolean }>
  ) => {
    if (!sessionId || !currentName.trim()) return;

    try {
      await saveParticipantAvailability(sessionId, currentName.trim(), slots);
      await loadSessionData(); // Instant reload after saving
    } catch (err) {
      console.error('Failed saving availability:', err);
    }
  };

  // Extract current user's selected slots mapping
  const myParticipant = participants.find(
    p => p.name.trim().toLowerCase() === currentName.trim().toLowerCase()
  );

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

  // Compute Heatmap and Best Slots
  const { heatmapMap, bestWindows } = React.useMemo(() => {
    if (!session) {
      return { heatmapMap: {}, bestWindows: [] };
    }

    const { allSlots, slotsByDate } = generateSlotsForRange(session.dateRange);
    const heatmap = computeHeatmapGrid(allSlots, participants, availabilities);
    const windows = findBestSlotWindows(slotsByDate, heatmap, participants.length, 60);

    return { heatmapMap: heatmap, bestWindows: windows };
  }, [session, participants, availabilities]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar sessionTitle={session?.title} onNavigateHome={navigateToHome} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {!sessionId ? (
          <CreateSession onSessionCreated={navigateToSession} />
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
            <p className="text-sm font-semibold text-slate-400">Loading session calendar...</p>
          </div>
        ) : error || !session ? (
          <div className="max-w-md mx-auto py-16 text-center space-y-4 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h2 className="text-xl font-bold text-slate-100">Session Not Found</h2>
            <p className="text-sm text-slate-400">{error || 'Invalid session link.'}</p>
            <button
              onClick={navigateToHome}
              className="bg-teal-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-teal-400 transition-colors"
            >
              Create New Session
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Interactive Calendar Grid */}
            <div className="lg:col-span-8 space-y-6">
              <CalendarGrid
                dateRange={session.dateRange}
                heatmapMap={heatmapMap}
                participants={participants}
                currentParticipantName={currentName}
                mySelectedSlots={mySelectedSlots}
                onSaveMySlots={handleSaveMySlots}
                hoveredParticipantId={hoveredParticipantId}
              />
            </div>

            {/* Right Column: Participant Roster & Best Slots Summary */}
            <div className="lg:col-span-4 space-y-6">
              <ParticipantList
                participants={participants}
                availabilities={availabilities}
                currentName={currentName}
                onNameChange={handleNameChange}
                hoveredParticipantId={hoveredParticipantId}
                onHoverParticipant={setHoveredParticipantId}
              />

              <ResultSummary
                bestWindows={bestWindows}
                totalParticipants={participants.length}
                sessionTitle={session.title}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
