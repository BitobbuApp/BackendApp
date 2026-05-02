import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { AdminListRfqsUseCase } from '../../application/adminListRfqsUseCase';
import { AdminExportRfqsUseCase } from '../../application/adminExportRfqsUseCase';

interface AdminRfqQuery {
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    company_id?: string;
    category_id?: string;
    serial_number?: string;
    from_date?: string;
    to_date?: string;
}

export async function adminRfqRoutes(app: FastifyInstance) {
    app.get('/export', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Querystring: AdminRfqQuery }>, reply: FastifyReply) => {
        const useCase = new AdminExportRfqsUseCase();
        const csvStream = await useCase.execute({
            search: request.query.search,
            status: request.query.status,
            company_id: request.query.company_id,
            category_id: request.query.category_id ? Number(request.query.category_id) : undefined,
            serial_number: request.query.serial_number ? Number(request.query.serial_number) : undefined,
            from_date: request.query.from_date,
            to_date: request.query.to_date,
        });

        reply.header('Content-Type', 'text/csv; charset=utf-8');
        reply.header('Content-Disposition', 'attachment; filename="rfqs.csv"');

        return reply.send(csvStream);
    });

    app.get('/', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Querystring: AdminRfqQuery }>, reply: FastifyReply) => {
        const useCase = new AdminListRfqsUseCase();
        const result = await useCase.execute({
            page: request.query.page ? Number(request.query.page) : 1,
            limit: request.query.limit ? Number(request.query.limit) : 10,
            search: request.query.search,
            status: request.query.status,
            company_id: request.query.company_id,
            category_id: request.query.category_id ? Number(request.query.category_id) : undefined,
            serial_number: request.query.serial_number ? Number(request.query.serial_number) : undefined,
            from_date: request.query.from_date,
            to_date: request.query.to_date
        });
        return ApiResponse.success(reply, result, "RFQs retrieved successfully");
    });
}
