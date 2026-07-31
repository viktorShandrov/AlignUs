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
        userId: r.userId || null,
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

  return rawParticipants;
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
  userId: string,
  participantName: string,
  selectedSlots: Array<{ startSlot: string; endSlot: string; isPreferred: boolean }>,
  note?: string
): Promise<{ participant: Participant; availabilitiesCount: number }> {
  const cleanName = participantName.trim();
  if (!cleanName) {
    throw new Error('Participant name cannot be empty');
  }

  const existingPts = await getSessionParticipants(sessionId);
  
  // Find any existing match by userId, or fallback to name for legacy records
  const existingMatch = existingPts.find(
    p => (p.userId && p.userId === userId) || (!p.userId && p.name.trim().toLowerCase() === cleanName.toLowerCase())
  );

  // Prevent using a name that is already taken by another participant in the session
  const nameTaken = existingPts.some(
    p => p.id !== existingMatch?.id && p.name.trim().toLowerCase() === cleanName.toLowerCase()
  );

  if (nameTaken) {
    throw new Error(`The name "${cleanName}" is already taken by another participant in this session.`);
  }

  const participantId = existingMatch ? existingMatch.id : crypto.randomUUID();

  const participant: Participant = {
    id: participantId,
    sessionId,
    userId,
    name: cleanName,
    note: note !== undefined ? note : existingMatch?.note || null,
    createdAt: existingMatch?.createdAt || new Date().toISOString(),
  };

  if (isNeonConfigured && db) {
    try {
      if (!existingMatch) {
        await db.insert(participants).values({
          id: participantId,
          sessionId,
          userId,
          name: cleanName,
          note: participant.note,
          createdAt: new Date(),
        });
      } else {
        await db
          .update(participants)
          .set({ userId, name: cleanName, note: participant.note })
          .where(eq(participants.id, participantId));
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

  // Local storage fallback
  const localPts = getLocalData<Record<string, Participant>>('participants', {});
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
