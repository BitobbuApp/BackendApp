export class RequestInvitation {
    constructor(
        public readonly id: string,
        public readonly requestId: string,
        public readonly companyId: string,
        public readonly tier: number,
        public readonly score: number,
        public readonly status: string,
        public readonly notifiedAt: Date | null,
        public readonly viewedAt: Date | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date
    ) {}
}
