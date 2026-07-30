import { db, isNeonConfigured } from '../db';
import { sessions, participants, availabilities } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { Session, Participant, Availability, DateRangeConfig } from '../types';

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
    createdAt,
  };

  if (isNeonConfigured && db) {
    try {
      await db.insert(sessions).values({
        id,
        title,
        dateRange,
        createdAt: new Date(),
      });
      return newSession;
    } catch (err) {
      console.warn('Neon DB insert session failed, fallback to local:', err);
    }
  }

  // Fallback to localStorage
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

export async function getSessionParticipants(sessionId: string): Promise<Participant[]> {
  if (isNeonConfigured && db) {
    try {
      const res = await db.select().from(participants).where(eq(participants.sessionId, sessionId));
      return res.map(r => ({
        id: r.id,
        sessionId: r.sessionId,
        name: r.name,
        createdAt: new Date(r.createdAt).toISOString(),
      }));
    } catch (err) {
      console.warn('Neon DB getSessionParticipants failed, fallback to local:', err);
    }
  }

  const localParticipants = getLocalData<Record<string, Participant>>('participants', {});
  return Object.values(localParticipants).filter(p => p.sessionId === sessionId);
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
  selectedSlots: Array<{ startSlot: string; endSlot: string; isPreferred: boolean }>
): Promise<{ participant: Participant; availabilitiesCount: number }> {
  // Check if participant already exists in this session by name
  const existingPts = await getSessionParticipants(sessionId);
  let participant = existingPts.find(p => p.name.trim().toLowerCase() === participantName.trim().toLowerCase());

  const participantId = participant ? participant.id : crypto.randomUUID();

  if (!participant) {
    participant = {
      id: participantId,
      sessionId,
      name: participantName.trim(),
      createdAt: new Date().toISOString(),
    };
  }

  if (isNeonConfigured && db) {
    try {
      if (!existingPts.some(p => p.id === participantId)) {
        await db.insert(participants).values({
          id: participantId,
          sessionId,
          name: participantName.trim(),
          createdAt: new Date(),
        });
      }

      // Delete existing availabilities for participant to overwrite
      await db.delete(availabilities).where(eq(availabilities.participantId, participantId));

      // Insert new availabilities
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
  // remove existing for participant
  Object.keys(localAvails).forEach(k => {
    if (localAvails[k].participantId === participantId) {
      delete localAvails[k];
    }
  });

  // add new
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
