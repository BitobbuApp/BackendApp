export interface PlanRepository {
    findAllAdmin(filters: any): Promise<any[]>;
    findById(id: string): Promise<any | null>;
    create(data: any): Promise<any>;
    update(id: string, data: any): Promise<any>;
}
