import chai, { assert } from 'chai';
import shallowDeepEqual from 'chai-shallow-deep-equal';
import sinon from 'sinon';
import { ReduxApiStateDenormalizer } from '../../src/index';
import { createSchemasMap } from '../../src/denormalizer/ReduxApiStateDenormalizer';
import {
  STATUS,
  createStatus,
} from '../../src/status';
import _ from 'lodash';

chai.use(shallowDeepEqual);

function mergeStatus(denormalizedData) {
  if (!denormalizedData) {
    return denormalizedData;
  }
  const result = _.mergeWith({}, denormalizedData, (objVal, srcVal, key, object) => {
    if (_.isArray(srcVal)) {
      return setStatusToCollectionItems(srcVal);
    } else if (_.isPlainObject(srcVal) && srcVal[STATUS]) {
      return {
        ...mergeStatus(srcVal),
        [STATUS]: srcVal[STATUS]
      }
    }
  });
  if (denormalizedData && denormalizedData[STATUS]) {
    result[STATUS] = denormalizedData[STATUS];
  }
  return result;
}

function setStatusToCollectionItems(collection) {
  return _.reduce(collection, (result, item, key) => {
    result[key] = mergeStatus(item);
    return result;
  }, []);
}

function addStatusToCollection(collection) {
  const collectionItemsWithStatus = setStatusToCollectionItems(collection);
  if (collection[STATUS]) {
    collectionItemsWithStatus[STATUS] = collection[STATUS];
  }
  return collectionItemsWithStatus;
}

function createStorageMap() {
  return {
    type1: 'storage.type1',
    'type2.test': 'storage["type2.test"]',
    typeA: 'storage.typeA',
  };
}

