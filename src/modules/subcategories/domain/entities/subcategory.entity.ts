export class SubcategoryEntity {
    constructor(
        public id: number,
        public category_id: number,
        public slug: string,
        public name_es: string,
        public name_en: string,
        public is_active: boolean = true,
        public sort_order: number = 0,
        public category_name: string | null = null,
        // Number of companies linked to it (admin only): lets the admin see the impact before deactivating
        public company_count: number | null = null,
    ) {}
}
