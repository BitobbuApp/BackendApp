// src/modules/companies/domain/settingsEntity.ts

export class CompanySettings {
    constructor(
        public company_id: string,
        public receive_email_notifications: boolean = true,
        public receive_web_notifications: boolean = true,
        public two_factor_required: boolean = false
    ) { }
}
