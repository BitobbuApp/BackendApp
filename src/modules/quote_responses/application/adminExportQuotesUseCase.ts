import Joi from "joi";
import { UseCase } from "../../../shared/application/useCase";
import { CsvExportService } from "../../../shared/infrastructure/http/CsvExportService";
import { QuoteResponseRepository } from "../domain/repositories/quote_response.repository";
import { PrismaQuoteResponseRepository } from "../infrastructure/persistence/PrismaQuoteResponseRepository";

interface AdminExportQuotesInput {
    status?: string;
    request_id?: string;
    supplier_id?: string;
    serial_number?: number;
    from_date?: string;
    to_date?: string;
}

function formatDate(value: Date | string | null | undefined): string {
    if (!value) return '';
    return new Date(value).toISOString();
}

export class AdminExportQuotesUseCase extends UseCase<AdminExportQuotesInput, any> {
    protected inputSchema = Joi.object({
        status: Joi.string().allow('').optional(),
        request_id: Joi.string().uuid().optional(),
        supplier_id: Joi.string().uuid().optional(),
        serial_number: Joi.number().optional(),
        from_date: Joi.date().optional(),
        to_date: Joi.date().optional(),
    });
    protected outputSchema = Joi.any();
    private readonly quoteRepository: QuoteResponseRepository;

    constructor() {
        super();
        this.quoteRepository = new PrismaQuoteResponseRepository();
    }

    protected async implementation(input: AdminExportQuotesInput): Promise<any> {
        const csvStream = CsvExportService.createCsvStream({
            headers: [
                'id',
                'serial_number',
                'request_product',
                'request_serial',
                'supplier_name',
                'unit_price_usd',
                'quantity',
                'total_amount_usd',
                'status',
                'delivery_time',
                'notes',
                'created_at',
            ],
        });

        void this.writeBatches(csvStream, input);

        return csvStream;
    }

    private async writeBatches(csvStream: any, input: AdminExportQuotesInput) {
        let cursor: string | undefined;
        const batchSize = 500;

        try {
            while (true) {
                const batch = await this.quoteRepository.findAdminExportBatch(
                    input,
                    batchSize,
                    cursor
                );

                if (batch.length === 0) break;

                for (const quote of batch) {
                    csvStream.write({
                        id: quote.id,
                        serial_number: quote.serial_number ?? '',
                        request_product: quote.request_product ?? '',
                        request_serial: quote.request_serial ?? '',
                        supplier_name: quote.supplier_name ?? '',
                        unit_price_usd: quote.unit_price_usd,
                        quantity: quote.quantity,
                        total_amount_usd: quote.total_amount_usd,
                        status: quote.status,
                        delivery_time: quote.delivery_time ?? '',
                        notes: quote.notes ?? '',
                        created_at: formatDate(quote.created_at),
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
