import fastify from 'fastify'
import cors from '@fastify/cors'
import { routes } from './routes'
import { connectDatabase } from './shared/infrastructure/database'


const app = fastify({
    logger: true,
});

// Allow requests from the frontend dev server (and production URL when deployed)
app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

app.register(routes, { prefix: '/api/v1' });


/**
 * Run the server!
 */
export const start = async () => {
    try {
        await connectDatabase();
        await app.listen({ port: Number(process.env.PORT) || 3000 })
    } catch (err) {
        app.log.error(err)
        process.exit(1)
    }
}