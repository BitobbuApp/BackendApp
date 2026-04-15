// src/shared/infrastructure/http/errorHandler.ts
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ApplicationError, ValidationError } from '../../domain/error';
import { parseTelegramConfig } from '../config/telegramConfig';
import { TelegramErrorNotifierService } from '../notifications/telegramErrorNotifierService';

export function errorHandler(app: any) {
    // Initialize the notifier (will parse config and fail fast if invalid)
    const telegramConfig = parseTelegramConfig();
    const notifier = new TelegramErrorNotifierService(telegramConfig);

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

        // Notify critical error
        const notificationInput: any = {
            app: 'BackendApp',
            environment: process.env.NODE_ENV || 'development',
            severity: 'error', // default to error severity for 5xx unhandled exceptions
            route: request.url,
            method: request.method,
            errorName: error.name || 'UnknownError',
            errorMessage: error.message || 'An unexpected error occurred',
            requestId: request.id,
            timestamp: new Date().toISOString()
        };

        if (error.stack) notificationInput.stackTrace = error.stack;
        if ((request as any).user?.userId) notificationInput.userId = (request as any).user.userId;
        if ((request as any).user?.companyId) notificationInput.companyId = (request as any).user.companyId;

        notifier.notifyCriticalError(notificationInput).catch(err => {
            // Log notification failures but don't block response
            app.log.error({ err }, 'Failed to trigger Telegram notification in errorHandler');
        });

        reply.status(500).send({
            error: 'Internal Server Error',
            message: 'An unexpected error occurred'
        });
    });
}