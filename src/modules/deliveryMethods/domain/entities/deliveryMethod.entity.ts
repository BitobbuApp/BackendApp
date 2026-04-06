export class DeliveryMethodEntity {
    constructor(
        public id: string,
        public country_id: number,
        public name: string,
        public is_active: boolean
    ) {}
}
