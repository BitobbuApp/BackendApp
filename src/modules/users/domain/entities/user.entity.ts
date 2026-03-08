// src/modules/domain/userEntity.ts

export class User {
    constructor(
        public id: string,
        public company_id: string | null,
        public first_name: string,
        public last_name: string,
        public email: string,
        public password: string,
        public salt: number | null,
        public is_active: boolean | null,
        public last_access: Date | null,
        public created_at: Date | null,
        public updated_at: Date | null
    ) {
        this.id = id;
        this.company_id = company_id;
        this.first_name = first_name;
        this.last_name = last_name;
        this.email = email;
        this.password = password;
        this.salt = salt;
        this.is_active = is_active;
        this.last_access = last_access;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
}
