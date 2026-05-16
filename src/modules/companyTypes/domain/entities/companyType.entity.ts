export class CompanyType {
    constructor(
        public id: number,
        public name_en: string,
        public name_es: string,
        public is_active: boolean = true,
        public description: string | null = null,
    ) { }
}