// NOTE!
// Take care when passing getStore in FindStorageMode,
// items statuses will be changed which means item has changed
// Better way is to first create storage and then pass the same storage with new function
const getStore = () => {
  const store = {
    storage: {
      type1: {
        type1Id1: {
          id: 'type1Id1',
          type: 'type1',
          attributes: {
            name: 'type1Id1',
          },
          relationships: {
            type1: {
              data: [
                {id: 'type1Id2', type: 'type1'},
                {id: 'type1Id3', type: 'type1'},
              ],
            },
            'type2.test': {
              data: {
                id: 'type2Id1', type: 'type2.test',
              },
            },
          },
        },
        type1Id2: {
          id: 'type1Id2',
          type: 'type1',
          attributes: {name: 'type1Id2'},
        },
        type1Id3: {
          id: 'type1Id3',
          type: 'type1',
          attributes: {name: 'type1Id3'},
          relationships: {
            type1: {
              data: [
                {id: 'type1Id2', type: 'type1'},
              ],
            },
          },
        },
        type1Id4: {
          id: 'type1Id4',
          type: 'type1',
          attributes: {name: 'type1Id4'},
          relationships: {
            type6: {
              data: [
                {id: 'type6Id1', type: 'type6'},
              ],
            },
            type1: {
              data: {
                id: 'type1Id7', type: 'type1',
              },
            },
          },
        },
        type1Id5: {
          id: 'type1Id5',
          type: 'type1',
          attributes: {name: 'type1Id4'},
          relationships: {
            type6: {
              data: [
                {id: 'type6Id1', type: 'type6'},
              ],
            },
            type1: {
              data: null,
            },
          },
        },
      },
      'type2.test': {
        type2Id1: {
          id: 'type2Id1',
          type: 'type2.test',
          attributes: {
            name: 'type2Id1',
          },
        },
      },
      typeA: {
        typeAId1: {
          id: 'typeAId1',
          type: 'typeA',
          attributes: {
            name: 'typeAId1',
          },
          relationships: {
            typeArel: {
              data: [
                {id: 'typeAId2', type: 'typeA'},
                {id: 'typeAId3', type: 'typeA'},
              ],
            },
          },
        },
        typeAId2: {
          id: 'typeAId2',
          type: 'typeA',
          attributes: {name: 'typeAId2'},
          relationships: {
            typeArel: {
              data: {id: 'typeAId1', type: 'typeA'},
            },
          },
        },
        typeAId3: {
          id: 'typeAId3',
          type: 'typeA',
          attributes: {name: 'typeAId3'},
          relationships: {
            typeArel: {
              data: {id: 'typeAId1', type: 'typeA'},
            },
          },
        },
      },
    },
  };
  store.storage.type1.type1Id1[STATUS] = createStatus();
  store.storage.type1.type1Id2[STATUS] = createStatus();
  store.storage.type1.type1Id3[STATUS] = createStatus();
  store.storage.type1.type1Id4[STATUS] = createStatus();
  store.storage.type1.type1Id5[STATUS] = createStatus();
  store.storage['type2.test'].type2Id1[STATUS] = createStatus();
  store.storage.typeA.typeAId1[STATUS] = createStatus();
  store.storage.typeA.typeAId2[STATUS] = createStatus();
  store.storage.typeA.typeAId3[STATUS] = createStatus();
  return store;
};
function getModifiedStore(store) {
  // Date.now() seems to not be fast enough to create different timestamp
  store.storage.type1.type1Id3 =
    Object.assign(store.storage.type1.type1Id3, { attributes: { name: 'New name type1Id3' }});
  store.storage.type1.type1Id3[STATUS].modifiedTimestamp =
    store.storage.type1.type1Id3[STATUS].modifiedTimestamp + 1;
  return store;
}
describe('ReduxApiStateDenormalizer', () => {
  describe('new instance', () => {
    it('creates ReduxApiStateDenormalizer instance', () => {
      const denormalizer = new ReduxApiStateDenormalizer();
      assert.isOk(
        denormalizer instanceof ReduxApiStateDenormalizer,
        'denormalizer not instance ReduxApiStateDenormalizer'
      );
    });
  });

  describe('denormalizeOne', () => {
    it('denormalizes valid object relationships data', () => {
      const one = { value: 'type1Id1' };
      one[STATUS] = { schema: 'type1' };
      const denormalizer = new ReduxApiStateDenormalizer();
      const storage = createSchemasMap(getStore(), createStorageMap());
      const expectedData = {
        id: 'type1Id1',
        type: 'type1',
        [STATUS]: one[STATUS],
        name: 'type1Id1',
        'type2.test': {
          [STATUS]: storage['type2.test']['type2Id1'][STATUS],
          id: 'type2Id1',
          type: 'type2.test',
          name: 'type2Id1',
        },
        type1: [
          {
            id: 'type1Id2',
            type: 'type1',
            name: 'type1Id2',
            [STATUS]: storage['type1']['type1Id2'][STATUS],
          },
          {
            id: 'type1Id3',
            type: 'type1',
            name: 'type1Id3',
            [STATUS]: storage['type1']['type1Id3'][STATUS],
            type1: [
              {
                id: 'type1Id2',
                type: 'type1',
                name: 'type1Id2',
                [STATUS]: storage['type1']['type1Id2'][STATUS],
              },
            ],
          },
        ],
      };

      const denormalizedData =
        mergeStatus(denormalizer.denormalizeOne(one, storage));

      assert.deepEqual(
        denormalizedData,
        expectedData,
        'item not denormalized correctly'
      );
    });

    it('denormalizes valid object with relationships items not in state', () => {
      const one = { value: 'type1Id4' };
      one[STATUS] = { schema: 'type1' };
      const denormalizer = new ReduxApiStateDenormalizer();
      const storage = createSchemasMap(getStore(), createStorageMap());
      const expectedData = {
        id: 'type1Id4',
        type: 'type1',
        [STATUS]: one[STATUS],
        name: 'type1Id4',
        type6: [
          {
            id: 'type6Id1',
            type: 'type6',
          },
        ],
        type1:{
          id: 'type1Id7',
          type: 'type1',
        },
      };


      const denormalizedData =
        mergeStatus(denormalizer.denormalizeOne(one, storage));

      assert.deepEqual(
        denormalizedData,
        expectedData,
        'item not denormalized correctly'
      );
    });

    it('denormalizes valid id', () => {
      const denormalizer = new ReduxApiStateDenormalizer();
      const storage = createSchemasMap(getStore(), createStorageMap());
      const expectedData = {
        id: 'type1Id1',
        type: 'type1',
        [STATUS]: storage['type1']['type1Id1'][STATUS],
        name: 'type1Id1',
        'type2.test': {
          [STATUS]: storage['type2.test']['type2Id1'][STATUS],
          id: 'type2Id1',
          type: 'type2.test',
          name: 'type2Id1',
        },
        type1: [
          {
            id: 'type1Id2',
            type: 'type1',
            name: 'type1Id2',
            [STATUS]: storage['type1']['type1Id2'][STATUS],
          },
          {
            id: 'type1Id3',
            type: 'type1',
            name: 'type1Id3',
            [STATUS]: storage['type1']['type1Id3'][STATUS],
            type1: [
              {
                id: 'type1Id2',
                type: 'type1',
                name: 'type1Id2',
                [STATUS]: storage['type1']['type1Id2'][STATUS],
              },
            ],
          },
        ],
      };

      const denormalizedData =
        mergeStatus(denormalizer.denormalizeOne('type1Id1', storage, 'type1'));
      assert.isObject(denormalizedData[STATUS]);
      assert.isObject(denormalizedData['type2.test'][STATUS]);
      assert.shallowDeepEqual(
        denormalizedData,
        expectedData,
        'item not denormalized correctly'
      );
    });

    it('denormalizes valid id with modification check cache', (done) => {
      const denormalizer = new ReduxApiStateDenormalizer(null, null, { useModificationCache: true });
      const storage = createSchemasMap(getStore(), createStorageMap());
      const expectedData = {
        id: 'type1Id1',
        type: 'type1',
        [STATUS]: storage['type1']['type1Id1'][STATUS],
        name: 'type1Id1',
        'type2.test': {
          [STATUS]: storage['type2.test']['type2Id1'][STATUS],
          id: 'type2Id1',
          type: 'type2.test',
          name: 'type2Id1',
        },
        type1: [
          {
            id: 'type1Id2',
            type: 'type1',
            name: 'type1Id2',
            [STATUS]: storage['type1']['type1Id2'][STATUS],
          },
          {
            id: 'type1Id3',
            type: 'type1',
            name: 'type1Id3',
            [STATUS]: storage['type1']['type1Id3'][STATUS],
            type1: [
              {
                id: 'type1Id2',
                type: 'type1',
                name: 'type1Id2',
                [STATUS]: storage['type1']['type1Id2'][STATUS],
              },
            ],
          },
        ],
      };

      // cache is time based
      setTimeout(() => {
        const denormalizedData =
          denormalizer.denormalizeOne('type1Id1', storage, 'type1');
        const denormalizedDataWithStatus =
          mergeStatus(denormalizedData);

        assert.isObject(denormalizedDataWithStatus[STATUS]);
        assert.isObject(denormalizedDataWithStatus['type2.test'][STATUS]);
        assert.shallowDeepEqual(
          denormalizedDataWithStatus,
          expectedData,
          'item not denormalized correctly'
        );

        const isChecked = sinon.spy(denormalizer.cache, "isChecked");
        const getValidItem = sinon.spy(denormalizer.cache, "getValidItem");

        const denormalizedDataWithCheck =
          denormalizer.denormalizeOne('type1Id1', storage, 'type1');

        assert.isOk(denormalizedData === denormalizedDataWithCheck);
        assert.isOk(isChecked.called, 'check not called');
        assert.isOk(getValidItem.notCalled, 'getValidItem called');
        assert.isOk(isChecked.returned(true), 'check returned false');

        done();
      }, 10);
    });

    it('denormalizes modified storage with valid id with modification check cache', (done) => {
      const denormalizer = new ReduxApiStateDenormalizer(null, null, { useModificationCache: true });
      const storage = createSchemasMap(getStore(), createStorageMap());

      const denormalizedData =
        denormalizer.denormalizeOne('type1Id1', storage, 'type1');

      const modifiedStore = getStore();
      modifiedStore.storage.type1.type1Id4.relationships.type1 = {
        data: {
          id: 'type1Id8', type: 'type1',
        },
      };

      // cache is time based
      setTimeout(() => {
        const modifiedStorage = createSchemasMap(modifiedStore, createStorageMap());
        denormalizer.invalidateModificationCache();

        const isChecked = sinon.spy(denormalizer.cache, "isChecked");
        const getValidItem = sinon.spy(denormalizer.cache, "getValidItem");

        const denormalizedDataWithCheck =
          denormalizer.denormalizeOne('type1Id1', storage, 'type1');

        assert.isOk(denormalizedData === denormalizedDataWithCheck);
        assert.isOk(isChecked.called, 'check not called');
        assert.isOk(getValidItem.called, 'getValidItem not called');
        assert.isOk(isChecked.returned(false), 'check returned true');
      done();
      }, 10);
    });

    it('denormalizes valid id with circular dependency', () => {
      const denormalizer = new ReduxApiStateDenormalizer();
      const storage = createSchemasMap(getStore(), createStorageMap());
      const expectedData = {
        id: 'typeAId1',
        type: 'typeA',
        [STATUS]: storage['typeA']['typeAId1'][STATUS],
        name: 'typeAId1',
        typeArel: [
          {
            id: 'typeAId2',
            type: 'typeA',
            name: 'typeAId2',
            [STATUS]: storage['typeA']['typeAId2'][STATUS],
            typeArel:
              {
                id: 'typeAId1',
                type: 'typeA',
              },
          },
          {
            id: 'typeAId3',
            type: 'typeA',
            name: 'typeAId3',
            [STATUS]: storage['typeA']['typeAId3'][STATUS],
            typeArel:
              {
                id: 'typeAId1',
                type: 'typeA',
              },
          },
        ],
      };

      const denormalizedData =
        mergeStatus(denormalizer.denormalizeOne('typeAId1', storage, 'typeA'));
      assert.isObject(denormalizedData[STATUS]);
      assert.shallowDeepEqual(
        denormalizedData,
        expectedData,
        'item not denormalized correctly'
      );

      const denormalizedDataFromCache =
        mergeStatus(denormalizer.denormalizeOne('typeAId1', storage, 'typeA'));
      assert.isObject(denormalizedDataFromCache[STATUS]);
      assert.shallowDeepEqual(
        denormalizedDataFromCache,
        expectedData,
        'item not denormalized correctly'
      );
    });

    it('denormalizes valid id with circular dependency - single relation', () => {
      const denormalizer = new ReduxApiStateDenormalizer();
      const storage = createSchemasMap(getStore(), createStorageMap());

      const expectedData = {
        id: 'typeAId3',
        type: 'typeA',
        [STATUS]: storage['typeA']['typeAId3'][STATUS],
        name: 'typeAId3',
        typeArel: {
          id: 'typeAId1',
          type: 'typeA',
          [STATUS]: storage['typeA']['typeAId1'][STATUS],
          name: 'typeAId1',
          typeArel: [
            {
              id: 'typeAId2',
              type: 'typeA',
            },
            {
              id: 'typeAId3',
              type: 'typeA',
            },
          ],
        },
      };

      const denormalizedData =
        denormalizer.denormalizeOne('typeAId3', storage, 'typeA');
      assert.shallowDeepEqual(
        denormalizedData,
        expectedData,
        'item not denormalized correctly'
      );

      const denormalizedDataFromCache =
        denormalizer.denormalizeOne('typeAId3', storage, 'typeA');

      assert.shallowDeepEqual(
        denormalizedDataFromCache,
        expectedData,
        'item not denormalized correctly'
      );
      assert.equal(
        denormalizedDataFromCache,
        denormalizedData,
        'item not retrived from cache'
      );

      const denormalizedOtherData =
      denormalizer.denormalizeOne('typeAId1', storage, 'typeA');

      const denormalizedDataFromCacheAfterOtherDenormalization =
      denormalizer.denormalizeOne('typeAId3', storage, 'typeA');
      assert.equal(
        denormalizedDataFromCache,
        denormalizedDataFromCacheAfterOtherDenormalization,
        'item not retrived from cache'
      );
    });

    it('denormalizes valid id with depth limit reached', () => {
      const denormalizer = new ReduxApiStateDenormalizer();
      denormalizer.setNestingDepthLimit(1);

      const storage = createSchemasMap(getStore(), createStorageMap());
      const expectedData = {
        id: 'typeAId1',
        type: 'typeA',
        [STATUS]: storage['typeA']['typeAId1'][STATUS],
        name: 'typeAId1',
        typeArel: [
          {
            id: 'typeAId2',
            type: 'typeA',
          },
          {
            id: 'typeAId3',
            type: 'typeA',
          },
        ],
      };

      const denormalizedData =
        denormalizer.denormalizeOne('typeAId1', storage, 'typeA');
      const denormalizedDataWithStatus =
        mergeStatus(denormalizedData);

        assert.isObject(denormalizedDataWithStatus[STATUS]);
      assert.shallowDeepEqual(
        denormalizedDataWithStatus,
        expectedData,
        'item not denormalized correctly'
      );

      const denormalizedDataFromCache =
        denormalizer.denormalizeOne('typeAId1', storage, 'typeA');
      const denormalizedDataFromCacheWithStatus =
        mergeStatus(denormalizedDataFromCache);

        assert.isObject(denormalizedDataFromCacheWithStatus[STATUS]);
      assert.shallowDeepEqual(
        denormalizedDataFromCacheWithStatus,
        expectedData,
        'item not denormalized correctly'
      );

      assert.isOk(denormalizedDataFromCache === denormalizedData);
      assert.equal(denormalizedDataFromCache, denormalizedData, 'item is not returned from cache');
    });

    it('denormalizes valid id with various depth limit reached', () => {
      const denormalizer = new ReduxApiStateDenormalizer();
      denormalizer.setNestingDepthLimit(1);

      const storage = createSchemasMap(getStore(), createStorageMap());
      const expectedData = {
        id: 'typeAId1',
        type: 'typeA',
        [STATUS]: storage['typeA']['typeAId1'][STATUS],
        name: 'typeAId1',
        typeArel: [
          {
            id: 'typeAId2',
            type: 'typeA',
          },
          {
            id: 'typeAId3',
            type: 'typeA',
          },
        ],
      };

      const denormalizedData =
        denormalizer.denormalizeOne('typeAId1', storage, 'typeA');
      const denormalizedDataWithStatus =
        mergeStatus(denormalizedData);

      assert.isObject(denormalizedDataWithStatus[STATUS]);
      assert.deepEqual(
        denormalizedDataWithStatus,
        expectedData,
        'item not denormalized correctly'
      );

      const expectedDeepData = {
        id: 'typeAId1',
        type: 'typeA',
        [STATUS]: storage['typeA']['typeAId1'][STATUS],
        name: 'typeAId1',
        typeArel: [
          {
            id: 'typeAId2',
            type: 'typeA',
            name: 'typeAId2',
            [STATUS]: storage['typeA']['typeAId2'][STATUS],
            typeArel:
              {
                id: 'typeAId1',
                type: 'typeA',
              },
          },
          {
            id: 'typeAId3',
            type: 'typeA',
            name: 'typeAId3',
            [STATUS]: storage['typeA']['typeAId3'][STATUS],
            typeArel:
              {
                id: 'typeAId1',
                type: 'typeA',
              },
          },
        ],
      };

      const denormalizedDeepDataFromCache =
        denormalizer.denormalizeOne('typeAId1', storage, 'typeA', 2);
      const denormalizedDeepDataFromCacheWithStatus =
        mergeStatus(denormalizedDeepDataFromCache);

      assert.isObject(denormalizedDeepDataFromCacheWithStatus[STATUS]);
      assert.deepEqual(
        denormalizedDeepDataFromCacheWithStatus,
        expectedDeepData,
        'item not denormalized correctly'
      );

      assert.isOk(denormalizedDeepDataFromCache !== denormalizedData);

      const denormalizedDataFromCache =
        denormalizer.denormalizeOne('typeAId1', storage, 'typeA');
      const denormalizedDataFromCacheWithStatus =
        mergeStatus(denormalizedDataFromCache);

      assert.isObject(denormalizedDataFromCacheWithStatus[STATUS]);
      assert.deepEqual(
        denormalizedDataFromCacheWithStatus,
        expectedData,
        'item not denormalized correctly'
      );

      assert.isOk(denormalizedDataFromCache !== denormalizedDeepDataFromCache);
      assert.isOk(denormalizedDataFromCache === denormalizedData);
    });

    it('throws error when denormalizing primitive one and no schema provided', () => {
      const denormalizer = new ReduxApiStateDenormalizer();
      const storage = createSchemasMap(getStore(), createStorageMap());

      assert.throws(() => {
        mergeStatus(denormalizer.denormalizeOne('type1Id1', storage));
      }, 'Cannot create primitive one descriptor, schema is not provided.');
    });

    it('gets object from cache', () => {
      const denormalizer = new ReduxApiStateDenormalizer();
      const storage = createSchemasMap(getStore(), createStorageMap());

      const one = { value: 'type1Id1' };
      one[STATUS] = { schema: 'type1', id: _.uniqueId(), modifiedTimestamp: 1 };

      const denormalizedData =
        denormalizer.denormalizeOne(one, storage);
      const cachedDenormalizedData =
        denormalizer.denormalizeOne(one, storage);

      assert.isOk(cachedDenormalizedData === denormalizedData, 'didn\'t get cached item');
      assert.isObject(cachedDenormalizedData[STATUS]);
      assert.isObject(cachedDenormalizedData['type2.test'][STATUS]);
    });

    it('gets object from cache for unexisting item ', () => {
      const denormalizer = new ReduxApiStateDenormalizer();
      const storage = createSchemasMap(getStore(), createStorageMap());

      const one = { value: 'unexisting' };
      one[STATUS] = { schema: 'type1', id: _.uniqueId(), modifiedTimestamp: 1 };

      const denormalizedData =
        denormalizer.denormalizeOne(one, storage);
      const cachedDenormalizedData =
        denormalizer.denormalizeOne(one, storage);

      assert.isOk(cachedDenormalizedData === denormalizedData, 'didn\'t get cached item');
    });

    it('gets object from cache for unexisting item with empty string (false) ID', () => {
      const denormalizer = new ReduxApiStateDenormalizer();
      const storage = createSchemasMap(getStore(), createStorageMap());

      const one = { value: '' };
      one[STATUS] = { schema: 'type1', id: _.uniqueId(), modifiedTimestamp: 1 };

      const denormalizedData =
        denormalizer.denormalizeOne(one, storage);
      const cachedDenormalizedData =
        denormalizer.denormalizeOne(one, storage);

      assert.isOk(cachedDenormalizedData === denormalizedData, 'didn\'t get cached item');
    });

    it('gets object from cache for unexisting item with ID 0 (false)', () => {
      const denormalizer = new ReduxApiStateDenormalizer();
      const storage = createSchemasMap(getStore(), createStorageMap());

      const one = { value: 0 };
      one[STATUS] = { schema: 'type1', id: _.uniqueId(), modifiedTimestamp: 1 };

      const denormalizedData =
        denormalizer.denormalizeOne(one, storage);
      const cachedDenormalizedData =
        denormalizer.denormalizeOne(one, storage);

      assert.isOk(cachedDenormalizedData === denormalizedData, 'didn\'t get cached item');
    });

    it('gets object from cache with single relationship null', () => {
      const denormalizer = new ReduxApiStateDenormalizer();
      const storage = createSchemasMap(getStore(), createStorageMap());

      const one = { value: 'type1Id5' };
      one[STATUS] = { schema: 'type1', id: _.uniqueId(), modifiedTimestamp: 1 };

      const denormalizedData =
        denormalizer.denormalizeOne(one, storage);
      const cachedDenormalizedData =
        denormalizer.denormalizeOne(one, storage);

      assert.isOk(cachedDenormalizedData === denormalizedData, 'didn\'t get cached item');
    });

    it('gets object from cache when no relationship items in state', () => {
      const denormalizer = new ReduxApiStateDenormalizer();
      const storage = createSchemasMap(getStore(), createStorageMap());

      const one = { value: 'type1Id4' };
      one[STATUS] = { schema: 'type1', id: _.uniqueId(), modifiedTimestamp: 1 };

      const denormalizedData =
        denormalizer.denormalizeOne(one, storage);
      const cachedDenormalizedData =
        denormalizer.denormalizeOne(one, storage);

      assert.isOk(cachedDenormalizedData === denormalizedData, 'didn\'t get cached item');
      assert.isObject(cachedDenormalizedData[STATUS]);
    });

    it('doesn\'t get cached object when relationship is change and no rel item in state', () => {
      const denormalizer = new ReduxApiStateDenormalizer();
      const storage = createSchemasMap(getStore(), createStorageMap());
      const modifiedStore = getStore();
      modifiedStore.storage.type1.type1Id4.relationships.type1 = {
        data: {
          id: 'type1Id8', type: 'type1',
        },
      };
      const modifiedStorage = createSchemasMap(modifiedStore, createStorageMap());

      const one = { value: 'type1Id4' };
      one[STATUS] = { schema: 'type1', id: _.uniqueId(), modifiedTimestamp: 1 };

      const denormalizedData =
        denormalizer.denormalizeOne(one, storage);

      const cachedDenormalizedData =
        denormalizer.denormalizeOne(one, modifiedStorage);

      assert.isOk(cachedDenormalizedData !== denormalizedData, 'got cached item');
      assert.isObject(cachedDenormalizedData[STATUS]);

      const modifiedDenormalizedData = { ...denormalizedData };
      modifiedDenormalizedData.type1 = {
        id: 'type1Id8', type: 'type1',
      };

      assert.shallowDeepEqual(
        modifiedDenormalizedData,
        cachedDenormalizedData,
        'one not denormalized correctly'
      );
    });

    it('returns new object when relationship changed', () => {
      const denormalizer = new ReduxApiStateDenormalizer();
      const store = getStore();
      let storage = createSchemasMap(store, createStorageMap());

      const one = { value: 'type1Id1' };
      one[STATUS] = { schema: 'type1', id: _.uniqueId() };

      const denormalizedData = denormalizer.denormalizeOne(one, storage);
      const denormalizedDataWithStatus = mergeStatus(denormalizedData);

      storage = createSchemasMap(getModifiedStore(store), createStorageMap());

      const notCachedDenormalizedData =
        denormalizer.denormalizeOne(one, storage);
      const notCachedDenormalizedDataWithStatus =
        mergeStatus(notCachedDenormalizedData);

      const expectedData = {
        id: 'type1Id1',
        type: 'type1',
        [STATUS]: one[STATUS],
        name: 'type1Id1',
        'type2.test': {
          [STATUS]: storage['type2.test']['type2Id1'][STATUS],
          id: 'type2Id1',
          type: 'type2.test',
          name: 'type2Id1',
        },
        type1: [
          {
            id: 'type1Id2',
            type: 'type1',
            name: 'type1Id2',
            [STATUS]: storage['type1']['type1Id2'][STATUS],
          },
          {
            id: 'type1Id3',
            type: 'type1',
            name: 'New name type1Id3',
            [STATUS]: storage['type1']['type1Id3'][STATUS],
            type1: [
              {
                id: 'type1Id2',
                type: 'type1',
                name: 'type1Id2',
                [STATUS]: storage['type1']['type1Id2'][STATUS],
              },
            ],
          },
        ],
      };

      assert.isOk(notCachedDenormalizedData !== denormalizedData, 'didn\'t create new object');
      assert.deepEqual(
        notCachedDenormalizedDataWithStatus,
        expectedData,
        'item not denormalized correctly'
      );
    });

    it('denormalize item which is not in state', () => {
      const denormalizer = new ReduxApiStateDenormalizer();
      const storage = createSchemasMap(getStore(), createStorageMap());
      const one = { value: 'type1Id7' };
      one[STATUS] = { schema: 'type1' };
      const denormalizedData = denormalizer.denormalizeOne(one, storage);
      const expectedData = {
        id: 'type1Id7',
        type: 'type1',
      };

      assert.deepEqual(
        denormalizedData,
        expectedData,
        'didn\'t return item descriptor'
      );
    });

    it('return undefined if one is "false"', () => {
      const denormalizer = new ReduxApiStateDenormalizer();
      assert.isOk(denormalizer.denormalizeOne() === undefined, 'didn\'t return undefined');
      assert.isOk(denormalizer.denormalizeOne(null) === undefined, 'didn\'t return undefined');
      assert.isOk(denormalizer.denormalizeOne(false) === undefined, 'didn\'t return undefined');
    });
  });

  describe('denormalizeCollection', () => {
    it('denormalizes valid object collection', () => {
      const store = getStore();
      const storage = createSchemasMap(store, createStorageMap());
      const denormalizer = new ReduxApiStateDenormalizer(() => store, createStorageMap());
      const collection = ['type1Id1'];
      collection[STATUS] = createStatus({ schema: 'type1', tag: ''});
      const expectedData = [
        {
          id: 'type1Id1',
          type: 'type1',
          name: 'type1Id1',
          [STATUS]: storage['type1']['type1Id1'][STATUS],
          'type2.test': {
            id: 'type2Id1',
            type: 'type2.test',
            name: 'type2Id1',
            [STATUS]: storage['type2.test']['type2Id1'][STATUS],
          },
          type1: [
            {
              id: 'type1Id2',
              type: 'type1',
              name: 'type1Id2',
              [STATUS]: storage['type1']['type1Id2'][STATUS],
            },
            {
              id: 'type1Id3',
              type: 'type1',
              name: 'type1Id3',
              [STATUS]: storage['type1']['type1Id3'][STATUS],
              type1: [
                {
                  id: 'type1Id2',
                  type: 'type1',
                  name: 'type1Id2',
                  [STATUS]: storage['type1']['type1Id2'][STATUS],
                },
              ],
            },
          ],
        },
      ];
      expectedData[STATUS] = collection[STATUS];
      const denormalizedData =
        denormalizer.denormalizeCollection(collection);
      assert.isObject(denormalizedData[STATUS]);
      assert.shallowDeepEqual(
        denormalizedData,
        expectedData,
        'collection not denormalized correctly'
      );
    });

    it('denormalizes valid array of ids', () => {
      const store = getStore();
      const storage = createSchemasMap(store, createStorageMap());
      const denormalizer = new ReduxApiStateDenormalizer(() => store, createStorageMap());
      const collection = ['type1Id1'];
      const expectedData = [
        {
          id: 'type1Id1',
          type: 'type1',
          name: 'type1Id1',
          [STATUS]: storage['type1']['type1Id1'][STATUS],
          'type2.test': {
            id: 'type2Id1',
            type: 'type2.test',
            name: 'type2Id1',
            [STATUS]: storage['type2.test']['type2Id1'][STATUS],
          },
          type1: [
            {
              id: 'type1Id2',
              type: 'type1',
              name: 'type1Id2',
              [STATUS]: storage['type1']['type1Id2'][STATUS],
            },
            {
              id: 'type1Id3',
              type: 'type1',
              name: 'type1Id3',
              [STATUS]: storage['type1']['type1Id3'][STATUS],
              type1: [
                {
                  id: 'type1Id2',
                  type: 'type1',
                  name: 'type1Id2',
                  [STATUS]: storage['type1']['type1Id2'][STATUS],
                },
              ],
            },
          ],
        },
      ];
      const denormalizedData =
        addStatusToCollection(denormalizer.denormalizeCollection(collection, null, 'type1'));
      assert.deepEqual(
        denormalizedData,
        expectedData,
        'collection not denormalized correctly'
      );
    });

    it('throws error when denormalizing array of ids without schema', () => {
      const denormalizer = new ReduxApiStateDenormalizer();
      const storage = createSchemasMap(getStore(), createStorageMap());

      assert.throws(() => {
        denormalizer.denormalizeCollection(['type1Id1'], storage);
      }, 'Denormalizing non RIO Collection (pure Array of IDs) but no schema provided!');
    });

    it('gets collection from cache', () => {
      const store = getStore();
      const denormalizer = new ReduxApiStateDenormalizer(() => store, createStorageMap());
      const collection = ['type1Id1'];
      collection[STATUS] = createStatus({ schema: 'type1', tag: '', id: _.uniqueId()});

      const denormalizedData =
        denormalizer.denormalizeCollection(collection);

      // Used to be sure that collection are not clashed between each other.
      // That not other cached collection data is used.
      const otherCollection = ['type1Id1'];
        otherCollection[STATUS] = createStatus({ schema: 'type1', tag: 'other', id: _.uniqueId()});
        denormalizer.denormalizeCollection(otherCollection);

      const cachedDenormalizedData =
        denormalizer.denormalizeCollection(collection);

      assert.isOk(cachedDenormalizedData === denormalizedData, 'didn\'t get cached item');
      assert.isObject(cachedDenormalizedData[STATUS]);
    });

    it('gets new collection reference when item changed', () => {
      const denormalizer = new ReduxApiStateDenormalizer();
      const collection = ['type1Id1'];
      collection[STATUS] = createStatus({ schema: 'type1', tag: ''});

      const store = getStore()
      let storage = createSchemasMap(store, createStorageMap());
      const denormalizedData =
        denormalizer.denormalizeCollection(collection, storage);
      storage = createSchemasMap(getModifiedStore(store), createStorageMap());
      const cachedDenormalizedData =
        denormalizer.denormalizeCollection(collection, storage);

      assert.isOk(cachedDenormalizedData !== denormalizedData, 'didn\'t create new reference');
      assert.isObject(cachedDenormalizedData[STATUS]);
    });

    it('return undefined if collection is "false"', () => {
      const denormalizer = new ReduxApiStateDenormalizer();
      assert.isOk(denormalizer.denormalizeCollection() === undefined, 'didn\'t return undefined');
      assert.isOk(denormalizer.denormalizeCollection(null) === undefined, 'didn\'t return undefined');
      assert.isOk(denormalizer.denormalizeCollection(false) === undefined, 'didn\'t return undefined');
    });
  });
});
