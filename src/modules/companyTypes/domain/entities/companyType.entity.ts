export class CompanyType {
    constructor(
        public id: number,
        public name_en: string,
        public name_es: string,
        public description: string | null = null,
    ) { }
}
