import { VerifDocType } from "../entities/verifDocType.entity";

export interface VerifDocTypeRepository {
    list(): Promise<VerifDocType[]>;
}
