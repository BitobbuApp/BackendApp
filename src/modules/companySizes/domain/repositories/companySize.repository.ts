import { CompanySize } from "../entities/companySize.entity";

export interface CompanySizeRepository {
    list(): Promise<CompanySize[]>;
}
