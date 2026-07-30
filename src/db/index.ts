import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const databaseUrl = import.meta.env.VITE_NEON_DATABASE_URL || '';

export const isNeonConfigured = Boolean(databaseUrl && databaseUrl.startsWith('postgres'));

// Drizzle ORM client initialized with Neon HTTP client if URL exists
export const sqlClient = isNeonConfigured ? neon(databaseUrl) : null;
export const db = sqlClient ? drizzle(sqlClient, { schema }) : null;
