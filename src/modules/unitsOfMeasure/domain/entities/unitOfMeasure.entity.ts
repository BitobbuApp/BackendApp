export class UnitOfMeasure {
    constructor(
        public id: number,
        public name_en: string,
        public name_es: string | null,
        public abbreviation: string,
        public is_active: boolean = true,
    ) { }
}
