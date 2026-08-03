import { pgTable, uuid, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { FinalizedSlot } from '../types';

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  creatorUserId: text('creator_user_id'),
  dateRange: jsonb('date_range').$type<{
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
  }>().notNull(),
  finalizedSlot: jsonb('finalized_slot').$type<FinalizedSlot>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const participants = pgTable('participants', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  userId: text('user_id'),
  name: text('name').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const availabilities = pgTable('availabilities', {
  id: uuid('id').defaultRandom().primaryKey(),
  participantId: uuid('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
  startSlot: timestamp('start_slot', { withTimezone: true }).notNull(),
  endSlot: timestamp('end_slot', { withTimezone: true }).notNull(),
  isPreferred: boolean('is_preferred').default(false).notNull(),
});

export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventType: text('event_type').notNull(), // 'page_view' | 'session_created' | 'availability_saved' | 'slot_finalized'
  path: text('path').notNull(),
  metadata: jsonb('metadata'),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

