import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { UpdateCompanyOfferUseCase } from '../../../../src/modules/companyOffers/application/updateCompanyOfferUseCase';
import { DeleteCompanyOfferUseCase } from '../../../../src/modules/companyOffers/application/deleteCompanyOfferUseCase';
import { GetMarketplaceOfferByIdUseCase } from '../../../../src/modules/companyOffers/application/getMarketplaceOfferByIdUseCase';
import { CompanyOfferAccessDeniedError, CompanyOfferNotFoundError } from '../../../../src/modules/companyOffers/domain/errors/companyOffer.errors';

const OFFER_ID = '11111111-1111-4111-8111-111111111111';
const OWNER_COMPANY = '22222222-2222-4222-8222-222222222222';
const OTHER_COMPANY = '33333333-3333-4333-8333-333333333333';

const buildOffer = (overrides: any = {}) => ({
    id: OFFER_ID,
    company_id: OWNER_COMPANY,
    name: 'Cemento gris',
    is_active: true,
    photos: [],
    pricing_tiers: [],
    ...overrides
});

class MockCompanyOfferRepository {
    public offer: any = buildOffer();
    public activeOffer: any = buildOffer();
    public updateCalls: any[] = [];
    public deleteCalls: string[] = [];

    async findById(id: string) { return this.offer; }
    async findActiveById(id: string) { return this.activeOffer; }
    async update(id: string, data: any) {
        this.updateCalls.push({ id, data });
        return { ...this.offer, ...data };
    }
    async delete(id: string) { this.deleteCalls.push(id); }
}

const withRepo = <T>(useCase: T, repo: MockCompanyOfferRepository): T => {
    (useCase as any).companyOfferRepository = repo;
    return useCase;
};

describe('UpdateCompanyOfferUseCase ownership', () => {
    test('rejects updates from a company that does not own the offer', async () => {
        const repo = new MockCompanyOfferRepository();
        const useCase = withRepo(new UpdateCompanyOfferUseCase(), repo);
        await assert.rejects(
            useCase.execute({ id: OFFER_ID, requester_company_id: OTHER_COMPANY, name: 'Hack' }),
            CompanyOfferAccessDeniedError
        );
        assert.equal(repo.updateCalls.length, 0);
    });

    test('allows the owner company to update and does not leak requester_company_id', async () => {
        const repo = new MockCompanyOfferRepository();
        const useCase = withRepo(new UpdateCompanyOfferUseCase(), repo);
        const result = await useCase.execute({ id: OFFER_ID, requester_company_id: OWNER_COMPANY, name: 'Cemento blanco' });
        assert.equal(result.name, 'Cemento blanco');
        assert.equal(repo.updateCalls.length, 1);
        assert.equal(repo.updateCalls[0].data.requester_company_id, undefined);
    });
});

describe('DeleteCompanyOfferUseCase ownership', () => {
    test('rejects deletes from a company that does not own the offer', async () => {
        const repo = new MockCompanyOfferRepository();
        const useCase = withRepo(new DeleteCompanyOfferUseCase(), repo);
        await assert.rejects(
            useCase.execute({ id: OFFER_ID, requester_company_id: OTHER_COMPANY }),
            CompanyOfferAccessDeniedError
        );
        assert.equal(repo.deleteCalls.length, 0);
    });

    test('allows the owner company to delete', async () => {
        const repo = new MockCompanyOfferRepository();
        const useCase = withRepo(new DeleteCompanyOfferUseCase(), repo);
        await useCase.execute({ id: OFFER_ID, requester_company_id: OWNER_COMPANY });
        assert.deepEqual(repo.deleteCalls, [OFFER_ID]);
    });
});

describe('GetMarketplaceOfferByIdUseCase', () => {
    test('returns 404 when the offer is inactive or deleted', async () => {
        const repo = new MockCompanyOfferRepository();
        repo.activeOffer = null;
        const useCase = withRepo(new GetMarketplaceOfferByIdUseCase(), repo);
        await assert.rejects(useCase.execute(OFFER_ID), CompanyOfferNotFoundError);
    });

    test('returns active offers', async () => {
        const repo = new MockCompanyOfferRepository();
        const useCase = withRepo(new GetMarketplaceOfferByIdUseCase(), repo);
        const result = await useCase.execute(OFFER_ID);
        assert.equal(result.id, OFFER_ID);
    });
});
