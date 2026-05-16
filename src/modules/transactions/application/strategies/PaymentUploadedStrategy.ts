import { TransactionNotFoundError } from "../../domain/errors/transaction.errors";
import { ApplicationError } from "../../../../shared/domain/error";
import { TransactionStrategy, TransactionActionParams } from './TransactionStrategy';
import { Transaction, TransactionStatus } from '../../domain/entities/transaction.entity';
import { assertTransactionActorRole } from '../helpers/assertTransactionActorRole';
import { assertTransition } from '../../domain/transactionStateMachine';
import { PrismaTransactionRepository } from '../../infrastructure/persistence/PrismaTransactionRepository';
import { UploadDocumentUseCase } from "../../../documents/application/UploadDocumentUseCase";
import { storageService } from "../../../../shared/infrastructure/storage/storageInstance";

/**
 * PaymentUploadedStrategy
 * Buyer uploads payment proof (bank transfer, etc.).
 * Status transitions to `payment_review`.
 */
export class PaymentUploadedStrategy implements TransactionStrategy {
    readonly action = 'payment_uploaded';
    readonly allowedActors = ['buyer' as const];

    private readonly repo = new PrismaTransactionRepository();

    async execute(params: TransactionActionParams): Promise<Transaction> {
        const { transactionId, actorCompanyId, payload } = params;

        let paymentProofUrl = payload?.payment_proof_url;

        if (payload?.rawFiles && payload.rawFiles.length > 0) {
            const uploadUseCase = new UploadDocumentUseCase(storageService);
            const result = await uploadUseCase.execute({
                tenantId: actorCompanyId,
                buffer: payload.rawFiles[0].buffer
            });
            const publicUrlBase = process.env.S3_PUBLIC_URL || '';
            paymentProofUrl = `${publicUrlBase}/${result.fileKey}`;
        }

        if (!paymentProofUrl) {
            throw new ApplicationError(400, "payment_proof_url or file is required for this action.", "VALIDATION_ERROR", "VALIDATION");
        }

        await assertTransactionActorRole(transactionId, actorCompanyId, this.allowedActors, this.action);

        const existing = await this.repo.findById(transactionId);
        if (!existing) throw new TransactionNotFoundError(transactionId);

        assertTransition(existing.status, TransactionStatus.PaymentReview);

        const updated = await this.repo.updateWithRevision(transactionId, {
            status: TransactionStatus.PaymentReview,
            buyer_confirmed: true,
            buyer_confirmed_at: new Date(),
        }, {
            action: this.action,
            actorCompanyId,
            snapshot: { ...payload, payment_proof_url: paymentProofUrl },
        });

        // Ensure new url is returned for system messages
        (updated as any).payment_proof_url = paymentProofUrl;
        return updated;
    }
}
