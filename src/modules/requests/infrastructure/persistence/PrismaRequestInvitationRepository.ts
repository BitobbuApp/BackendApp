import { prisma } from '../../../../shared/infrastructure/database';
import { RequestInvitationRepository } from '../../domain/repositories/requestInvitation.repository';
import { RequestInvitation } from '../../domain/entities/requestInvitation.entity';

export class PrismaRequestInvitationRepository implements RequestInvitationRepository {
    public async create(data: Partial<RequestInvitation>): Promise<RequestInvitation> {
        const created = await prisma.requestInvitation.create({
            data: {
                requestId: data.requestId!,
                companyId: data.companyId!,
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
            db.requestId,
            db.companyId,
            db.tier,
            Number(db.score),
            db.status,
            db.notifiedAt,
            db.viewedAt,
            db.createdAt,
            db.updatedAt
        );
    }
}
