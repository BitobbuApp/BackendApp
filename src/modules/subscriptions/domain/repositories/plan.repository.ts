export interface PlanRepository {
    findById(id: string): Promise<any | null>;
    findAllActive(): Promise<any[]>;
}
