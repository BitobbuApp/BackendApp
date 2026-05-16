import { AdminLookupItemEntity, AdminLookupTableKey } from "../entities/adminLookupItem.entity";

export interface AdminLookupRepository {
    list(tableKey: AdminLookupTableKey): Promise<AdminLookupItemEntity[]>;
    create(tableKey: AdminLookupTableKey, data: Partial<AdminLookupItemEntity>): Promise<AdminLookupItemEntity>;
    update(tableKey: AdminLookupTableKey, id: string, data: Partial<AdminLookupItemEntity>): Promise<AdminLookupItemEntity>;
    updateStatus(tableKey: AdminLookupTableKey, id: string, isActive: boolean): Promise<AdminLookupItemEntity>;
}
