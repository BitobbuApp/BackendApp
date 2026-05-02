export type AdminLookupTableKey =
    | 'categories'
    | 'company_types'
    | 'payment_methods'
    | 'units_of_measure'
    | 'verif_doc_types'
    | 'estimated_monthly_transactions'
    | 'company_sizes'
    | 'payment_conditions'
    | 'payment_terms'
    | 'verification_statuses';

export class AdminLookupItemEntity {
    constructor(
        public id: string | number,
        public code: string,
        public label: string,
        public is_active: boolean,
    ) {}
}
