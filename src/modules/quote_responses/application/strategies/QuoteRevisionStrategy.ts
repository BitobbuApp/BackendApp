import { QuoteResponse } from '../../domain/entities/quote_response.entity';

export type ActorRole = 'buyer' | 'supplier' | 'system';

export interface QuoteActionParams {
    quoteResponseId: string;
    actorCompanyId: string;
    payload?: Record<string, any> | undefined;
}

export interface QuoteRevisionStrategy {
    readonly action: string;
    readonly allowedActors: ActorRole[];
    execute(params: QuoteActionParams): Promise<QuoteResponse>;
}
