import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { RegisterUserUseCase } from '../../application/registerUserUseCase';
import { LoginUserUseCase } from '../../application/loginUserUseCase';
import { UpdateUserUseCase } from '../../application/updateUserUseCase';
import { ChangePasswordUseCase } from '../../application/changePasswordUseCase';
import { analyticsDispatcher } from '../../../analytics/application/analyticsDispatcher';
import { extractAnalyticsContext } from '../../../analytics/infrastructure/http/analyticsContext';


export async function userRoutes(app: FastifyInstance) {

    // ==========================================
    // POST /users/register
    // ==========================================
    app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
        const useCase = new RegisterUserUseCase();
        const body: any = request.body || {};
        const outputValue: any = await useCase.execute(request.body);

        const ctx = extractAnalyticsContext(request);
        await analyticsDispatcher.track({
            name: 'user_registered',
            eventId: ctx.eventId,
            sourceUrl: ctx.sourceUrl,
            user: {
                userId: outputValue?.user?.id || outputValue?.id,
                email: outputValue?.user?.email || body.email,
                firstName: body.first_name || body.firstName,
                lastName: body.last_name || body.lastName,
                phone: body.phone,
                ip: ctx.ip,
                userAgent: ctx.userAgent,
                browserIds: ctx.browserIds,
            },
        });

        return ApiResponse.success(reply, outputValue, "User successfully registered", 201);
    });

    // ==========================================
    // POST /users/login
    // ==========================================
    app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
        const useCase = new LoginUserUseCase();
        const outputValue = await useCase.execute({ ...(request.body as any), ip: request.ip });

        return ApiResponse.success(reply, outputValue, "Login successful");
    });

    // ==========================================
    // POST /users/login/2fa
    // ==========================================
    app.post('/login/2fa', async (request: FastifyRequest, reply: FastifyReply) => {
        const { VerifyLoginTwoFactorUseCase } = await import('../../../auth/application/verifyLoginTwoFactorUseCase');
        const useCase = new VerifyLoginTwoFactorUseCase();
        const body: any = request.body || {};
        const outputValue = await useCase.execute({
            ...body,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
        });

        return ApiResponse.success(reply, outputValue, "Login successful");
    });

    // ==========================================
    // POST /users/change-password
    // ==========================================
    app.post('/change-password', { preHandler: [authMiddleware] } as any, async (request: any, reply: FastifyReply) => {
        const useCase = new ChangePasswordUseCase();
        const result = await useCase.execute({
            ...request.body,
            userId: request.user.userId,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
        });
        return ApiResponse.success(reply, result, "Contraseña cambiada exitosamente");
    });

    // ==========================================
    // PATCH /users/profile
    // ==========================================
    app.patch('/profile', { preHandler: [authMiddleware] } as any, async (request: any, reply: FastifyReply) => {
        const useCase = new UpdateUserUseCase();
        const result = await useCase.execute({
            ...request.body,
            id: request.user.userId
        });
        return ApiResponse.success(reply, result, "Profile updated successfully");
    });
}
