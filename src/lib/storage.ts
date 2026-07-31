import { db, isNeonConfigured } from '../db';
import { sessions, participants, availabilities } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { Session, Participant, Availability, DateRangeConfig, FinalizedSlot } from '../types';

const LOCAL_STORAGE_PREFIX = 'syncmeet_demo_';

function getLocalData<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage write error', e);
  }
}

export async function createSession(title: string, dateRange: DateRangeConfig): Promise<Session> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const newSession: Session = {
    id,
    title,
    dateRange,
    finalizedSlot: null,
    createdAt,
  };

  if (isNeonConfigured && db) {
    try {
      await db.insert(sessions).values({
        id,
        title,
        dateRange,
        finalizedSlot: null,
        createdAt: new Date(),
      });
      return newSession;
    } catch (err) {
      console.warn('Neon DB insert session failed, fallback to local:', err);
    }
  }

  const localSessions = getLocalData<Record<string, Session>>('sessions', {});
  localSessions[id] = newSession;
  setLocalData('sessions', localSessions);
  return newSession;
}

export async function getSession(id: string): Promise<Session | null> {
  if (isNeonConfigured && db) {
    try {
      const res = await db.select().from(sessions).where(eq(sessions.id, id));
      if (res.length > 0) {
        const row = res[0];
        return {
          id: row.id,
          title: row.title,
          dateRange: row.dateRange,
          finalizedSlot: row.finalizedSlot || null,
          createdAt: new Date(row.createdAt).toISOString(),
        };
      }
    } catch (err) {
      console.warn('Neon DB getSession failed, fallback to local:', err);
    }
  }

  const localSessions = getLocalData<Record<string, Session>>('sessions', {});
  return localSessions[id] || null;
}

export async function setSessionFinalizedSlot(
  sessionId: string,
  finalizedSlot: FinalizedSlot | null
): Promise<void> {
  if (isNeonConfigured && db) {
    try {
      await db
        .update(sessions)
        .set({ finalizedSlot })
        .where(eq(sessions.id, sessionId));
      return;
    } catch (err) {
      console.warn('Neon DB setFinalizedSlot failed, fallback to local:', err);
    }
  }

  const localSessions = getLocalData<Record<string, Session>>('sessions', {});
  if (localSessions[sessionId]) {
    localSessions[sessionId].finalizedSlot = finalizedSlot;
    setLocalData('sessions', localSessions);
  }
}

export async function getSessionParticipants(sessionId: string): Promise<Participant[]> {
  let rawParticipants: Participant[] = [];

  if (isNeonConfigured && db) {
    try {
      const res = await db.select().from(participants).where(eq(participants.sessionId, sessionId));
      rawParticipants = res.map(r => ({
        id: r.id,
        sessionId: r.sessionId,
        name: r.name,
        note: r.note || null,
        createdAt: new Date(r.createdAt).toISOString(),
      }));
    } catch (err) {
      console.warn('Neon DB getSessionParticipants failed, fallback to local:', err);
      const localParticipants = getLocalData<Record<string, Participant>>('participants', {});
      rawParticipants = Object.values(localParticipants).filter(p => p.sessionId === sessionId);
    }
  } else {
    const localParticipants = getLocalData<Record<string, Participant>>('participants', {});
    rawParticipants = Object.values(localParticipants).filter(p => p.sessionId === sessionId);
  }

  // Deduplicate participants strictly by normalized name string
  const uniqueMap = new Map<string, Participant>();
  rawParticipants.forEach(p => {
    const norm = p.name.trim().toLowerCase();
    if (!norm) return;
    if (!uniqueMap.has(norm)) {
      uniqueMap.set(norm, p);
    } else {
      // Keep note if existing is empty
      const existing = uniqueMap.get(norm)!;
      if (!existing.note && p.note) {
        existing.note = p.note;
      }
    }
  });

  return Array.from(uniqueMap.values());
}

