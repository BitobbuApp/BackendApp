export class CompanyLocation {
    constructor(
        public id: string,
        public company_id: string,
        public country_id: number | null = null,
        public state_id: number | null = null,
        public city_id: number | null = null,
        public tax_address: string | null = null,
        public national_coverage: boolean = false,
        public is_main_headquarters: boolean = true,
        public country?: { id: number; name: string; iso_code: string },
        public state?: { id: number; name: string; code: string | null },
        public city?: { id: number; name: string }
    ) { }
}
