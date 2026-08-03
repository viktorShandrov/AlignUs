import { db, isNeonConfigured } from '../db';
import { analyticsEvents } from '../db/schema';
import { desc } from 'drizzle-orm';
import { getOrCreateUserId } from './user';

export type AnalyticsEventType =
  | 'page_view'
  | 'session_created'
  | 'availability_saved'
  | 'slot_finalized';

export interface AnalyticsEvent {
  id: string;
  eventType: AnalyticsEventType;
  path: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

const LOCAL_ANALYTICS_KEY = 'syncmeet_analytics_events';

function getLocalEvents(): AnalyticsEvent[] {
  try {
    const raw = localStorage.getItem(LOCAL_ANALYTICS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalEvents(events: AnalyticsEvent[]): void {
  try {
    // Keep max 1000 events locally to avoid overflowing LocalStorage
    const trimmed = events.slice(-1000);
    localStorage.setItem(LOCAL_ANALYTICS_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Failed saving analytics events to localStorage:', err);
  }
}

export async function trackEvent(
  eventType: AnalyticsEventType,
  path: string = window.location.pathname,
  metadata?: Record<string, any>
): Promise<AnalyticsEvent> {
  const userId = getOrCreateUserId();
  const event: AnalyticsEvent = {
    id: crypto.randomUUID(),
    eventType,
    path,
    metadata: { userId, ...metadata },
    timestamp: new Date().toISOString(),
  };

  if (isNeonConfigured && db) {
    try {
      await db.insert(analyticsEvents).values({
        id: event.id,
        eventType: event.eventType,
        path: event.path,
        metadata: event.metadata || null,
        timestamp: new Date(event.timestamp),
      });
      return event;
    } catch (err) {
      console.warn('Neon DB trackEvent failed, falling back to local storage:', err);
    }
  }

  const events = getLocalEvents();
  events.push(event);
  saveLocalEvents(events);
  return event;
}

export function trackPageView(path: string = window.location.pathname) {
  const userId = getOrCreateUserId();
  const FIFTEEN_MINUTES = 15 * 60 * 1000;
  const storageKey = `last_pv_${userId}_${path}`;
  const lastTracked = localStorage.getItem(storageKey);
  const now = Date.now();

  if (lastTracked && now - parseInt(lastTracked, 10) < FIFTEEN_MINUTES) {
    return;
  }
  localStorage.setItem(storageKey, now.toString());
  trackEvent('page_view', path, { userId, referrer: document.referrer || 'direct' });
}

export async function fetchAnalyticsEvents(): Promise<AnalyticsEvent[]> {
  let dbEvents: AnalyticsEvent[] = [];

  if (isNeonConfigured && db) {
    try {
      const res = await db
        .select()
        .from(analyticsEvents)
        .orderBy(desc(analyticsEvents.timestamp));

      dbEvents = res.map(r => ({
        id: r.id,
        eventType: r.eventType as AnalyticsEventType,
        path: r.path,
        metadata: (r.metadata as Record<string, any>) || undefined,
        timestamp: new Date(r.timestamp).toISOString(),
      }));
    } catch (err) {
      console.warn('Neon DB fetchAnalyticsEvents failed, falling back to local storage:', err);
    }
  }

  const localEvents = getLocalEvents();
  
  // Merge and deduplicate by id
  const map = new Map<string, AnalyticsEvent>();
  [...dbEvents, ...localEvents].forEach(ev => {
    map.set(ev.id, ev);
  });

  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const isCleared = localStorage.getItem('syncmeet_analytics_cleared') === 'true';

  if (merged.length === 0 && !isCleared) {
    return seedDemoAnalyticsData();
  }

  return merged;
}

export function seedDemoAnalyticsData(): AnalyticsEvent[] {
  const events: AnalyticsEvent[] = [];
  const now = Date.now();
  const HOUR = 3600 * 1000;
  const DAY = 24 * HOUR;

  // Generate realistic traffic history over the last 7 days
  const titles = ['Team Sync Q3', 'Project Kickoff', 'Design Review', 'Sprint Planning', 'Client Demo'];
  const names = ['Alex', 'Elena', 'Maria', 'Stefan', 'Nikolay', 'Ivan', 'Gergana'];
  const demoUsers = [
    'usr_alex_89', 'usr_elena_12', 'usr_maria_44', 'usr_stefan_07',
    'usr_nikolay_99', 'usr_ivan_31', 'usr_gergana_55', 'usr_peter_18',
    'usr_kaloyan_22', 'usr_teodora_63', 'usr_boris_71', 'usr_desislava_88',
    'usr_viktoria_05', 'usr_martin_42', 'usr_simona_90'
  ];

  for (let i = 0; i < 45; i++) {
    const timeOffset = Math.random() * (7 * DAY);
    const ts = new Date(now - timeOffset).toISOString();
    const userId = demoUsers[i % demoUsers.length];
    const sessionPath = '/session/' + crypto.randomUUID().slice(0, 8);

    // Page views (Direct shared links to sessions)
    events.push({
      id: crypto.randomUUID(),
      eventType: 'page_view',
      path: sessionPath,
      timestamp: ts,
      metadata: { userId, referrer: 'direct', isDirectShare: true },
    });

    // Session creations
    if (i % 4 === 0) {
      events.push({
        id: crypto.randomUUID(),
        eventType: 'session_created',
        path: '/',
        timestamp: new Date(new Date(ts).getTime() + 1000).toISOString(),
        metadata: { userId, title: titles[i % titles.length] },
      });
    }

    // Availability saves
    if (i % 2 === 0) {
      events.push({
        id: crypto.randomUUID(),
        eventType: 'availability_saved',
        path: sessionPath,
        timestamp: new Date(new Date(ts).getTime() + 5000).toISOString(),
        metadata: { userId, participantName: names[i % names.length], slotsCount: Math.floor(Math.random() * 8) + 2 },
      });
    }

    // Finalizations
    if (i % 6 === 0) {
      events.push({
        id: crypto.randomUUID(),
        eventType: 'slot_finalized',
        path: sessionPath,
        timestamp: new Date(new Date(ts).getTime() + 12000).toISOString(),
        metadata: { userId, sessionTitle: titles[i % titles.length] },
      });
    }
  }

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  localStorage.removeItem('syncmeet_analytics_cleared');
  saveLocalEvents(events);
  return events;
}

export async function clearAnalyticsData(): Promise<void> {
  localStorage.removeItem(LOCAL_ANALYTICS_KEY);
  localStorage.setItem('syncmeet_analytics_cleared', 'true');
  if (isNeonConfigured && db) {
    try {
      await db.delete(analyticsEvents);
    } catch (err) {
      console.warn('Neon DB clearAnalyticsData failed:', err);
    }
  }
}
