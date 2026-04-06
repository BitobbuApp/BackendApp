import { QuoteResponse } from "../entities/quote_response.entity";

export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface QuoteResponseRepository {
    create(response: Partial<QuoteResponse>): Promise<QuoteResponse>;
    findById(id: string): Promise<QuoteResponse | null>;
    findQuoteResponseAndSupplier(id: string): Promise<any | null>;
    findBySupplierId(supplierId: string, page: number, limit: number): Promise<PaginatedResult<QuoteResponse>>;
    findByRequestId(requestId: string, page: number, limit: number): Promise<PaginatedResult<any>>;
    findByRequestOwnerId(companyId: string, page: number, limit: number): Promise<PaginatedResult<any>>;
    update(id: string, response: Partial<QuoteResponse>): Promise<QuoteResponse>;
    delete(id: string): Promise<void>;
}
