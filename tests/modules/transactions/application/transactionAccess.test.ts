import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { GetTransactionByIdUseCase } from '../../../../src/modules/transactions/application/getTransactionByIdUseCase';
import { UnauthorizedTransactionActorError } from '../../../../src/modules/transactions/application/helpers/assertTransactionActorRole';
import { TransactionNotFoundError } from '../../../../src/modules/transactions/domain/errors/transaction.errors';

const TRANSACTION_ID = '99999999-9999-4999-8999-999999999999';
const QUOTE_ID = '77777777-7777-4777-8777-777777777777';
const BUYER = '22222222-2222-4222-8222-222222222222';
const SUPPLIER = '33333333-3333-4333-8333-333333333333';
const THIRD = '44444444-4444-4444-8444-444444444444';

const transaction = {
    id: TRANSACTION_ID,
    quote_response_id: QUOTE_ID,
    buyer_id: BUYER,
    supplier_id: SUPPLIER,
    product_description: 'Cemento gris',
    unit_price_usd: 10,
    quantity: 5,
    total_amount_usd: 50,
    status: 'awaiting_payment',
    buyer_confirmed: false,
    supplier_confirmed: false,
};

const read = (requester: string, found: any = transaction) => {
    const useCase = new GetTransactionByIdUseCase();
    (useCase as any).transactionRepository = { findById: async () => found };
    return useCase.execute({ id: TRANSACTION_ID, requester_company_id: requester });
};

describe('GET /transactions/:id (GetTransactionByIdUseCase)', () => {
    test('buyer and supplier can read the transaction', async () => {
        assert.equal((await read(BUYER)).id, TRANSACTION_ID);
        assert.equal((await read(SUPPLIER)).id, TRANSACTION_ID);
    });

    test('a third company cannot read it', async () => {
        await assert.rejects(read(THIRD), UnauthorizedTransactionActorError);
    });

    test('unknown transaction → 404', async () => {
        await assert.rejects(read(BUYER, null), TransactionNotFoundError);
    });
});
