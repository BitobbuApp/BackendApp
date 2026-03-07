import { UseCase } from "../../../shared/application/useCase";
import { SettingsRepository } from "../domain/repositories/settings.repository";
import { settingsDtoResponseSchema } from "./dtos/settings.dto";
import Joi from "joi";
import { CompanySettings } from "../domain/entities/settings.entity";

export class GetSettingsUseCase extends UseCase<string, CompanySettings> {
    protected inputSchema: Joi.Schema = Joi.string().uuid().required();
    protected outputSchema: Joi.Schema = settingsDtoResponseSchema;

    constructor(private readonly settingsRepository: SettingsRepository) {
        super();
    }

    protected async implementation(companyId: string): Promise<CompanySettings> {
        const settings = await this.settingsRepository.findByCompanyId(companyId);
        if (!settings) {
            return new CompanySettings(companyId);
        }
        return settings;
    }
}
