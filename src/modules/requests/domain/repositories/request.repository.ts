import { RequestEntity } from "../entities/request.entity";

export interface RequestListResult {
    data: RequestEntity[];
    total: number;
    page: number;
    limit: number;
    _raw?: any[];
}

export interface RequestRepository {
    create(request: Partial<RequestEntity>): Promise<RequestEntity>;
    findById(id: string): Promise<RequestEntity | null>;
    findByCompanyId(companyId: string, page: number, limit: number): Promise<RequestListResult>;
    findExcludingCompany(excludeCompanyId: string, page: number, limit: number): Promise<RequestListResult>;
    update(id: string, request: Partial<RequestEntity>): Promise<RequestEntity>;
    delete(id: string): Promise<void>;
}
