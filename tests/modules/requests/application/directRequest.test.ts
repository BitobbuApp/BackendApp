import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CreateRequestUseCase } from '../../../../src/modules/requests/application/createRequestUseCase';
import { GetRequestByIdUseCase } from '../../../../src/modules/requests/application/getRequestByIdUseCase';
import { RequestEntity } from '../../../../src/modules/requests/domain/entities/request.entity';
import { DirectRequestSelfTargetError, RequestAccessDeniedError } from '../../../../src/modules/requests/domain/errors/request.errors';
import { CompanyOfferNotFoundError } from '../../../../src/modules/companyOffers/domain/errors/companyOffer.errors';

const REQUEST_ID = '11111111-1111-4111-8111-111111111111';
const BUYER = '22222222-2222-4222-8222-222222222222';
const SUPPLIER = '33333333-3333-4333-8333-333333333333';
const OTHER_SELLER = '44444444-4444-4444-8444-444444444444';
const OFFER_ID = '55555555-5555-4555-8555-555555555555';

const buildRequest = (targetCompanyId: string | null) => new RequestEntity(
    REQUEST_ID, BUYER, 'Cemento gris', 10, null, 1, 'Sacos', null, null, null,
    'active', 'product', null, 0, null, null, null, null, null, null, [], 1, new Date(), new Date(),
    targetCompanyId, targetCompanyId ? OFFER_ID : null
);

const buildCreateInput = () => ({
    company_id: BUYER,
    product_service: 'Cemento gris',
    quantity: 10,
    type: 1,
    company_offer_id: OFFER_ID,
});

describe('CreateRequestUseCase (direct RFQ)', () => {
    test('rejects a direct request to an offer of the same company', async () => {
        const useCase = new CreateRequestUseCase();
        let created = false;
        (useCase as any).companyOfferRepository = {
            findActiveById: async () => ({ id: OFFER_ID, company_id: BUYER, category_id: 3 }),
        };
        (useCase as any).requestRepository = { create: async () => { created = true; } };

        await assert.rejects(useCase.execute(buildCreateInput()), DirectRequestSelfTargetError);
        assert.equal(created, false);
    });

    test('rejects a direct request to an inactive or missing offer', async () => {
        const useCase = new CreateRequestUseCase();
        (useCase as any).companyOfferRepository = { findActiveById: async () => null };
        (useCase as any).requestRepository = { create: async () => { throw new Error('should not create'); } };

        await assert.rejects(useCase.execute(buildCreateInput()), CompanyOfferNotFoundError);
    });
});

describe('GetRequestByIdUseCase (direct RFQ visibility)', () => {
    const run = (request: RequestEntity, requester: string) => {
        const useCase = new GetRequestByIdUseCase();
        (useCase as any).requestRepository = { findById: async () => request };
        return useCase.execute({ id: REQUEST_ID, requester_company_id: requester });
    };

    test('denies a seller that is not the target of a direct request', async () => {
        await assert.rejects(run(buildRequest(SUPPLIER), OTHER_SELLER), RequestAccessDeniedError);
    });

    test('allows the buyer and the target supplier', async () => {
        const forBuyer = await run(buildRequest(SUPPLIER), BUYER);
        const forSupplier = await run(buildRequest(SUPPLIER), SUPPLIER);
        assert.equal(forBuyer.is_direct, true);
        assert.equal(forSupplier.target_company_id, SUPPLIER);
    });

    test('open requests stay visible to any seller', async () => {
        const result = await run(buildRequest(null), OTHER_SELLER);
        assert.equal(result.is_direct, false);
    });
});
