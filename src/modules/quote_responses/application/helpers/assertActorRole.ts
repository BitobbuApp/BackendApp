import { prisma } from '../../../../shared/infrastructure/database';
import { ActorRole } from '../strategies/QuoteRevisionStrategy';

export class UnauthorizedActorError extends Error {
    public readonly statusCode = 403;
    constructor(role: string, action: string) {
        super(`Company role "${role}" is not authorized to perform action "${action}".`);
        this.name = 'UnauthorizedActorError';
    }
}

export interface ActorContext {
    role: ActorRole;
    buyerCompanyId: string;
    supplierCompanyId: string;
}

/**
 * Determines the actor role and validates authorization.
 *
 * Loads the QuoteResponse + its parent Request to figure out
 * whether the actorCompanyId is the buyer (request owner) or the supplier.
 */
export async function assertActorRole(
    quoteResponseId: string,
    actorCompanyId: string,
    allowedRoles: ActorRole[],
    action: string,
): Promise<ActorContext> {
    const qr = await prisma.quoteResponse.findUniqueOrThrow({
        where: { id: quoteResponseId },
        select: {
            supplier_id: true,
            request: { select: { company_id: true } },
        },
    });

    const buyerCompanyId = qr.request.company_id;
    const supplierCompanyId = qr.supplier_id;

    let role: ActorRole;
    if (actorCompanyId === buyerCompanyId) {
        role = 'buyer';
    } else if (actorCompanyId === supplierCompanyId) {
        role = 'supplier';
    } else {
        throw new UnauthorizedActorError('unknown', action);
    }

    if (!allowedRoles.includes(role)) {
        throw new UnauthorizedActorError(role, action);
    }

    return { role, buyerCompanyId, supplierCompanyId };
}
