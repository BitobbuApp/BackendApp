import { UseCase } from "../../../shared/application/useCase";
import { AdminLookupRepository } from "../domain/repositories/adminLookup.repository";
import { PrismaAdminLookupRepository } from "../infrastructure/persistence/PrismaAdminLookupRepository";
import { adminLookupItemDtoResponseSchema, adminUpdateLookupInputSchema } from "./dtos/adminLookup.dto";
import { AdminLookupTableKey } from "../domain/entities/adminLookupItem.entity";

interface AdminUpdateLookupInput {
    tableKey: AdminLookupTableKey;
    id: string;
    data: {
        code?: string;
        label?: string;
        is_active?: boolean;
    };
}

export class AdminUpdateLookupUseCase extends UseCase<AdminUpdateLookupInput, any> {
    protected inputSchema = adminUpdateLookupInputSchema;
    protected outputSchema = adminLookupItemDtoResponseSchema;
    private readonly lookupRepository: AdminLookupRepository;

    constructor() {
        super();
        this.lookupRepository = new PrismaAdminLookupRepository();
    }

    protected async implementation(input: AdminUpdateLookupInput): Promise<any> {
        return this.lookupRepository.update(input.tableKey, input.id, input.data);
    }
}
