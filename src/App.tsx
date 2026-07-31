import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { CreateSession } from './components/CreateSession';
import { CalendarGrid } from './components/CalendarGrid';
import { ParticipantList } from './components/ParticipantList';
import { Session, Participant, Availability, FinalizedSlot } from './types';
import { getSession, getSessionAvailabilities, saveParticipantAvailability, setSessionFinalizedSlot } from './lib/storage';
import { generateSlotsForRange } from './lib/dateUtils';
import { computeHeatmapGrid, findBestSlotWindows } from './lib/heatmap';
import { getOrCreateUserId } from './lib/user';
import { Loader2, AlertCircle } from 'lucide-react';

export function App() {
  const [userId] = useState<string>(() => getOrCreateUserId());

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
  const [selectedDuration, setSelectedDuration] = useState<number>(60); // Default 1 hour

  const [currentName, setCurrentName] = useState<string>(() => {
    return localStorage.getItem('syncmeet_my_name') || '';
  });

  const [currentNote, setCurrentNote] = useState<string>(() => {
    return localStorage.getItem('syncmeet_my_note') || '';
  });

  const [hoveredParticipantId, setHoveredParticipantId] = useState<string | null>(null);

  const handleNameChange = (name: string) => {
    setCurrentName(name);
    localStorage.setItem('syncmeet_my_name', name);
  };

  const handleNoteChange = (note: string) => {
    setCurrentNote(note);
    localStorage.setItem('syncmeet_my_note', note);
  };

  const navigateToSession = (id: string) => {
    setSessionId(id);
    window.history.pushState({}, '', `/session/${id}`);
  };

  const navigateToHome = () => {
    setSessionId(null);
    setSession(null);
    window.history.pushState({}, '', '/');
  };

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

  useEffect(() => {
    if (sessionId) {
      setLoading(true);
      loadSessionData();
    }
  }, [sessionId, loadSessionData]);

  // Real-Time Polling Sync (Every 2 Seconds)
  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(() => {
      loadSessionData();
    }, 2000);
    return () => clearInterval(interval);
  }, [sessionId, loadSessionData]);

  const handleSaveMySlots = async (
    slots: Array<{ startSlot: string; endSlot: string; isPreferred: boolean }>
  ) => {
    if (!sessionId || !currentName.trim()) return;

    try {
      await saveParticipantAvailability(sessionId, userId, currentName.trim(), slots, currentNote.trim());
      await loadSessionData();
    } catch (err) {
      console.error('Failed saving availability:', err);
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

  const myParticipant = participants.find(
    p => (p.userId && p.userId === userId) || (!p.userId && currentName.trim() && p.name.trim().toLowerCase() === currentName.trim().toLowerCase())
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
      <Navbar sessionTitle={session?.title} onNavigateHome={navigateToHome} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4">
        {!sessionId ? (
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
              currentNote={currentNote}
              currentUserId={userId}
              onNameChange={handleNameChange}
              onNoteChange={handleNoteChange}
              hoveredParticipantId={hoveredParticipantId}
              onHoverParticipant={setHoveredParticipantId}
            />

            {/* Option B: Embedded Top Pick Card inside CalendarGrid */}
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
    </div>
  );
}

export default App;
