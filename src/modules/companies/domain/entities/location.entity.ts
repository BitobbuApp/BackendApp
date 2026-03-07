// src/modules/companies/domain/locationEntity.ts

export type VenezuelaState =
    | 'Amazonas' | 'Anzoategui' | 'Apure' | 'Aragua' | 'Barinas' | 'Bolivar' | 'Carabobo' | 'Cojedes'
    | 'Delta_Amacuro' | 'Distrito_Capital' | 'Falcon' | 'Guarico' | 'Lara' | 'Merida' | 'Miranda' | 'Monagas'
    | 'Nueva_Esparta' | 'Portuguesa' | 'Sucre' | 'Tachira' | 'Trujillo' | 'Vargas' | 'Yaracuy' | 'Zulia';

export class CompanyLocation {
    constructor(
        public id: string,
        public company_id: string,
        public state: VenezuelaState,
        public city: string,
        public tax_address: string | null = null,
        public national_coverage: boolean = false,
        public is_main_headquarters: boolean = true
    ) { }
}
