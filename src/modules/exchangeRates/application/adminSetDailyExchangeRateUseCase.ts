import Joi from "joi";
import { UseCase } from "../../../shared/application/useCase";
import { prisma } from "../../../shared/infrastructure/database";
import { settings } from "../../settings/application/settingsService";
import { exchangeRateDtoResponseSchema } from "./dtos/exchangeRate.dto";

interface SetDailyExchangeRateInput {
    rate: number;
    from_currency?: string;
    to_currency?: string;
    source?: string;
    effective_date?: string;
}

/** Today's date (YYYY-MM-DD) in the business timezone, so a rate loaded at 9pm in Caracas is not "tomorrow" in UTC. */
function businessToday(): string {
    const timeZone = settings.get<string>('plans.usage_timezone') || 'America/Caracas';
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

/**
 * Manual load of the day's rate (e.g. BCV). Upserts on (pair, source, date): loading it again the
 * same day corrects the value instead of failing on the unique constraint.
 */
export class AdminSetDailyExchangeRateUseCase extends UseCase<SetDailyExchangeRateInput, any> {
    protected inputSchema = Joi.object({
        rate: Joi.number().positive().required(),
        from_currency: Joi.string().length(3).uppercase().default('USD'),
        to_currency: Joi.string().length(3).uppercase().default('VES'),
        source: Joi.string().max(20).uppercase().default('BCV'),
        effective_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    });
    protected outputSchema = exchangeRateDtoResponseSchema;

    protected async implementation(input: SetDailyExchangeRateInput): Promise<any> {
        const from_currency = input.from_currency!;
        const to_currency = input.to_currency!;
        const source = input.source!;
        const effective_date = new Date(`${input.effective_date ?? businessToday()}T00:00:00Z`);

        const saved = await prisma.exchangeRate.upsert({
            where: { from_currency_to_currency_source_effective_date: { from_currency, to_currency, source, effective_date } },
            create: { from_currency, to_currency, source, effective_date, rate: input.rate },
            update: { rate: input.rate },
        });
        return { ...saved, rate: Number(saved.rate) };
    }
}
