export class CompanySize {
    constructor(
        public id: string,
        public size_name: string,
        public display_label: string,
        public display_label_es: string,
        public is_active: boolean = true,
    ) { }
}
