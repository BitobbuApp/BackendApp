// src/modules/companies/domain/companyEntity.ts

export type CompanyInterest = 'Comprar' | 'Vender' | 'Ambos';
export type CompanyVolume = 'Pequeño' | 'Medio' | 'Grande';
export type CompanyType = 'Fabricante' | 'Mayorista' | 'Distribuidor' | 'Prestador de Servicios' | 'Minorista';
export type CategoryType = 'Alimentos' | 'Ferretería' | 'Salud' | 'IT' | 'Automotriz' | 'Embalaje' | 'Químicos' | 'Oficina' | 'Textil' | 'Logística' | 'Mantenimiento' | 'Seguridad' | 'Marketing' | 'Legal' | 'RRHH';

export class Company {
    constructor(
        public id: string,
        public trade_name: string,
        public legal_name: string | null = null,
        public tax_id: string | null = null,
        public founding_year: number | null = null,
        public bio: string | null = null,
        public logo_url: string | null = null,
        public sector: CategoryType | null = null,
        public company_type: CompanyType | null = null,
        public interest: CompanyInterest = 'Ambos',
        public approximate_volume: CompanyVolume | null = 'Medio',
        public average_rating: number = 0,
        public transaction_count: number = 0,
        public review_count: number = 0,
        public created_at: Date | null = null,
        public updated_at: Date | null = null,
        // Relations
        public locations?: any[],
        public contacts?: any[],
        public commercial_profile?: any,
        public settings?: any,
        public payment_methods?: any[],
        public categories_of_interest?: any[]
    ) { }
}
