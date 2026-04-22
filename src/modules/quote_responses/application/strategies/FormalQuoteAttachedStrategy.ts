import { QuoteResponseNotFoundError } from "../../domain/errors/quote_response.errors";
import { ApplicationError } from "../../../../shared/domain/error";
import { QuoteRevisionStrategy, QuoteActionParams } from './QuoteRevisionStrategy';
import { QuoteResponse, ResponseStatus } from '../../domain/entities/quote_response.entity';
import { assertActorRole } from '../helpers/assertActorRole';
import { assertTransition } from '../../domain/quoteResponseStateMachine';
import { PrismaQuoteResponseRepository } from '../../infrastructure/persistence/PrismaQuoteResponseRepository';
import { UploadDocumentUseCase } from "../../../documents/application/UploadDocumentUseCase";
import { storageService } from "../../../../shared/infrastructure/storage/storageInstance";

/**
 * FormalQuoteAttachedStrategy
 * Supplier uploads and attaches a formal PDF quote.
 * Status transitions to `formal_approval_pending`.
 */
export class FormalQuoteAttachedStrategy implements QuoteRevisionStrategy {
    readonly action = 'formal_quote_attached';
    readonly allowedActors = ['supplier' as const];

    private readonly repo = new PrismaQuoteResponseRepository();

    async execute(params: QuoteActionParams): Promise<QuoteResponse> {
        const { quoteResponseId, actorCompanyId, payload } = params;

        let formalQuoteUrl = payload?.formal_quote_url;

        // Si viene un archivo, subirlo a S3
        if (payload?.rawFiles && payload.rawFiles.length > 0) {
            const uploadUseCase = new UploadDocumentUseCase(storageService);
            const result = await uploadUseCase.execute({
                tenantId: actorCompanyId,
                buffer: payload.rawFiles[0].buffer
            });
            const publicUrlBase = process.env.S3_PUBLIC_URL || '';
            formalQuoteUrl = `${publicUrlBase}/${result.fileKey}`;
        }

        if (!formalQuoteUrl) {
            throw new ApplicationError(400, "formal_quote_url or file is required for this action.", "VALIDATION_ERROR", "VALIDATION");
        }

        await assertActorRole(quoteResponseId, actorCompanyId, this.allowedActors, this.action);

        const existing = await this.repo.findById(quoteResponseId);
        if (!existing) throw new QuoteResponseNotFoundError(quoteResponseId);

        assertTransition(existing.status as string, ResponseStatus.FormalApprovalPending);

        const updated = await this.repo.updateWithRevision(
            quoteResponseId,
            {
                status: ResponseStatus.FormalApprovalPending,
                formal_quote_url: formalQuoteUrl,
            },
            {
                action: this.action,
                actorCompanyId,
                snapshot: { formal_quote_url: formalQuoteUrl },
            }
        );

        // Devolver URL resultante para propagar
        (updated as any).formal_quote_url = formalQuoteUrl; // Make sure URL is passed for system message
        return updated;
    }
}
