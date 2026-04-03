// src/modules/companies/domain/verificationEntity.ts

export type VerificationStatus = 'Pending' | 'Under_Review' | 'Verified' | 'Rejected';
export type VerifDocStatus = 'Pending' | 'Approved' | 'Rejected';

export class CompanyVerification {
    constructor(
        public company_id: string,
        public status: VerificationStatus = 'Pending',
        public last_submission_at: Date | null = null,
        public verified_at: Date | null = null,
        public rejected_at: Date | null = null,
        public rejection_reason: string | null = null
    ) { }
}

export class VerificationDocument {
    constructor(
        public id: string,
        public company_id: string,
        public type_id: number,
        public type: string,
        public file_url: string,
        public status: VerifDocStatus = 'Pending',
        public feedback: string | null = null,
        public reviewed_by: string | null = null,
        public created_at: Date | null = null,
        public updated_at: Date | null = null
    ) { }
}
