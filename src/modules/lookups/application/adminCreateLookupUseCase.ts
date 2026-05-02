import { UseCase } from "../../../shared/application/useCase";
import { AdminLookupRepository } from "../domain/repositories/adminLookup.repository";
import { PrismaAdminLookupRepository } from "../infrastructure/persistence/PrismaAdminLookupRepository";
import { adminCreateLookupInputSchema, adminLookupItemDtoResponseSchema } from "./dtos/adminLookup.dto";
import { AdminLookupTableKey } from "../domain/entities/adminLookupItem.entity";

interface AdminCreateLookupInput {
    tableKey: AdminLookupTableKey;
    data: {
        code: string;
        label: string;
        is_active?: boolean;
    };
}

export class AdminCreateLookupUseCase extends UseCase<AdminCreateLookupInput, any> {
    protected inputSchema = adminCreateLookupInputSchema;
    protected outputSchema = adminLookupItemDtoResponseSchema;
    private readonly lookupRepository: AdminLookupRepository;

    constructor() {
        super();
        this.lookupRepository = new PrismaAdminLookupRepository();
    }

    protected async implementation(input: AdminCreateLookupInput): Promise<any> {
        return this.lookupRepository.create(input.tableKey, input.data);
    }
}
