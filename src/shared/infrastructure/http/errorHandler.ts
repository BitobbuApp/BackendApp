// src/shared/infrastructure/http/errorHandler.ts
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ApplicationError, ValidationError } from '../../domain/error';
import { captureException } from '../observability/sentry';

export function errorHandler(app: any) {
    app.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply) => {
        // Handle custom application errors
        if (error instanceof ApplicationError) {
            reply.status(error.statusCode).send({
                error: error.name,
                message: error.message,
                ...(error instanceof ValidationError && { details: error.messages })
            });
            return;
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            reply.status(400).send({
                error: 'Validation Error',
                message: error.message
            });
            return;
        }

        // Handle generic custom errors that explicitly provide a statusCode (e.g. UnauthorizedActorError)
        const customStatusCode = (error as any).statusCode;
        if (customStatusCode && typeof customStatusCode === 'number' && customStatusCode >= 400 && customStatusCode < 500) {
            reply.status(customStatusCode).send({
                error: error.name,
                message: error.message
            });
            return;
        }

        // Handle unknown errors
        app.log.error(error);

        // Capture 5xx unhandled exceptions in Sentry
        const context: Record<string, any> = {
            tags: {
                route: request.routeOptions?.url || request.url,
                method: request.method,
                statusCode: 500,
            },
            extra: {
                requestId: request.id,
            }
        };

        const userContext = (request as any).user;
        if (userContext) {
            context.user = {
                id: userContext.userId,
                email: userContext.email,
                companyId: userContext.companyId,
            };
        }

        captureException(error, context);

        reply.status(500).send({
            error: 'Internal Server Error',
            message: 'An unexpected error occurred'
        });
    });
}