import { prisma } from '../../../shared/infrastructure/database';
import logger from '../../../shared/infrastructure/logger';
import { CreateNotificationUseCase } from '../../notifications/application/createNotificationUseCase';
import { settings } from '../../settings/application/settingsService';
import { DAY_MS } from './planPeriod';
import { subscriptionLifecycle } from './subscriptionLifecycleService';

const GENERAL_NOTIFICATION_TYPE = 6;

/**
 * Daily run: paid plans past their end + grace go back to the free plan, and companies whose
 * plan ends within the notice window get a reminder (once per day).
 */
export class SubscriptionMaintenanceUseCase {
    private readonly notifications = new CreateNotificationUseCase();

    async execute(now = new Date()) {
        const expired = await subscriptionLifecycle.expireOverdue(now);
        for (const companyId of expired) {
            await this.notify(companyId, 'Tu plan venció',
                'Tu plan pago venció y volviste al plan Gratis. Reporta tu pago para reactivarlo.');
        }

        const noticeDays = settings.get<number>('plans.expiry_notice_days') ?? 3;
        const endingSoon = await prisma.subscription.findMany({
            where: {
                is_active: true,
                current_period_end: { gt: now, lte: new Date(now.getTime() + noticeDays * DAY_MS) },
            },
            include: { plan: { select: { plan_name: true, name_es: true } } },
        });
        for (const sub of endingSoon) {
            const days = Math.max(1, Math.ceil((sub.current_period_end!.getTime() - now.getTime()) / DAY_MS));
            await this.notify(sub.company_id, 'Tu plan está por vencer',
                `Tu plan ${sub.plan.name_es || sub.plan.plan_name} vence en ${days} día(s). Reporta tu pago para no perder tus beneficios.`);
        }

        logger.info({ expired: expired.length, reminded: endingSoon.length }, 'Subscription maintenance finished');
        return { expired: expired.length, reminded: endingSoon.length };
    }

    private async notify(companyId: string, title: string, message: string) {
        try {
            await this.notifications.execute({
                companyId, typeId: GENERAL_NOTIFICATION_TYPE, title, message, link: '/Configuracion?tab=suscripcion',
            });
        } catch (err) {
            logger.error({ err, companyId }, 'Failed to send subscription notification');
        }
    }
}
