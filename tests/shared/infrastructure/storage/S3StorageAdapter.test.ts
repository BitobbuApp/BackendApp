import test from 'node:test';
import assert from 'node:assert/strict';
import { S3StorageAdapter } from '../../../../src/shared/infrastructure/storage/S3StorageAdapter';

test('S3StorageAdapter instantiation', () => {
    assert.doesNotThrow(() => {
        new S3StorageAdapter('us-east-1', 'http://localhost:9000', 'testKey', 'testSecret', 'testBucket');
    });
});
