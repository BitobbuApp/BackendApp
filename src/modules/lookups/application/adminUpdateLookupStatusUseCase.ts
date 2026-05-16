import { UseCase } from "../../../shared/application/useCase";
import { AdminLookupRepository } from "../domain/repositories/adminLookup.repository";
import { PrismaAdminLookupRepository } from "../infrastructure/persistence/PrismaAdminLookupRepository";
import { adminLookupItemDtoResponseSchema, adminUpdateLookupStatusInputSchema } from "./dtos/adminLookup.dto";
import { AdminLookupTableKey } from "../domain/entities/adminLookupItem.entity";

interface AdminUpdateLookupStatusInput {
    tableKey: AdminLookupTableKey;
    id: string;
    is_active: boolean;
}

export class AdminUpdateLookupStatusUseCase extends UseCase<AdminUpdateLookupStatusInput, any> {
    protected inputSchema = adminUpdateLookupStatusInputSchema;
    protected outputSchema = adminLookupItemDtoResponseSchema;
    private readonly lookupRepository: AdminLookupRepository;

    constructor() {
        super();
        this.lookupRepository = new PrismaAdminLookupRepository();
    }

    protected async implementation(input: AdminUpdateLookupStatusInput): Promise<any> {
        return this.lookupRepository.updateStatus(input.tableKey, input.id, input.is_active);
    }
}
