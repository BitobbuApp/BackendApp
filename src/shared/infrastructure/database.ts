// src/shared/infrastructure/database.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import logger from './logger';

const connectionString = process.env.DATABASE_URL || '';

// Supabase PgBouncer (session mode) has a limited pool_size.
// Cap the pg.Pool to avoid exhausting available connections.
const pool = new Pool({
    connectionString,
    max: 10,                // max simultaneous connections this service holds
    idleTimeoutMillis: 30000,  // release idle connections after 30s
    connectionTimeoutMillis: 5000, // fail fast if no connection is available in 5s
});
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
    adapter,
    log: [
        { emit: 'event', level: 'query' }, // Uncomment this to log every SQL query
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
    ],
});

prisma.$on('error', (e) => {
    logger.error(e, '❌ Prisma Database Error');
});

prisma.$on('warn', (e) => {
    logger.warn(e, '⚠️ Prisma Database Warning');
});

prisma.$on('query', (e) => {
    // logger.info({ query: e.query, params: e.params, duration: e.duration }, '🔍 Prisma Database Query');
});

export async function connectDatabase() {
    try {
        await prisma.$connect();
        logger.info('📦 Successfully connected to PostgreSQL Database');
    } catch (error) {
        logger.error(error, '❌ Failed to connect to the database');
        process.exit(1);
    }
}

export async function disconnectDatabase() {
    await prisma.$disconnect();
}
