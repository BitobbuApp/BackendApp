import { FastifyReply } from 'fastify';

export class ApiResponse {
    static success(reply: FastifyReply, data: any, message: string = "Success", statusCode: number = 200) {
        return reply.status(statusCode).send({
            success: true,
            message,
            data
        });
    }

    static error(reply: FastifyReply, message: string = "Error", statusCode: number = 400, errors?: any) {
        return reply.status(statusCode).send({
            success: false,
            message,
            errors
        });
    }
}
