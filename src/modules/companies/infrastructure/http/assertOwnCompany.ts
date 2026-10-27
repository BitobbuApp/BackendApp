import { ApplicationError } from '../../../../shared/domain/error';

/**
 * A user may only read or change settings of the company they belong to.
 * `request.user.companyId` is loaded from the database by authMiddleware on every request, not taken from the token.
 */
export function assertOwnCompany(request: { user?: { companyId?: string | null } | undefined }, companyId: string): void {
    const own = request.user?.companyId;
    if (!own || own !== companyId) {
        throw new ApplicationError(403, 'No tienes permisos para acceder a esta empresa', 'AUTHORIZATION_ERROR', 'AUTHORIZATION');
    }
}
