import { UseCase } from "../../../shared/application/useCase";
import { CommercialProfileRepository } from "../domain/repositories/commercialProfile.repository";
import { commercialProfileDtoResponseSchema } from "./dtos/commercialProfile.dto";
import Joi from "joi";
import { CommercialProfile } from "../domain/entities/commercialProfile.entity";

import { PrismaCommercialProfileRepository } from "../infrastructure/persistence/PrismaCommercialProfileRepository";

export class GetCommercialProfileUseCase extends UseCase<string, any> {
    protected inputSchema: Joi.Schema = Joi.string().uuid().required();
    protected outputSchema: Joi.Schema = commercialProfileDtoResponseSchema;
    private readonly profileRepository: CommercialProfileRepository;

    constructor() {
        super();
        this.profileRepository = new PrismaCommercialProfileRepository();
    }

    protected async implementation(companyId: string): Promise<CommercialProfile> {
        const profile = await this.profileRepository.findByCompanyId(companyId);
        if (!profile) {
            // Retornamos uno por defecto si no existe en la DB aún (lazy creation pattern)
            return new CommercialProfile(companyId);
        }
        return profile;
    }
}
