// src/shared/infrastructure/database.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import logger from './logger';

const connectionString = process.env.DATABASE_URL || '';

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
    adapter,
    log: ['query', 'info', 'warn', 'error'],
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
