import { prisma } from '../shared/infrastructure/database';

export async function expireInvitations() {
  await prisma.requestInvitation.updateMany({
    where: {
      status: 'PENDING',
      request: { status: 'expired' },
    },
    data: { status: 'EXPIRED' },
  });
}
