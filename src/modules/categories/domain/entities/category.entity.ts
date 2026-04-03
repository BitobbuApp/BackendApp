export class Category {
    constructor(
        public id: number,
        public name_en: string,
        public name_es: string,
        public slug: string,
        public icon: string | null = null,
        public is_active: boolean = true,
    ) { }
}
