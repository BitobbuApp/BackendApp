export class NotificationType {
    constructor(
        public id: number,
        public name: string,
        public is_active: boolean = true,
        public icon: string | null = null,
    ) { }
}
