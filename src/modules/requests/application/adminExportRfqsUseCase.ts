import Joi from "joi";
import { UseCase } from "../../../shared/application/useCase";
import { CsvExportService } from "../../../shared/infrastructure/http/CsvExportService";
import { RequestRepository } from "../domain/repositories/request.repository";
import { PrismaRequestRepository } from "../infrastructure/persistence/PrismaRequestRepository";

interface AdminExportRfqsInput {
    search?: string;
    status?: string;
    company_id?: string;
    category_id?: number;
    serial_number?: number;
    from_date?: string;
    to_date?: string;
}

function formatDate(value: Date | string | null | undefined): string {
    if (!value) return '';
    return new Date(value).toISOString();
}

export class AdminExportRfqsUseCase extends UseCase<AdminExportRfqsInput, any> {
    protected inputSchema = Joi.object({
        search: Joi.string().allow('').optional(),
        status: Joi.string().allow('').optional(),
        company_id: Joi.string().uuid().optional(),
        category_id: Joi.number().integer().optional(),
        serial_number: Joi.number().optional(),
        from_date: Joi.date().optional(),
        to_date: Joi.date().optional(),
    });
    protected outputSchema = Joi.any();
    private readonly requestRepository: RequestRepository;

    constructor() {
        super();
        this.requestRepository = new PrismaRequestRepository();
    }

    protected async implementation(input: AdminExportRfqsInput): Promise<any> {
        const csvStream = CsvExportService.createCsvStream({
            headers: [
                'id',
                'serial_number',
                'product_service',
                'category',
                'buyer_company',
                'quantity',
                'unit',
                'status',
                'response_count',
                'created_at',
                'expiration_date',
            ],
        });

        void this.writeBatches(csvStream, input);

        return csvStream;
    }

    private async writeBatches(csvStream: any, input: AdminExportRfqsInput) {
        let cursor: string | undefined;
        const batchSize = 500;

        try {
            while (true) {
                const batch = await this.requestRepository.findAdminExportBatch(
                    input,
                    batchSize,
                    cursor
                );

                if (batch.length === 0) break;

                for (const rfq of batch) {
                    csvStream.write({
                        id: rfq.id,
                        serial_number: rfq.serial_number ?? '',
                        product_service: rfq.product_service,
                        category: rfq.category ?? '',
                        buyer_company: rfq.company?.trade_name ?? '',
                        quantity: rfq.quantity,
                        unit: rfq.unit_of_measure,
                        status: rfq.status,
                        response_count: rfq.response_count ?? 0,
                        created_at: formatDate(rfq.created_at),
                        expiration_date: formatDate(rfq.expiration_date),
                    });
                }

                const lastRfq = batch.at(-1);
                if (!lastRfq) break;

                cursor = lastRfq.id;
            }
        } catch (error) {
            csvStream.destroy(error as Error);
            return;
        }

        csvStream.end();
    }
}
