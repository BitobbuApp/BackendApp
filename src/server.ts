import fastify from 'fastify'
import { routes } from './routes'
import { connectDatabase } from './shared/infrastructure/database'


const app = fastify({
    logger: true,
});


app.register(routes, { prefix: '/api/v1' });

/**
 * Run the server!
 */
export const start = async () => {
    try {
        await connectDatabase();
        await app.listen({ port: 3000 })
    } catch (err) {
        app.log.error(err)
        process.exit(1)
    }
}