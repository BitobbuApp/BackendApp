export class VerifDocType {
    constructor(
        public id: number,
        public name_en: string,
        public name_es: string | null = null,
        public is_active: boolean = true,
        public instructions: string | null = null,
    ) { }
}
