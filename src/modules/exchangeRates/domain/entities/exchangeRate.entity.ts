export class ExchangeRateEntity {
    constructor(
        public id: string,
        public from_currency: string,
        public to_currency: string,
        public rate: number,
        public source: string,
        public effective_date: Date,
    ) {}
}
