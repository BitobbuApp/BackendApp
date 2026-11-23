import { randomUUID } from 'crypto';
import Joi from 'joi';
import { prisma } from '../../../shared/infrastructure/database';
import { ApplicationError, ValidationError } from '../../../shared/domain/error';
import { storageService } from '../../../shared/infrastructure/storage/storageInstance';
import { CreateNotificationUseCase } from '../../notifications/application/createNotificationUseCase';
import logger from '../../../shared/infrastructure/logger';
import { settings } from '../../settings/application/settingsService';
import { isFreePlan, subscriptionLifecycle } from './subscriptionLifecycleService';

const GENERAL_NOTIFICATION_TYPE = 6;
const RECEIPT_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const reportSchema = Joi.object({
    plan_id: Joi.string().uuid().required(),
    bank_code: Joi.string().pattern(/^\d{4}$/).required(),
    payer_phone: Joi.string().pattern(/^0?4\d{9}$/).required(),
    payer_document: Joi.string().pattern(/^[VEJGPvejgp]-?\d{5,10}$/).required(),
    reference: Joi.string().pattern(/^\d{4,20}$/).required(),
    paid_at: Joi.date().iso().max('now').required(),
});

export interface ReceiptFile { file_name: string; buffer: Buffer; mime_type: string }

const toPublicPayment = (p: any) => ({
    id: p.id,
    plan: p.plan ? { id: p.plan.id, code: p.plan.code, name: p.plan.plan_name, name_es: p.plan.name_es } : undefined,
    amount_usd: Number(p.amount_usd),
    amount_ves: p.amount_ves === null ? null : Number(p.amount_ves),
    exchange_rate: p.exchange_rate === null ? null : Number(p.exchange_rate),
    bank_code: p.bank_code,
    reference: p.reference,
    paid_at: p.paid_at,
    status: p.status,
    rejection_reason: p.rejection_reason,
    reviewed_at: p.reviewed_at,
    created_at: p.created_at,
});

export class SubscriptionPaymentService {
    private readonly notifications = new CreateNotificationUseCase();

    /** Latest official USD -> VES rate, used to show and record the amount in bolívares. */
    async latestUsdVesRate(): Promise<number | null> {
        const rate = await prisma.exchangeRate.findFirst({
            where: { from_currency: 'USD', to_currency: 'VES' },
            orderBy: [{ effective_date: 'desc' }, { created_at: 'desc' }],
        });
        return rate ? Number(rate.rate) : null;
    }

    paymentsEnabled(): boolean {
        return settings.isEnabled('payments.enabled');
    }

    paymentInfo() {
        return {
            enabled: this.paymentsEnabled(),
            method: 'pago_movil',
            bank: settings.get<string>('payments.pago_movil.bank') || null,
            phone: settings.get<string>('payments.pago_movil.phone') || null,
            document_id: settings.get<string>('payments.pago_movil.document_id') || null,
            holder_name: settings.get<string>('payments.pago_movil.holder_name') || null,
        };
    }

    async report(companyId: string, userId: string | undefined, body: any, files: ReceiptFile[]) {
        // Checked first so nothing (not even the receipt) is stored while reception is off.
        if (!this.paymentsEnabled()) {
            throw new ApplicationError(403, 'Por ahora no estamos recibiendo pagos de planes', 'PAYMENTS_DISABLED', 'BUSINESS');
        }
        const { error, value } = reportSchema.validate(body, { abortEarly: false, stripUnknown: true });
        if (error) throw new ValidationError(error.details.map((d) => d.message));

        const receipt = files[0];
        const maxBytes = settings.get<number>('limits.upload_max_bytes') ?? 5 * 1024 * 1024;
        if (!receipt) throw new ValidationError(['El comprobante es requerido']);
        if (!RECEIPT_MIME_TYPES.includes(receipt.mime_type)) throw new ValidationError(['El comprobante debe ser imagen (JPG, PNG, WEBP) o PDF']);
        if (receipt.buffer.length > maxBytes) throw new ValidationError(['El comprobante supera el tamaño permitido']);

        const plan = await prisma.subscriptionPlan.findUnique({ where: { id: value.plan_id } });
        if (!plan || !plan.is_active || isFreePlan(plan)) {
            throw new ApplicationError(400, 'Selecciona un plan pago activo', 'VALIDATION_ERROR', 'VALIDATION');
        }

        const pending = await prisma.subscriptionPayment.findFirst({ where: { company_id: companyId, status: 'pending' } });
        if (pending) {
            throw new ApplicationError(409, 'Ya tienes un pago en revisión; espera su verificación antes de reportar otro', 'PAYMENT_ALREADY_REPORTED', 'CONFLICT');
        }
        const duplicate = await prisma.subscriptionPayment.findUnique({
            where: { bank_code_reference: { bank_code: value.bank_code, reference: value.reference } },
        });
        if (duplicate) {
            throw new ApplicationError(409, 'Esta referencia bancaria ya fue reportada', 'PAYMENT_ALREADY_REPORTED', 'CONFLICT');
        }

        const rate = await this.latestUsdVesRate();
        const amountUsd = Number(plan.price);

        // Receipts are private: only admins read them, through a short-lived signed URL.
        const fileKey = `tenants/${companyId}/subscription-payments/${randomUUID()}`;
        await storageService.uploadFile(receipt.buffer, fileKey, receipt.mime_type);

        const payment = await prisma.subscriptionPayment.create({
            data: {
                company_id: companyId,
                plan_id: plan.id,
                amount_usd: amountUsd,
                exchange_rate: rate,
                amount_ves: rate === null ? null : Math.round(amountUsd * rate * 100) / 100,
                bank_code: value.bank_code,
                payer_phone: value.payer_phone,
                payer_document: value.payer_document.toUpperCase(),
                reference: value.reference,
                paid_at: value.paid_at,
                receipt_file_key: fileKey,
                reported_by_user_id: userId ?? null,
            },
            include: { plan: true },
        });
        return toPublicPayment(payment);
    }

