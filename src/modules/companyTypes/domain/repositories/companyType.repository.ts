import { CompanyType } from "../entities/companyType.entity";

export interface CompanyTypeRepository {
    list(): Promise<CompanyType[]>;
}
