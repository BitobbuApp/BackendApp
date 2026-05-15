import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { AdminListTransactionsUseCase } from '../../application/adminListTransactionsUseCase';
import { AdminExportTransactionsUseCase } from '../../application/adminExportTransactionsUseCase';

interface AdminTransactionQuery {
    page?: string;
    limit?: string;
    status?: string;
    buyer_id?: string;
    supplier_id?: string;
    search?: string;
    serial_number?: string;
    from_date?: string;
    to_date?: string;
}

export async function adminTransactionRoutes(app: FastifyInstance) {
    app.get('/export', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Querystring: AdminTransactionQuery }>, reply: FastifyReply) => {
        const useCase = new AdminExportTransactionsUseCase();
        const csvStream = await useCase.execute({
            status: request.query.status,
            buyer_id: request.query.buyer_id,
            supplier_id: request.query.supplier_id,
            search: request.query.search,
            serial_number: request.query.serial_number ? Number(request.query.serial_number) : undefined,
            from_date: request.query.from_date,
            to_date: request.query.to_date,
        });

        reply.header('Content-Type', 'text/csv; charset=utf-8');
        reply.header('Content-Disposition', 'attachment; filename="transactions.csv"');

        return reply.send(csvStream);
    });

    app.get('/', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Querystring: AdminTransactionQuery }>, reply: FastifyReply) => {
        const useCase = new AdminListTransactionsUseCase();
        const result = await useCase.execute({
            page: request.query.page ? Number(request.query.page) : 1,
            limit: request.query.limit ? Number(request.query.limit) : 10,
            status: request.query.status,
            buyer_id: request.query.buyer_id,
            supplier_id: request.query.supplier_id,
            search: request.query.search,
            serial_number: request.query.serial_number ? Number(request.query.serial_number) : undefined,
            from_date: request.query.from_date,
            to_date: request.query.to_date
        });
        return ApiResponse.success(reply, result, "Transactions retrieved successfully");
    });
}
