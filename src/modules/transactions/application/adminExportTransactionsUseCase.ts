import Joi from "joi";
import { UseCase } from "../../../shared/application/useCase";
import { CsvExportService } from "../../../shared/infrastructure/http/CsvExportService";
import { TransactionRepository } from "../domain/repositories/transaction.repository";
import { PrismaTransactionRepository } from "../infrastructure/persistence/PrismaTransactionRepository";

interface AdminExportTransactionsInput {
    status?: string;
    buyer_id?: string;
    supplier_id?: string;
    search?: string;
    serial_number?: number;
    from_date?: string;
    to_date?: string;
}

function formatDate(value: Date | string | null | undefined): string {
    if (!value) return '';
    return new Date(value).toISOString();
}

export class AdminExportTransactionsUseCase extends UseCase<AdminExportTransactionsInput, any> {
    protected inputSchema = Joi.object({
        status: Joi.string().allow('').optional(),
        buyer_id: Joi.string().uuid().optional(),
        supplier_id: Joi.string().uuid().optional(),
        search: Joi.string().allow('').optional(),
        serial_number: Joi.number().optional(),
        from_date: Joi.date().optional(),
        to_date: Joi.date().optional(),
    });
    protected outputSchema = Joi.any();
    private readonly transactionRepository: TransactionRepository;

    constructor() {
        super();
        this.transactionRepository = new PrismaTransactionRepository();
    }

    protected async implementation(input: AdminExportTransactionsInput): Promise<any> {
        const csvStream = CsvExportService.createCsvStream({
            headers: [
                'id',
                'serial_number',
                'product_description',
                'buyer_name',
                'supplier_name',
                'payment_currency',
                'unit_price_usd',
                'quantity',
                'total_amount_usd',
                'payment_method',
                'delivery_time',
                'status',
                'estimated_delivery_date',
                'created_at',
            ],
        });

        void this.writeBatches(csvStream, input);

        return csvStream;
    }

    private async writeBatches(csvStream: any, input: AdminExportTransactionsInput) {
        let cursor: string | undefined;
        const batchSize = 500;

        try {
            while (true) {
                const batch = await this.transactionRepository.findAdminExportBatch(
                    input,
                    batchSize,
                    cursor
                );

                if (batch.length === 0) break;

                for (const trx of batch) {
                    csvStream.write({
                        id: trx.id,
                        serial_number: trx.serial_number ?? '',
                        product_description: trx.product_description,
                        buyer_name: trx.buyer_name ?? '',
                        supplier_name: trx.supplier_name ?? '',
                        payment_currency: trx.payment_currency ?? 'USD',
                        unit_price_usd: trx.unit_price_usd,
                        quantity: trx.quantity,
                        total_amount_usd: trx.total_amount_usd,
                        payment_method: trx.payment_method ?? '',
                        delivery_time: trx.delivery_time ?? '',
                        status: trx.status,
                        estimated_delivery_date: formatDate(trx.estimated_delivery_date),
                        created_at: formatDate(trx.created_at),
                    });
                }

                const lastTransaction = batch.at(-1);
                if (!lastTransaction) break;

                cursor = lastTransaction.id;
            }
        } catch (error) {
            csvStream.destroy(error as Error);
            return;
        }

        csvStream.end();
    }
}
