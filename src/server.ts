import fastify from 'fastify'
import cors from '@fastify/cors'
import { routes } from './routes'
import { connectDatabase } from './shared/infrastructure/database'
import logger from './shared/infrastructure/logger'


const app = fastify({
    loggerInstance: logger,
});

import { errorHandler } from './shared/infrastructure/http/errorHandler'

// Allow requests from the frontend dev server (and production URL when deployed)
app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

errorHandler(app);

app.register(routes, { prefix: '/api/v1' });

// Health check for Render
app.get('/', async () => {
    return { status: 'ok' }
});


/**
 * Run the server!
 */
export const start = async () => {
    try {
        await connectDatabase();
        await app.listen({
            port: Number(process.env.PORT) || 3000,
            host: '0.0.0.0'
        })
    } catch (err) {
        app.log.error(err)
        process.exit(1)
    }
}