import chai, { assert } from 'chai';
import shallowDeepEqual from 'chai-shallow-deep-equal';
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
    },
  };
  store.storage.type1.type1Id1[STATUS] = createStatus();
  store.storage.type1.type1Id2[STATUS] = createStatus();
  store.storage.type1.type1Id3[STATUS] = createStatus();
  store.storage.type1.type1Id4[STATUS] = createStatus();
  store.storage['type2.test'].type2Id1[STATUS] = createStatus();
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

      const denormalizedData = mergeStatus(denormalizer.denormalizeOne(one, storage));

      storage = createSchemasMap(getModifiedStore(store), createStorageMap());

      const notCachedDenormalizedData =
        mergeStatus(denormalizer.denormalizeOne(one, storage));

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
        notCachedDenormalizedData,
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

