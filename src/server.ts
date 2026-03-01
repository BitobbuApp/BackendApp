import fastify from 'fastify'
import { routes } from './routes'


const app = fastify({
    logger: true,
});


app.register(routes, { prefix: '/api/v1' });

/**
 * Run the server!
 */
export const start = async () => {
    try {
        await app.listen({ port: 3000 })
    } catch (err) {
        app.log.error(err)
        process.exit(1)
    }
}