export class PaymentCondition {
    constructor(
        public id: string,
        public name_en: string,
        public name_es: string,
        public days_to_due: number,
        public description: string | null = null,
        public is_active: boolean = true,
    ) { }
}