export async function getSessionAvailabilities(sessionId: string): Promise<{
  participants: Participant[];
  availabilities: Availability[];
}> {
  const pts = await getSessionParticipants(sessionId);
  if (pts.length === 0) {
    return { participants: [], availabilities: [] };
  }

  const ptIds = pts.map(p => p.id);

  if (isNeonConfigured && db) {
    try {
      const allAvails: Availability[] = [];
      for (const pId of ptIds) {
        const res = await db.select().from(availabilities).where(eq(availabilities.participantId, pId));
        res.forEach(a => {
          allAvails.push({
            id: a.id,
            participantId: a.participantId,
            startSlot: new Date(a.startSlot).toISOString(),
            endSlot: new Date(a.endSlot).toISOString(),
            isPreferred: a.isPreferred,
          });
        });
      }
      return { participants: pts, availabilities: allAvails };
    } catch (err) {
      console.warn('Neon DB getAvailabilities failed, fallback to local:', err);
    }
  }

  const localAvails = getLocalData<Record<string, Availability>>('availabilities', {});
  const filteredAvails = Object.values(localAvails).filter(a => ptIds.includes(a.participantId));
  return { participants: pts, availabilities: filteredAvails };
}

export async function saveParticipantAvailability(
  sessionId: string,
  participantName: string,
  selectedSlots: Array<{ startSlot: string; endSlot: string; isPreferred: boolean }>,
  note?: string
): Promise<{ participant: Participant; availabilitiesCount: number }> {
  const cleanName = participantName.trim();
  if (!cleanName) {
    throw new Error('Participant name cannot be empty');
  }

  const normName = cleanName.toLowerCase();
  const existingPts = await getSessionParticipants(sessionId);
  
  // Find any existing match by normalized name
  const existingMatch = existingPts.find(p => p.name.trim().toLowerCase() === normName);

  const participantId = existingMatch ? existingMatch.id : crypto.randomUUID();

  const participant: Participant = {
    id: participantId,
    sessionId,
    name: cleanName,
    note: note !== undefined ? note : existingMatch?.note || null,
    createdAt: existingMatch?.createdAt || new Date().toISOString(),
  };

  if (isNeonConfigured && db) {
    try {
      // Fetch all DB records for this session with this name to clean up duplicates
      const allDbPts = await db.select().from(participants).where(eq(participants.sessionId, sessionId));
      const duplicates = allDbPts.filter(p => p.name.trim().toLowerCase() === normName);

      if (duplicates.length === 0) {
        await db.insert(participants).values({
          id: participantId,
          sessionId,
          name: cleanName,
          note: participant.note,
          createdAt: new Date(),
        });
      } else {
        // Update main record
        await db
          .update(participants)
          .set({ name: cleanName, note: participant.note })
          .where(eq(participants.id, participantId));

        // Delete any extra duplicate participant IDs if they were created before
        const extraDuplicateIds = duplicates.map(d => d.id).filter(id => id !== participantId);
        if (extraDuplicateIds.length > 0) {
          await db.delete(participants).where(inArray(participants.id, extraDuplicateIds));
        }
      }

      // Overwrite availabilities for this participant
      await db.delete(availabilities).where(eq(availabilities.participantId, participantId));

      if (selectedSlots.length > 0) {
        await db.insert(availabilities).values(
          selectedSlots.map(s => ({
            id: crypto.randomUUID(),
            participantId,
            startSlot: new Date(s.startSlot),
            endSlot: new Date(s.endSlot),
            isPreferred: s.isPreferred,
          }))
        );
      }

      return { participant, availabilitiesCount: selectedSlots.length };
    } catch (err) {
      console.warn('Neon DB saveAvailability failed, fallback to local:', err);
    }
  }

  // Local storage fallback with strict deduplication
  const localPts = getLocalData<Record<string, Participant>>('participants', {});
  
  // Remove any duplicates with same normalized name
  Object.keys(localPts).forEach(k => {
    if (localPts[k].sessionId === sessionId && localPts[k].name.trim().toLowerCase() === normName) {
      delete localPts[k];
    }
  });

  localPts[participantId] = participant;
  setLocalData('participants', localPts);

  const localAvails = getLocalData<Record<string, Availability>>('availabilities', {});
  Object.keys(localAvails).forEach(k => {
    if (localAvails[k].participantId === participantId) {
      delete localAvails[k];
    }
  });

  selectedSlots.forEach(s => {
    const aId = crypto.randomUUID();
    localAvails[aId] = {
      id: aId,
      participantId,
      startSlot: s.startSlot,
      endSlot: s.endSlot,
      isPreferred: s.isPreferred,
    };
  });
  setLocalData('availabilities', localAvails);

  return { participant, availabilitiesCount: selectedSlots.length };
}
