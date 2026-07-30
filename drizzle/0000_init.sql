-- SyncMeet Initial Database Migration Plan for Neon / PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "date_range" JSONB NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "participants" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" UUID NOT NULL REFERENCES "sessions"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "availabilities" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "participant_id" UUID NOT NULL REFERENCES "participants"("id") ON DELETE CASCADE,
  "start_slot" TIMESTAMP WITH TIME ZONE NOT NULL,
  "end_slot" TIMESTAMP WITH TIME ZONE NOT NULL,
  "is_preferred" BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_participants_session" ON "participants"("session_id");
CREATE INDEX IF NOT EXISTS "idx_availabilities_participant" ON "availabilities"("participant_id");
