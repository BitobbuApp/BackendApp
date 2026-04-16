// src/shared/infrastructure/http/errorHandler.ts
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ApplicationError, ValidationError } from '../../domain/error';
import { randomUUID } from 'crypto';

export function errorHandler(app: any) {
    app.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply) => {
        const traceId = (request.headers['x-trace-id'] as string) || randomUUID();

        // Handle custom application errors
        if (error instanceof ApplicationError) {
            const details = error instanceof ValidationError ? error.messages : error.details;

            app.log.error({ err: error, traceId, code: error.code, category: error.category }, error.message);

            reply.status(error.statusCode).send({
                success: false,
                error: {
                    code: error.code,
                    message: error.message,
                    category: error.category,
                    status: error.statusCode,
                    details: details || {},
                    traceId
                },
                // Legacy fields for backward compatibility
                message: error.message,
                ...(details && { details })
            });
            return;
        }

        // Handle legacy validation errors just in case
        if (error.name === 'ValidationError') {
            app.log.error({ err: error, traceId, code: "VALIDATION_ERROR", category: "VALIDATION" }, error.message);
            reply.status(400).send({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: error.message,
                    category: "VALIDATION",
                    status: 400,
                    details: {},
                    traceId
                },
                // Legacy fields
                message: error.message
            });
            return;
        }

        // Handle generic custom errors that explicitly provide a statusCode (e.g. UnauthorizedActorError)
        const customStatusCode = (error as any).statusCode;
        if (customStatusCode && typeof customStatusCode === 'number' && customStatusCode >= 400 && customStatusCode < 500) {
            app.log.error({ err: error, traceId, code: "BUSINESS_ERROR", category: "BUSINESS" }, error.message);
            reply.status(customStatusCode).send({
                success: false,
                error: {
                    code: "BUSINESS_ERROR",
                    message: error.message,
                    category: "BUSINESS",
                    status: customStatusCode,
                    details: {},
                    traceId
                },
                // Legacy fields
                message: error.message
            });
            return;
        }

        // Handle unknown errors
        app.log.error({ err: error, traceId, code: "INTERNAL_SERVER_ERROR", category: "INTERNAL" }, 'Unhandled error');
        reply.status(500).send({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "An unexpected error occurred",
                category: "INTERNAL",
                status: 500,
                details: {},
                traceId
            },
            // Legacy fields
            message: "An unexpected error occurred"
        });
    });
}