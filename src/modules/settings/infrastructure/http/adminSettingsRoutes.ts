import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { adminScopeMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminScopeMiddleware';
import { PrismaAdminRepository } from '../../../admins/infrastructure/persistence/PrismaAdminRepository';
import { MailgunEmailAdapter } from '../../../../shared/infrastructure/notifications/mailgunEmailAdapter';
import { ApplicationError, ValidationError } from '../../../../shared/domain/error';
import { REGISTRY_BY_KEY } from '../../domain/settingsRegistry';
import { settings, SettingsValidationError } from '../../application/settingsService';
import { metaCapiProvider } from '../../../analytics/infrastructure/providers/providerRegistry';

const GROUPS = ['email', 'telegram', 'storage', 'app', 'limits', 'features', 'plans', 'payments', 'marketing'];

async function testTelegram(): Promise<string> {
    const token = settings.get<string>('telegram.bot_token');
    const chatId = settings.get<string>('telegram.chat_id');
    if (!token || !chatId) throw new Error('telegram.bot_token y telegram.chat_id son requeridos');
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: 'Prueba de configuración del sistema (Bitobbu)' }),
    });
    if (!res.ok) throw new Error(`Telegram respondió ${res.status}`);
    return 'Mensaje enviado';
}

export async function adminSettingsRoutes(app: FastifyInstance) {
    const adminRepo = new PrismaAdminRepository();
    const guard = { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin'])] as any };

    app.get('/', guard, async (request: FastifyRequest<{ Querystring: { group?: string } }>, reply: FastifyReply) => {
        const { group } = request.query;
        if (group && !GROUPS.includes(group)) throw new ApplicationError(400, 'Invalid group', 'VALIDATION_ERROR', 'VALIDATION');
        return ApiResponse.success(reply, settings.list(group), 'Settings retrieved successfully');
    });

    // Saves a whole form at once: { values: { "email.enabled": true, "email.from_name": "Bitobbu" } }.
    // All-or-nothing: if any value is invalid nothing is written and every error is returned.
    app.put('/', guard, async (request: FastifyRequest<{ Body: { values?: Record<string, unknown> } }>, reply: FastifyReply) => {
        const values = request.body?.values;
        if (!values || typeof values !== 'object' || Array.isArray(values) || !Object.keys(values).length) {
            throw new ApplicationError(400, 'values must be a non-empty object', 'VALIDATION_ERROR', 'VALIDATION');
        }
        const adminId = request.admin!.adminId;
        let keys: string[];
        try {
            keys = await settings.setMany(values, adminId);
        } catch (e: any) {
            if (e instanceof SettingsValidationError) throw new ValidationError(e.errors);
            throw e;
        }
        // One audit entry per batch; secrets only record that they changed.
        await adminRepo.logAuditAction(adminId, 'update', 'system_setting', null, {
            changes: Object.fromEntries(keys.map((k) => [k, REGISTRY_BY_KEY.get(k)!.secret ? '(changed)' : values[k]])),
        });
        return ApiResponse.success(reply, settings.list(), 'Settings updated successfully');
    });

    app.put('/:key', guard, async (request: FastifyRequest<{ Params: { key: string }, Body: { value: unknown } }>, reply: FastifyReply) => {
        const def = REGISTRY_BY_KEY.get(request.params.key);
        if (!def) throw new ApplicationError(404, 'Unknown setting', 'NOT_FOUND', 'NOT_FOUND');
        if (!request.body || !('value' in request.body)) throw new ApplicationError(400, 'value is required', 'VALIDATION_ERROR', 'VALIDATION');
        const adminId = request.admin!.adminId;
        try {
            await settings.set(def.key, request.body.value, adminId);
        } catch (e: any) {
            throw new ApplicationError(400, e.message, 'VALIDATION_ERROR', 'VALIDATION');
        }
        // Secrets are never written to the audit trail, only the fact that they changed.
        await adminRepo.logAuditAction(adminId, 'update', 'system_setting', def.key, def.secret ? { changed: true } : { value: request.body.value });
        return ApiResponse.success(reply, settings.list().find((s) => s.key === def.key), 'Setting updated successfully');
    });

    app.post('/test/:group', guard, async (request: FastifyRequest<{ Params: { group: string }, Body: { to?: string } }>, reply: FastifyReply) => {
        const { group } = request.params;
        try {
            if (group === 'email') {
                const to = request.body?.to;
                if (!to) throw new Error('to es requerido');
                await new MailgunEmailAdapter().sendTemplate({ to, templateKey: 'welcome', critical: true } as any);
                return ApiResponse.success(reply, { ok: true }, 'Correo de prueba enviado');
            }
            if (group === 'telegram') {
                return ApiResponse.success(reply, { ok: true }, await testTelegram());
            }
            if (group === 'marketing') {
                return ApiResponse.success(reply, { ok: true }, await metaCapiProvider.sendTestEvent());
            }
        } catch (e: any) {
            throw new ApplicationError(422, `La prueba falló: ${e.message}`, 'VALIDATION_ERROR', 'BUSINESS');
        }
        throw new ApplicationError(400, 'No hay prueba para este grupo', 'VALIDATION_ERROR', 'VALIDATION');
    });
}

/** Unauthenticated subset for clients (storage CDN url, maintenance flag, ...). Only keys marked public. */
export async function publicSettingsRoutes(app: FastifyInstance) {
    app.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
        const data: Record<string, unknown> = {};
        for (const item of settings.list()) {
            const def = REGISTRY_BY_KEY.get(item.key)!;
            if (def.public) data[item.key] = item.value;
        }
        return ApiResponse.success(reply, data, 'Public settings retrieved successfully');
    });
}
