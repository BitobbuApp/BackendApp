import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { RequestPasswordResetUseCase } from '../../application/requestPasswordResetUseCase';
import { ValidateResetTokenUseCase } from '../../application/validateResetTokenUseCase';
import { ResetPasswordWithTokenUseCase } from '../../application/resetPasswordWithTokenUseCase';
import { SetupTwoFactorUseCase } from '../../application/setupTwoFactorUseCase';
import { EnableTwoFactorUseCase } from '../../application/enableTwoFactorUseCase';
import { DisableTwoFactorUseCase } from '../../application/disableTwoFactorUseCase';
import { RegenerateRecoveryCodesUseCase } from '../../application/regenerateRecoveryCodesUseCase';
import { VerifyLoginTwoFactorUseCase } from '../../application/verifyLoginTwoFactorUseCase';
import { JwtService } from '../../../../shared/application/services/jwtService';

const jwtService = new JwtService();

/**
 * Middleware allowing either full auth OR enrollment step token (mfa_enroll)
 */
async function enrollmentAuthMiddleware(request: any, reply: FastifyReply) {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return ApiResponse.error(reply, 'Authentication token missing', 401, undefined, 'AUTH_MISSING_TOKEN', 'AUTHENTICATION');
    }

    const token = authHeader.split(' ')[1];
    // Check if it's an enrollment token
    const stepDecoded = jwtService.verifyStepToken(token, 'mfa_enroll');
    if (stepDecoded) {
        request.user = {
            userId: stepDecoded.userId,
            email: stepDecoded.email,
        };
        return;
    }

    // Otherwise run standard authMiddleware
    return authMiddleware(request, reply);
}

export async function authRoutes(app: FastifyInstance) {
    // ==========================================
    // 1. Password Recovery Flow
    // ==========================================

    // POST /auth/password/forgot
    app.post('/password/forgot', async (request: FastifyRequest, reply: FastifyReply) => {
        const useCase = new RequestPasswordResetUseCase();
        const body: any = request.body || {};

        const result = await useCase.execute({
            email: body.email,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
        });

        return ApiResponse.success(reply, result, result.message, 202);
    });

    // POST /auth/password/reset/validate
    app.post('/password/reset/validate', async (request: FastifyRequest, reply: FastifyReply) => {
        const useCase = new ValidateResetTokenUseCase();
        const body: any = request.body || {};

        const result = await useCase.execute({
            token: body.token,
        });

        return ApiResponse.success(reply, result, 'Token válido');
    });

    // POST /auth/password/reset
    app.post('/password/reset', async (request: FastifyRequest, reply: FastifyReply) => {
        const useCase = new ResetPasswordWithTokenUseCase();
        const body: any = request.body || {};

        const result = await useCase.execute({
            ...body,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
        });

        return ApiResponse.success(reply, result, result.message);
    });

    // ==========================================
    // 2. Two-Factor Authentication (2FA / TOTP)
    // ==========================================

    // POST /auth/login/2fa (Login challenge completion)
    app.post('/login/2fa', async (request: FastifyRequest, reply: FastifyReply) => {
        const useCase = new VerifyLoginTwoFactorUseCase();
        const body: any = request.body || {};

        const result = await useCase.execute({
            ...body,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
        });

        return ApiResponse.success(reply, result, 'Inicio de sesión exitoso');
    });

    // POST /auth/2fa/setup (Initiate setup, get Base32 secret and QR URI)
    app.post('/2fa/setup', { preHandler: [enrollmentAuthMiddleware] } as any, async (request: any, reply: FastifyReply) => {
        const useCase = new SetupTwoFactorUseCase();
        const result = await useCase.execute({
            userId: request.user.userId,
        });

        return ApiResponse.success(reply, result, 'Configuración de 2FA iniciada');
    });

    // POST /auth/2fa/enable (Confirm 6-digit TOTP code, activate, get recovery codes)
    app.post('/2fa/enable', { preHandler: [enrollmentAuthMiddleware] } as any, async (request: any, reply: FastifyReply) => {
        const useCase = new EnableTwoFactorUseCase();
        const body: any = request.body || {};

        const result = await useCase.execute({
            userId: request.user.userId,
            code: body.code,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
        });

        return ApiResponse.success(reply, result, 'Autenticación de dos factores activada exitosamente');
    });

    // POST /auth/2fa/disable (Deactivate 2FA, verifies password & TOTP)
    app.post('/2fa/disable', { preHandler: [authMiddleware] } as any, async (request: any, reply: FastifyReply) => {
        const useCase = new DisableTwoFactorUseCase();
        const body: any = request.body || {};

        const result = await useCase.execute({
            userId: request.user.userId,
            password: body.password,
            code: body.code,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
        });

        return ApiResponse.success(reply, result, result.message);
    });

    // POST /auth/2fa/recovery-codes (Regenerate recovery codes)
    app.post('/2fa/recovery-codes', { preHandler: [authMiddleware] } as any, async (request: any, reply: FastifyReply) => {
        const useCase = new RegenerateRecoveryCodesUseCase();
        const body: any = request.body || {};

        const result = await useCase.execute({
            userId: request.user.userId,
            code: body.code,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
        });

        return ApiResponse.success(reply, result, 'Códigos de respaldo regenerados');
    });
}
