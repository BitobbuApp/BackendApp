export class CurrencyEntity {
    constructor(
        public code: string,
        public name_en: string,
        public name_es: string,
        public symbol: string,
        public decimal_places: number,
        public is_active: boolean,
    ) {}
}
