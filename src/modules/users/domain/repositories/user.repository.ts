import { User } from "../entities/user.entity";

export interface UserRepository {
    create(user: User): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    update(user: User): Promise<User>;
    delete(id: string): Promise<void>;
    
    // Admin methods
    findAllAdmin(params: { 
        page: number, 
        limit: number, 
        search?: string, 
        status?: string,
        company_id?: string
    }): Promise<{ items: any[], total: number }>;

    findByIdAdmin(id: string): Promise<any>;
}
