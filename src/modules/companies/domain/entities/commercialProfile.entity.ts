// src/modules/companies/domain/commercialProfileEntity.ts

export class CommercialProfile {
    constructor(
        public company_id: string,
        public is_withholding_agent: boolean = false,
        public works_with_credit: boolean = false
    ) { }
}
