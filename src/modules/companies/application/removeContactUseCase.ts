import { UseCase } from "../../../shared/application/useCase";
import { ContactRepository } from "../domain/repositories/contact.repository";
import Joi from "joi";
import { ContactNotFoundError } from "../domain/errors/company.errors";

export class RemoveContactUseCase extends UseCase<string, { success: boolean }> {
    protected inputSchema: Joi.Schema = Joi.string().uuid().required();
    protected outputSchema: Joi.Schema = Joi.object({
        success: Joi.boolean().required()
    });

    constructor(private readonly contactRepository: ContactRepository) {
        super();
    }

    protected async implementation(id: string): Promise<{ success: boolean }> {
        const existing = await this.contactRepository.findById(id);
        if (!existing) throw new ContactNotFoundError(id);

        if (existing.is_primary) {
            const all = await this.contactRepository.findByCompanyId(existing.company_id);
            if (all.length > 1) {
                throw new Error("Cannot delete the primary contact. Please assign another contact as primary first.");
            }
        }

        await this.contactRepository.delete(id);
        return { success: true };
    }
}
