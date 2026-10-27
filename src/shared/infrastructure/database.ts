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
    // Opening a connection through the Supabase pooler (TLS + auth) can take several seconds when it opens
    // many at once (e.g. /metadata/app runs ~11 queries in parallel on a cold pool): 5s was too tight
    connectionTimeoutMillis: 10000,
    // TCP keep-alive so idle pooled connections are not silently dropped and have to be re-opened
    keepAlive: true,
});

// An idle client dropped by the pooler emits 'error' on the pool; without a listener it crashes the process
pool.on('error', (err) => {
    logger.error(err, '❌ PostgreSQL pool error (idle client)');
});

// TODO: cache /metadata/app (Redis) — catalogs rarely change and every app load runs ~11 queries;
// invalidate it when the BackOffice changes a catalog (lookups, subcategories, geography).

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
