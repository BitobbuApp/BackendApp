import Joi from "joi";
import { UseCase } from "../../../shared/application/useCase";
import { UserRepository } from "../domain/repositories/user.repository";
import { PrismaUserRepository } from "../infrastructure/persistence/PrismaUserRepository";
import { adminListUsersInputSchema } from "./dtos/admin-user.dto";
import { CsvExportService } from "../../../shared/infrastructure/http/CsvExportService";

interface AdminExportUsersInput {
    search?: string;
    status?: string;
    company_id?: string;
    profile_type?: string;
}

function formatDate(value: Date | string | null | undefined): string {
    if (!value) return '';
    return new Date(value).toISOString();
}

function joinValues(values: Array<string | null | undefined>): string {
    return values.filter(Boolean).join(' | ');
}

export class AdminExportUsersUseCase extends UseCase<AdminExportUsersInput, any> {
    protected inputSchema: Joi.Schema = adminListUsersInputSchema.fork(['page', 'limit'], (schema) => schema.optional());
    protected outputSchema: Joi.Schema = Joi.any();
    private readonly userRepository: UserRepository;

    constructor() {
        super();
        this.userRepository = new PrismaUserRepository();
    }

    protected async implementation(input: AdminExportUsersInput): Promise<any> {
        const csvStream = CsvExportService.createCsvStream({
            headers: [
                'id',
                'full_name',
                'email',
                'registration_date',
                'account_status',
                'company_name',
                'trade_name',
                'tax_id',
                'profile_type',
                'verification_status',
                'founding_year',
                'website',
                'bio',
                'sector',
                'company_type',
                'company_size',
                'monthly_transactions',
                'subscription_plan',
                'subscription_end_date',
                'locations',
                'contacts',
                'social_media',
                'categories_of_interest',
                'payment_methods',
            ],
        });

        void this.writeBatches(csvStream, input);

        return csvStream;
    }

    private async writeBatches(csvStream: any, input: AdminExportUsersInput) {
        let cursor: string | undefined;
        const batchSize = 500;

        try {
            while (true) {
                const batch = await this.userRepository.findAdminExportBatch({
                    ...input,
                    limit: batchSize,
                    ...(cursor ? { cursor } : {}),
                });

                if (batch.length === 0) {
                    break;
                }

                for (const user of batch) {
                    csvStream.write({
                        id: user.id,
                        full_name: user.full_name,
                        email: user.email,
                        registration_date: formatDate(user.registration_date ?? user.created_at),
                        account_status: user.status,
                        company_name: user.company?.company_name ?? user.company_name ?? '',
                        trade_name: user.company?.trade_name ?? '',
                        tax_id: user.company?.tax_id ?? '',
                        profile_type: user.profile_type,
                        verification_status: user.verification_status ?? '',
                        founding_year: user.company?.founding_year ?? '',
                        website: user.company?.website ?? '',
                        bio: user.company?.bio ?? '',
                        sector: user.company?.sector?.name_es ?? '',
                        company_type: user.company?.company_type?.name_es ?? '',
                        company_size: user.company?.company_size?.display_label_es ?? user.company?.company_size?.display_label ?? '',
                        monthly_transactions: user.company?.monthly_transactions?.description_es ?? user.company?.monthly_transactions?.description ?? user.company?.monthly_transactions?.range_name ?? '',
                        subscription_plan: user.company?.subscriptions?.[0]?.plan?.name ?? '',
                        subscription_end_date: formatDate(user.company?.subscriptions?.[0]?.end_date),
                        locations: joinValues((user.company?.locations ?? []).map((loc: any) => {
                            const main = loc.is_main_headquarters ? ' [principal]' : '';
                            const place = [loc.state?.name, loc.country?.name_es].filter(Boolean).join(', ');
                            return `${place}${main}${loc.address ? ` - ${loc.address}` : ''}`;
                        })),
                        contacts: joinValues((user.company?.contacts ?? []).map((contact: any) => (
                            `${contact.full_name ?? ''}${contact.phone_number ? ` (${contact.phone_number})` : ''}${contact.email ? ` <${contact.email}>` : ''}`
                        ))),
                        social_media: joinValues((user.company?.social_media ?? []).map((sm: any) => (
                            `${sm.platform ?? 'red'}${sm.url ? `: ${sm.url}` : ''}`
                        ))),
                        categories_of_interest: joinValues((user.company?.categories_of_interest ?? []).map((cat: any) => (
                            cat.category?.name_es ?? ''
                        ))),
                        payment_methods: joinValues((user.company?.payment_methods ?? []).map((pm: any) => (
                            pm.method?.name_es ?? ''
                        ))),
                    });
                }

                cursor = batch[batch.length - 1].id;
            }
        } catch (error) {
            csvStream.destroy(error as Error);
            return;
        }

        csvStream.end();
    }
}
