import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { AdminListQuotesUseCase } from '../../application/adminListQuotesUseCase';
import { AdminExportQuotesUseCase } from '../../application/adminExportQuotesUseCase';

interface AdminQuoteQuery {
    page?: string;
    limit?: string;
    status?: string;
    request_id?: string;
    supplier_id?: string;
    serial_number?: string;
    from_date?: string;
    to_date?: string;
}

export async function adminQuoteResponseRoutes(app: FastifyInstance) {
    app.get('/export', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Querystring: AdminQuoteQuery }>, reply: FastifyReply) => {
        const useCase = new AdminExportQuotesUseCase();
        const csvStream = await useCase.execute({
            status: request.query.status,
            request_id: request.query.request_id,
            supplier_id: request.query.supplier_id,
            serial_number: request.query.serial_number ? Number(request.query.serial_number) : undefined,
            from_date: request.query.from_date,
            to_date: request.query.to_date,
        });

        reply.header('Content-Type', 'text/csv; charset=utf-8');
        reply.header('Content-Disposition', 'attachment; filename="quote-responses.csv"');

        return reply.send(csvStream);
    });

    app.get('/', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Querystring: AdminQuoteQuery }>, reply: FastifyReply) => {
        const useCase = new AdminListQuotesUseCase();
        const result = await useCase.execute({
            page: request.query.page ? Number(request.query.page) : 1,
            limit: request.query.limit ? Number(request.query.limit) : 10,
            status: request.query.status,
            request_id: request.query.request_id,
            supplier_id: request.query.supplier_id,
            serial_number: request.query.serial_number ? Number(request.query.serial_number) : undefined,
            from_date: request.query.from_date,
            to_date: request.query.to_date
        });
        return ApiResponse.success(reply, result, "Quote responses retrieved successfully");
    });
}
