import fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { routes } from './routes'
import { connectDatabase } from './shared/infrastructure/database'
import logger from './shared/infrastructure/logger'


const app = fastify({
    loggerInstance: logger,
});

import { errorHandler } from './shared/infrastructure/http/errorHandler'

// Allow requests from the frontend dev server (and production URL when deployed)
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(url => url.trim())
    : ['http://localhost:5173'];

app.register(cors, {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

// Register multipart plugin with strict 5MB limit
app.register(multipart, {
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

errorHandler(app);

app.register(routes, { prefix: '/api/v1' });

// Health check for Render
app.get('/', async () => {
    return { status: 'ok' }
});

// Import the socket initialization function
import { initializeSocket } from './shared/infrastructure/socket';
import { connectRedis } from './shared/infrastructure/redis';

/**
 * Run the server!
 */
export const start = async () => {
    try {
        await connectDatabase();
        await connectRedis();
        
        // Initialize Socket.io attached to Fastify's native node server
        initializeSocket(app);

        await app.listen({
            port: Number(process.env.PORT) || 3000,
            host: '0.0.0.0'
        })
    } catch (err) {
        app.log.error(err)
        process.exit(1)
    }
}