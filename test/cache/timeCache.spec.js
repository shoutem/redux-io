import { assert } from 'chai';
import { STATUS } from '../../src/status';
import collection from '../../src/reducers/collection';
import { createCacheSettings, isCacheValid } from '../../src/cache/timeCache';

describe('Time Cache', () => {
  describe('createCacheSettings', () => {
    it('creates cache settings object', () => {
      const cacheLifetime = 1000;
      assert.deepEqual(createCacheSettings(cacheLifetime), { cacheLifetime });
    });
  });
  describe('isCacheValid', () => {
    it('return true for valid cache', () => {
      const cacheLifetime = 1000;
      const reducer = collection('schema', 'tag', undefined, createCacheSettings(cacheLifetime));
      const state = reducer(undefined, {});
      const stateStatus = state[STATUS];
      stateStatus.modificationTimestamp = Date.now();
      assert.isOk(isCacheValid(state));
    });
    it('return false for invalid cache', () => {
      const cacheLifetime = 1000;
      const reducer = collection('schema', 'tag', undefined, createCacheSettings(cacheLifetime));
      const state = reducer(undefined, {});
      const stateStatus = state[STATUS];
      // Fake modification like it is past cacheLifetime
      stateStatus.modificationTimestamp = Date.now() - (cacheLifetime + 1);
      assert.isNotOk(isCacheValid(state));
    });
  });
});
