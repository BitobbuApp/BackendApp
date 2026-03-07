import { UseCase } from "../../../shared/application/useCase";
import { CommercialProfileRepository } from "../domain/repositories/commercialProfile.repository";
import { commercialProfileDtoResponseSchema } from "./dtos/commercialProfile.dto";
import Joi from "joi";
import { CommercialProfile } from "../domain/entities/commercialProfile.entity";

export class GetCommercialProfileUseCase extends UseCase<string, CommercialProfile> {
    protected inputSchema: Joi.Schema = Joi.string().uuid().required();
    protected outputSchema: Joi.Schema = commercialProfileDtoResponseSchema;

    constructor(private readonly commercialProfileRepository: CommercialProfileRepository) {
        super();
    }

    protected async implementation(companyId: string): Promise<CommercialProfile> {
        const profile = await this.commercialProfileRepository.findByCompanyId(companyId);
        if (!profile) {
            // Retornamos uno por defecto si no existe en la DB aún (lazy creation pattern)
            return new CommercialProfile(companyId);
        }
        return profile;
    }
}
