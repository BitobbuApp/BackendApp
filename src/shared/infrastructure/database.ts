// src/shared/infrastructure/database.ts
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

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
        console.log('📦 Successfully connected to PostgreSQL Database');
    } catch (error) {
        console.error('❌ Failed to connect to the database', error);
        process.exit(1);
    }
}

export async function disconnectDatabase() {
    await prisma.$disconnect();
}