    async listForCompany(companyId: string, take = 10) {
        const items = await prisma.subscriptionPayment.findMany({
            where: { company_id: companyId },
            orderBy: { created_at: 'desc' },
            take,
            include: { plan: true },
        });
        return items.map(toPublicPayment);
    }

    async adminList(filters: { status?: string; company_id?: string }, page: number, limit: number) {
        const where: any = {};
        if (filters.status) where.status = filters.status;
        if (filters.company_id) where.company_id = filters.company_id;
        const [total, items] = await Promise.all([
            prisma.subscriptionPayment.count({ where }),
            prisma.subscriptionPayment.findMany({
                where,
                orderBy: { created_at: filters.status === 'pending' ? 'asc' : 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: { plan: true, company: { select: { id: true, trade_name: true, tax_id: true } } },
            }),
        ]);
        return {
            items: items.map((p) => ({
                ...toPublicPayment(p),
                company: p.company,
                payer_phone: p.payer_phone,
                payer_document: p.payer_document,
                reviewed_by_admin_id: p.reviewed_by_admin_id,
            })),
            total, page, limit, total_pages: Math.ceil(total / limit),
        };
    }

    async receiptUrl(paymentId: string) {
        const payment = await prisma.subscriptionPayment.findUnique({ where: { id: paymentId } });
        if (!payment) throw new ApplicationError(404, 'Payment not found', 'NOT_FOUND', 'NOT_FOUND');
        return { url: await storageService.generateDownloadPresignedUrl(payment.receipt_file_key) };
    }

    /** Verified against the bank by the admin: activates or renews the plan the company paid for. */
    async approve(paymentId: string, adminId: string) {
        const result = await prisma.$transaction(async (tx) => {
            // Conditional update makes a double click (or two admins) approve only once.
            const claimed = await tx.subscriptionPayment.updateMany({
                where: { id: paymentId, status: 'pending' },
                data: { status: 'approved', reviewed_by_admin_id: adminId, reviewed_at: new Date(), updated_at: new Date() },
            });
            if (claimed.count === 0) {
                throw new ApplicationError(409, 'The payment is not pending anymore', 'VALIDATION_ERROR', 'CONFLICT');
            }
            const payment = await tx.subscriptionPayment.findUniqueOrThrow({ where: { id: paymentId }, include: { plan: true } });
            const subscription = await subscriptionLifecycle.activatePlan({
                companyId: payment.company_id,
                planId: payment.plan_id,
                amount: Number(payment.amount_usd),
                paymentReference: payment.reference,
            }, tx);
            await tx.subscriptionPayment.update({ where: { id: paymentId }, data: { subscription_id: subscription.id } });
            return { payment, subscription };
        });

        const end = result.subscription.current_period_end;
        await this.notify(result.payment.company_id, paymentId,
            'Pago aprobado',
            `Tu pago fue verificado. Plan ${result.payment.plan.name_es || result.payment.plan.plan_name} activo${end ? ` hasta el ${end.toLocaleDateString('es-VE')}` : ''}.`);
        return { ...toPublicPayment(result.payment), status: 'approved', subscription_id: result.subscription.id };
    }

    async reject(paymentId: string, adminId: string, reason: string) {
        const claimed = await prisma.subscriptionPayment.updateMany({
            where: { id: paymentId, status: 'pending' },
            data: { status: 'rejected', rejection_reason: reason, reviewed_by_admin_id: adminId, reviewed_at: new Date(), updated_at: new Date() },
        });
        if (claimed.count === 0) {
            throw new ApplicationError(409, 'The payment is not pending anymore', 'VALIDATION_ERROR', 'CONFLICT');
        }
        const payment = await prisma.subscriptionPayment.findUniqueOrThrow({ where: { id: paymentId }, include: { plan: true } });
        await this.notify(payment.company_id, paymentId, 'Pago rechazado', `No pudimos verificar tu pago (ref. ${payment.reference}): ${reason}`);
        return toPublicPayment(payment);
    }

    private async notify(companyId: string, paymentId: string, title: string, message: string) {
        try {
            await this.notifications.execute({
                companyId, typeId: GENERAL_NOTIFICATION_TYPE, title, message,
                link: '/Configuracion?tab=suscripcion', entityType: 'subscription_payment', entityId: paymentId,
            });
        } catch (err) {
            // The review already succeeded; a failed notification must not undo it.
            logger.error({ err, companyId, paymentId }, 'Failed to notify subscription payment review');
        }
    }
}

export const subscriptionPayments = new SubscriptionPaymentService();
