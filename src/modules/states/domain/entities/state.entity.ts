export class State {
    constructor(
        public id: number,
        public country_id: number,
        public name: string,
        public code: string | null = null,
        public is_active: boolean = true,
    ) { }
}
