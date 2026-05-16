import { RequestInvitation } from "../entities/requestInvitation.entity";

export interface RequestInvitationRepository {
    create(data: Partial<RequestInvitation>): Promise<RequestInvitation>;
    updateStatus(id: string, status: string): Promise<void>;
}
