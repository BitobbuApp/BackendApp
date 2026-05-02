export class CityEntity {
    constructor(
        public id: number,
        public state_id: number,
        public name: string,
        public state_name: string | null = null,
    ) {}
}
