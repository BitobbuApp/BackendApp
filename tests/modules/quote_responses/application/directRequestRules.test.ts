import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { assertCanQuoteRequest, assertSupplierCanStartNegotiation } from '../../../../src/modules/quote_responses/application/helpers/directRequestRules';
import { UnauthorizedActorError } from '../../../../src/modules/quote_responses/domain/errors/quote_response.errors';

const SUPPLIER = '33333333-3333-4333-8333-333333333333';
const OTHER_SELLER = '44444444-4444-4444-8444-444444444444';

describe('assertCanQuoteRequest', () => {
    test('any seller can quote an open request', () => {
        assert.doesNotThrow(() => assertCanQuoteRequest(null, OTHER_SELLER));
    });

    test('only the target supplier can quote a direct request', () => {
        assert.doesNotThrow(() => assertCanQuoteRequest(SUPPLIER, SUPPLIER));
        assert.throws(() => assertCanQuoteRequest(SUPPLIER, OTHER_SELLER), UnauthorizedActorError);
    });
});

describe('assertSupplierCanStartNegotiation', () => {
    test('supplier cannot start the negotiation on an open request', () => {
        assert.throws(() => assertSupplierCanStartNegotiation(null, SUPPLIER), UnauthorizedActorError);
    });

    test('target supplier can start the negotiation on its direct request', () => {
        assert.doesNotThrow(() => assertSupplierCanStartNegotiation(SUPPLIER, SUPPLIER));
        assert.throws(() => assertSupplierCanStartNegotiation(SUPPLIER, OTHER_SELLER), UnauthorizedActorError);
    });
});
