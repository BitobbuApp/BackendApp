import { FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { ErrorCode, ErrorCategory } from '../../domain/error-codes';

export class ApiResponse {
    static success(reply: FastifyReply, data: any, message: string = "Success", statusCode: number = 200) {
        return reply.status(statusCode).send({
            success: true,
            message,
            data
        });
    }

    static error(
        reply: FastifyReply,
        message: string = "Error",
        statusCode: number = 400,
        errors?: any,
        code: ErrorCode = "INTERNAL_SERVER_ERROR",
        category: ErrorCategory = "INTERNAL",
        traceId?: string
    ) {
        const reqTraceId = (reply.request?.headers?.['x-trace-id'] as string) || randomUUID();
        const finalTraceId = traceId || reqTraceId;

        return reply.status(statusCode).send({
            success: false,
            error: {
                code,
                message,
                category,
                status: statusCode,
                details: errors || {},
                traceId: finalTraceId
            },
            // Legacy fields
            message,
            ...(errors && { errors })
        });
    }
}
