export class Country {
    constructor(
        public id: number,
        public name_es: string,
        public name_en: string,
        public iso_code: string,
        public phone_code: string | null = null,
        public is_active: boolean = true,
    ) { }
}
