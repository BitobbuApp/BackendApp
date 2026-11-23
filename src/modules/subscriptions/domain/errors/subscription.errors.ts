import { ApplicationError } from '../../../../shared/domain/error';

const LABELS: Record<string, string> = {
  quote: 'cotizaciones por mes',
  offer: 'ofertas activas',
};

/** 402 with the numbers the client needs to show an upgrade prompt. */
export class PlanLimitReachedError extends ApplicationError {
  constructor(operation: 'quote' | 'offer', limit: number, used: number, planCode: string) {
    super(
      402,
      `Alcanzaste el límite de ${LABELS[operation]} de tu plan (${used}/${limit}).`,
      'PLAN_LIMIT_REACHED',
      'BUSINESS',
      { operation, limit, used, plan_code: planCode },
    );
  }
}
