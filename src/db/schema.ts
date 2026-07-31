import { pgTable, uuid, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { FinalizedSlot } from '../types';

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
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
