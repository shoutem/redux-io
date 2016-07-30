import { assert } from 'chai';
import RioCache from '../../src/cache/RioCache';
import {
  STATUS,
} from '../../src/status';
import _ from 'lodash';

function spread(obj) {
  return {
    ...obj,
  }
}

describe('RioCache', () => {
  describe('cache and get reference', () => {
    it('cache reference', () => {
      const cache = new RioCache();
      const reference = {};
      reference[STATUS] = { id: _.uniqueId() };
      cache.cacheReference(reference);
      assert.isOk(reference === cache.getReference(reference), 'did not cache valid reference');
    });
    it('doesn\'t cache non reference entity', () => {
      const cache = new RioCache();
      const reference = {};
      cache.cacheReference(reference);
      assert.isUndefined(cache.getReference(reference), 'returned something from cache');
    });
  });
  describe('getValidItem', () => {
    it('returns unchanged item', () => {
      const id = 1;
      const type = 'type';
      const reference = { id, type };
      reference[STATUS] = { id: _.uniqueId(), modifiedTimestamp: 1 };
      const cache = new RioCache(() => reference);

      const denormalizedReference = {};
      denormalizedReference[STATUS] = spread(reference[STATUS]);
      cache.cacheReference(denormalizedReference);

      assert.isOk(denormalizedReference === cache.getValidItem({ id, type }), 'didn\'t return valid reference');
    });
    it('doesn\'t return cached item when item changed', () => {
      const id = 1;
      const type = 'type';
      const reference = { id, type };
      const changedReference = { id, type };
      // simulate update - change modifiedTimestamp
      changedReference[STATUS] = { ...reference[STATUS], modifiedTimestamp: 2 };
      reference[STATUS] = { id: _.uniqueId(), modifiedTimestamp: 1 };
      const cache = new RioCache(() => changedReference);

      const denormalizedReference = {};
      denormalizedReference[STATUS] = spread(reference[STATUS]);
      cache.cacheReference(denormalizedReference);

      assert.isUndefined(cache.getValidItem({ id, type }), 'returned some entity');
    });
  });
  describe('getValidCollection', () => {
    it('returns unchanged collection', () => {
      const id = 1;
      const schema = 'type';
      const type = schema;
      const item = { id, type };
      const reference = [1];
      item[STATUS] = { id: _.uniqueId(), modifiedTimestamp: 1 };
      reference[STATUS] = { schema, id: _.uniqueId(), modifiedTimestamp: 1 };
      const cache = new RioCache(() => item);

      cache.cacheItem(item);

      const denormalizedReference = [{ id, type }];
      denormalizedReference[STATUS] = spread(reference[STATUS]);
      cache.cacheReference(denormalizedReference);

      const descriptorCollection = [{ id, type }];
      descriptorCollection[STATUS] = spread(reference[STATUS]);
      assert.isOk(
        denormalizedReference === cache.getValidCollection(descriptorCollection),
        'didn\'t return valid reference'
      );
    });
    it('doesn\'t return cached collection when collection updated', () => {
      const id = 1;
      const schema = 'type';
      const type = schema;
      const item = { id, type };
      const reference = [1];
      item[STATUS] = { id: _.uniqueId(), modifiedTimestamp: 1 };
      reference[STATUS] = { schema, id: _.uniqueId(), modifiedTimestamp: 1 };
      const cache = new RioCache(() => item);

      cache.cacheItem(item);

      const denormalizedReference = [{ id, type }];
      denormalizedReference[STATUS] = spread(reference[STATUS]);
      cache.cacheReference(denormalizedReference);

      const descriptorCollection = [{ id, type }];
      // simulate collection update - change modifiedTimestamp
      descriptorCollection[STATUS] = { ...reference[STATUS], modifiedTimestamp: 2 };
      assert.isUndefined(
        cache.getValidCollection(descriptorCollection),
        'didn\'t return valid reference'
      );
    });
    it('doesn\'t return cached collection when collection item updated', () => {
      const id = 1;
      const schema = 'type';
      const type = schema;
      const item = { id, type };
      const reference = [1];
      const changedItem = { id, type };
      item[STATUS] = { id: _.uniqueId(), modifiedTimestamp: 1 };
      // simulate item update - change modifiedTimestamp
      changedItem[STATUS] =  { ...item[STATUS], modifiedTimestamp: 2 };;
      reference[STATUS] = { schema, id: _.uniqueId(), modifiedTimestamp: 1 };
      const cache = new RioCache(() => changedItem);

      cache.cacheItem(item);

      const denormalizedReference = [{ id, type }];
      denormalizedReference[STATUS] = spread(reference[STATUS]);
      cache.cacheReference(denormalizedReference);

      const descriptorCollection = [{ id, type }];
      descriptorCollection[STATUS] = spread(reference[STATUS]);
      assert.isUndefined(
        cache.getValidCollection(descriptorCollection),
        'didn\'t return valid reference'
      );
    });
  });
});
