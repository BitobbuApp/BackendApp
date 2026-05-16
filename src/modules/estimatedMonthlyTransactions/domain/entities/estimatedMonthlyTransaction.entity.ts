export class EstimatedMonthlyTransaction {
    constructor(
        public id: string,
        public range_name: string,
        public description: string | null = null,
        public description_es: string | null = null,
        public is_active: boolean = true,
    ) { }
}
