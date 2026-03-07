import { UseCase } from "../../../shared/application/useCase";
import { ContactRepository } from "../domain/repositories/contact.repository";
import { contactDtoResponseSchema } from "./dtos/contact.dto";
import Joi from "joi";
import { CompanyContact } from "../domain/entities/contact.entity";

export class GetContactsByCompanyUseCase extends UseCase<string, CompanyContact[]> {
    protected inputSchema: Joi.Schema = Joi.string().uuid().required();
    protected outputSchema: Joi.Schema = Joi.array().items(contactDtoResponseSchema);

    constructor(private readonly contactRepository: ContactRepository) {
        super();
    }

    protected async implementation(companyId: string): Promise<CompanyContact[]> {
        return this.contactRepository.findByCompanyId(companyId);
    }
}
