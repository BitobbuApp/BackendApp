import { UseCase } from "../../../shared/application/useCase";
import { CommercialProfileRepository } from "../domain/repositories/commercialProfile.repository";
import { updateCommercialProfileDtoRequestSchema, commercialProfileDtoResponseSchema } from "./dtos/commercialProfile.dto";
import Joi from "joi";
import { CommercialProfile } from "../domain/entities/commercialProfile.entity";

interface UpdateCommercialProfileInput {
    company_id: string;
    is_withholding_agent?: boolean;
    works_with_credit?: boolean;
}

export class UpdateCommercialProfileUseCase extends UseCase<UpdateCommercialProfileInput, CommercialProfile> {
    protected inputSchema: Joi.Schema = updateCommercialProfileDtoRequestSchema;
    protected outputSchema: Joi.Schema = commercialProfileDtoResponseSchema;

    constructor(private readonly commercialProfileRepository: CommercialProfileRepository) {
        super();
    }

    protected async implementation(data: UpdateCommercialProfileInput): Promise<CommercialProfile> {
        const { company_id, ...updateData } = data;

        let existing = await this.commercialProfileRepository.findByCompanyId(company_id);

        // Si no existe, lo creamos (upsert logic in use case for 1:1)
        if (!existing) {
            existing = new CommercialProfile(company_id);
        }

        return this.commercialProfileRepository.update(company_id, updateData);
    }
}
