// src/modules/requests/application/helpers/directRequestFields.ts
import { RequestEntity } from "../../domain/entities/request.entity";

/**
 * Direct RFQ fields exposed in every request response.
 * A request is "direct" when it was sent from a marketplace product to a single supplier.
 */
export function directRequestFields(request: RequestEntity) {
    return {
        is_direct: request.is_direct,
        target_company_id: request.target_company_id,
        company_offer_id: request.company_offer_id,
        target_company: request.target_company,
        offer: request.offer,
    };
}
