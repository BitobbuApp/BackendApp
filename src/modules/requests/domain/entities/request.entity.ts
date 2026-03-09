export interface RequestFileEntity {
    id: string;
    request_id: string;
    url: string;
    file_name: string | null;
    created_at: Date | null;
}

export class RequestEntity {
    constructor(
        public id: string,
        public company_id: string,
        public product_service: string,
        public quantity: number,
        public user_id: string | null = null,
        public unit_of_measure: string = 'Units',
        public description: string | null = null,
        public category: string | null = null,
        public status: string = 'Active',
        public expiration_date: Date | null = null,
        public response_count: number = 0,
        public files: RequestFileEntity[] = [],
        public created_at: Date | null = null,
        public updated_at: Date | null = null
    ) { }
}
