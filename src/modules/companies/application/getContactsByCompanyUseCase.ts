import { UseCase } from "../../../shared/application/useCase";
import { ContactRepository } from "../domain/repositories/contact.repository";
import { contactDtoResponseSchema } from "./dtos/contact.dto";
import Joi from "joi";
import { CompanyContact } from "../domain/entities/contact.entity";

import { PrismaContactRepository } from "../infrastructure/persistence/PrismaContactRepository";

export class GetContactsByCompanyUseCase extends UseCase<string, any[]> {
    protected inputSchema: Joi.Schema = Joi.string().uuid().required();
    protected outputSchema: Joi.Schema = Joi.array().items(contactDtoResponseSchema);
    private readonly contactRepository: ContactRepository;

    constructor() {
        super();
        this.contactRepository = new PrismaContactRepository();
    }

    protected async implementation(companyId: string): Promise<CompanyContact[]> {
        return this.contactRepository.findByCompanyId(companyId);
    }
}
