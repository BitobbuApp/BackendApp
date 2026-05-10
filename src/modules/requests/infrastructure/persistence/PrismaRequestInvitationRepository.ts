import { prisma } from '../../../../shared/infrastructure/database';
import { RequestInvitationRepository } from '../../domain/repositories/requestInvitation.repository';
import { RequestInvitation } from '../../domain/entities/requestInvitation.entity';

export class PrismaRequestInvitationRepository implements RequestInvitationRepository {
    public async create(data: Partial<RequestInvitation>): Promise<RequestInvitation> {
        const created = await prisma.requestInvitation.create({
            data: {
                request_id: data.requestId!,
                company_id: data.companyId!,
                tier: data.tier!,
                score: data.score!,
                status: data.status ?? 'PENDING',
            }
        });
        return this.mapToEntity(created);
    }

    public async updateStatus(id: string, status: string): Promise<void> {
        await prisma.requestInvitation.update({
            where: { id },
            data: { status }
        });
    }

    private mapToEntity(db: any): RequestInvitation {
        return new RequestInvitation(
            db.id,
            db.request_id,
            db.company_id,
            db.tier,
            Number(db.score),
            db.status,
            db.notified_at,
            db.viewed_at,
            db.created_at,
            db.updated_at
        );
    }
}
