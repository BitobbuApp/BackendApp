import { UseCase } from "../../../shared/application/useCase";
import { ContactRepository } from "../domain/repositories/contact.repository";
import { PrismaContactRepository } from "../infrastructure/persistence/PrismaContactRepository";
import { addContactDtoRequestSchema, contactDtoResponseSchema } from "./dtos/contact.dto";
import Joi from "joi";
import { CompanyContact } from "../domain/entities/contact.entity";

interface AddContactInput {
    company_id: string;
    full_name: string;
    position?: string;
    whatsapp?: string;
    email?: string;
    is_primary?: boolean;
}

export class AddContactUseCase extends UseCase<AddContactInput, CompanyContact> {
    protected inputSchema: Joi.Schema = addContactDtoRequestSchema;
    protected outputSchema: Joi.Schema = contactDtoResponseSchema;
    private readonly contactRepository: ContactRepository;

    constructor() {
        super();
        this.contactRepository = new PrismaContactRepository();
    }

    protected async implementation(data: AddContactInput): Promise<CompanyContact> {
        if (data.is_primary) {
            await this.contactRepository.resetPrimaryContacts(data.company_id);
        } else {
            const existing = await this.contactRepository.findByCompanyId(data.company_id);
            if (existing.length === 0) {
                data.is_primary = true;
            }
        }

        return this.contactRepository.create(data);
    }
}
