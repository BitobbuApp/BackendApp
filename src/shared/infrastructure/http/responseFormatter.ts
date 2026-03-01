import { FastifyReply } from 'fastify';

export class ApiResponse {
    static success(reply: FastifyReply, data: any, message: string = "Success", statusCode: number = 200) {
        return reply.status(statusCode).send({
            success: true,
            message,
            data
        });
    }
}
