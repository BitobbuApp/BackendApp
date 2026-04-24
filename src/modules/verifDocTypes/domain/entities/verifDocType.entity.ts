export class VerifDocType {
    constructor(
        public id: number,
        public name_en: string,
        public name_es: string | null = null,
        public instructions: string | null = null,
    ) { }
}
