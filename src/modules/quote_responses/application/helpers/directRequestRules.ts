import { UnauthorizedActorError } from "../../domain/errors/quote_response.errors";

/**
 * Business rules for direct RFQs (requests sent from a marketplace product to a single supplier).
 * A request is direct when it has a target_company_id.
 */

/** Only the target supplier can quote a direct request. Open requests can be quoted by any seller. */
export function assertCanQuoteRequest(targetCompanyId: string | null, supplierId: string): void {
    if (targetCompanyId && targetCompanyId !== supplierId) {
        throw new UnauthorizedActorError("Only the target supplier can quote a direct request");
    }
}

/** A supplier can only start the negotiation on a direct request addressed to them. */
export function assertSupplierCanStartNegotiation(targetCompanyId: string | null, supplierCompanyId: string): void {
    if (!targetCompanyId || targetCompanyId !== supplierCompanyId) {
        throw new UnauthorizedActorError("Suppliers can only start the negotiation on direct requests addressed to them");
    }
}
