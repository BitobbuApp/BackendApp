import { prisma } from '../../../../shared/infrastructure/database';
import { ActorRole } from '../strategies/TransactionStrategy';

import { UnauthorizedActorError } from "../../domain/errors/transaction.errors";

export class UnauthorizedTransactionActorError extends UnauthorizedActorError {
    public readonly statusCode = 403;
    constructor(role: string, action: string) {
        super(`Company role "${role}" is not authorized to perform transaction action "${action}".`);
        this.name = 'UnauthorizedTransactionActorError';
    }
}

export interface TransactionActorContext {
    role: ActorRole;
    buyerCompanyId: string;
    supplierCompanyId: string;
}

/**
 * Determines if the actorCompanyId is the buyer or supplier of the transaction
 * and validates authorization.
 */
export async function assertTransactionActorRole(
    transactionId: string,
    actorCompanyId: string,
    allowedRoles: ActorRole[],
    action: string,
): Promise<TransactionActorContext> {
    const tx = await prisma.transaction.findUniqueOrThrow({
        where: { id: transactionId },
        select: { buyer_id: true, supplier_id: true },
    });

    let role: ActorRole;
    if (actorCompanyId === tx.buyer_id) {
        role = 'buyer';
    } else if (actorCompanyId === tx.supplier_id) {
        role = 'supplier';
    } else {
        throw new UnauthorizedTransactionActorError('unknown', action);
    }

    if (!allowedRoles.includes(role)) {
        throw new UnauthorizedTransactionActorError(role, action);
    }

    return { role, buyerCompanyId: tx.buyer_id, supplierCompanyId: tx.supplier_id };
}
