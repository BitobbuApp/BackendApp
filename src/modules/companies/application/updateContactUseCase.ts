import { UseCase } from "../../../shared/application/useCase";
import { ContactRepository } from "../domain/repositories/contact.repository";
import { PrismaContactRepository } from "../infrastructure/persistence/PrismaContactRepository";
import { addContactDtoRequestSchema, contactDtoResponseSchema } from "./dtos/contact.dto";
import Joi from "joi";
import { CompanyContact } from "../domain/entities/contact.entity";
import { ContactNotFoundError } from "../domain/errors/company.errors";

interface UpdateContactInput {
    id: string;
    full_name?: string;
    position?: string;
    whatsapp?: string;
    email?: string;
    is_primary?: boolean;
}

export class UpdateContactUseCase extends UseCase<UpdateContactInput, CompanyContact> {
    protected inputSchema: Joi.Schema = Joi.object({
        id: Joi.string().uuid().required(),
        full_name: Joi.string().max(200),
        position: Joi.string().max(100).allow(null, ''),
        whatsapp: Joi.string().max(20).allow(null, ''),
        email: Joi.string().email().max(100).allow(null, ''),
        is_primary: Joi.boolean()
    });
    protected outputSchema: Joi.Schema = contactDtoResponseSchema;

    private readonly contactRepository: ContactRepository;

    constructor() {
        super();
        this.contactRepository = new PrismaContactRepository();
    }

    protected async implementation(data: UpdateContactInput): Promise<CompanyContact> {
        const { id, ...updateData } = data;

        const existing = await this.contactRepository.findById(id);
        if (!existing) throw new ContactNotFoundError(id);

        if (updateData.is_primary && !existing.is_primary) {
            await this.contactRepository.resetPrimaryContacts(existing.company_id);
        }

        return this.contactRepository.update(id, updateData);
    }
}
