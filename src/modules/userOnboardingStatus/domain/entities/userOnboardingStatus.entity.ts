export class UserOnboardingStatus {
    constructor(
        public id: string,
        public user_id: string,
        public company_id: string,
        public module_name: string,
        public has_completed_tutorial: boolean = false,
        public created_at: Date | null = null,
        public updated_at: Date | null = null,
    ) { }
}
