import { UseCase } from "../../../shared/application/useCase";
import { SettingsRepository } from "../domain/repositories/settings.repository";
import { updateSettingsDtoRequestSchema, settingsDtoResponseSchema } from "./dtos/settings.dto";
import Joi from "joi";
import { CompanySettings } from "../domain/entities/settings.entity";

interface UpdateSettingsInput {
    company_id: string;
    receive_email_notifications?: boolean;
    receive_web_notifications?: boolean;
}

export class UpdateSettingsUseCase extends UseCase<UpdateSettingsInput, CompanySettings> {
    protected inputSchema: Joi.Schema = updateSettingsDtoRequestSchema;
    protected outputSchema: Joi.Schema = settingsDtoResponseSchema;

    constructor(private readonly settingsRepository: SettingsRepository) {
        super();
    }

    protected async implementation(data: UpdateSettingsInput): Promise<CompanySettings> {
        const { company_id, ...updateData } = data;

        let existing = await this.settingsRepository.findByCompanyId(company_id);

        if (!existing) {
            existing = new CompanySettings(company_id);
        }

        return this.settingsRepository.update(company_id, updateData);
    }
}
