export class Admin {
    constructor(
        public id: string,
        public email: string,
        public full_name: string,
        public role: string,
        public status: string,
        public last_login_at?: Date | null,
        public created_at?: Date,
        public updated_at?: Date,
        public password?: string
    ) {}
}
