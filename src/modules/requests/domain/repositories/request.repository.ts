import { RequestEntity } from "../entities/request.entity";

export interface RequestListResult {
    data: RequestEntity[];
    total: number;
    page: number;
    limit: number;
    _raw?: any[];
}

/** Filters of the sellers' opportunities list (RFQs of other companies). */
export interface MarketplaceRequestFilters {
    category_id?: number | undefined;
    subcategory_ids?: number[] | undefined;
}

export interface RequestRepository {
    create(request: Partial<RequestEntity>): Promise<RequestEntity>;
    findById(id: string): Promise<RequestEntity | null>;
    findByCompanyId(companyId: string, page: number, limit: number): Promise<RequestListResult>;
    findExcludingCompany(excludeCompanyId: string, page: number, limit: number, filters?: MarketplaceRequestFilters): Promise<RequestListResult>;
    update(id: string, request: Partial<RequestEntity>): Promise<RequestEntity>;
    delete(id: string): Promise<void>;
    findAllAdmin(filters: any, page: number, limit: number): Promise<RequestListResult>;
    findAdminExportBatch(filters: any, limit: number, cursor?: string): Promise<RequestEntity[]>;
}
