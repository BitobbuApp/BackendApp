import { UseCase } from "../../../shared/application/useCase";
import { AdminLookupRepository } from "../domain/repositories/adminLookup.repository";
import { PrismaAdminLookupRepository } from "../infrastructure/persistence/PrismaAdminLookupRepository";
import { adminListLookupsInputSchema, adminLookupListDtoResponseSchema } from "./dtos/adminLookup.dto";
import { AdminLookupTableKey } from "../domain/entities/adminLookupItem.entity";

interface AdminListLookupsInput {
    tableKey: AdminLookupTableKey;
}

export class AdminListLookupsUseCase extends UseCase<AdminListLookupsInput, any> {
    protected inputSchema = adminListLookupsInputSchema;
    protected outputSchema = adminLookupListDtoResponseSchema;
    private readonly lookupRepository: AdminLookupRepository;

    constructor() {
        super();
        this.lookupRepository = new PrismaAdminLookupRepository();
    }

    protected async implementation(input: AdminListLookupsInput): Promise<any> {
        return this.lookupRepository.list(input.tableKey);
    }
}
