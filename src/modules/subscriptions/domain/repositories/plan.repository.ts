export interface PlanRepository {
    findById(id: string): Promise<any | null>;
    findAllActive(): Promise<any[]>;
    findDefault(): Promise<any | null>;
    findOne(filters: any): Promise<any | null>;
}
