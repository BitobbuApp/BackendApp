import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            '*.password',
            '*.token',
            '*.secret',
            '*.apiKey',
            '*.DATABASE_URL',
            '*.REDIS_URL',
            '*.JWT_SECRET',
        ],
        censor: '[REDACTED]',
    },
    ...(isProduction ? {} : {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            }
        }
    }),
});

export default logger;
