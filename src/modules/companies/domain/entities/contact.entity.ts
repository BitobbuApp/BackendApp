// src/modules/companies/domain/contactEntity.ts

export class CompanyContact {
    constructor(
        public id: string,
        public company_id: string,
        public full_name: string,
        public position: string | null = null,
        public whatsapp: string | null = null,
        public email: string | null = null,
        public is_primary: boolean = false
    ) { }
}
