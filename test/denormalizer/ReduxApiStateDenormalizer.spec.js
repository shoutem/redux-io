import { assert } from 'chai';
import { ReduxApiStateDenormalizer } from '../../src/index';
import { createSchemasMap } from '../../src/denormalizer/ReduxApiStateDenormalizer';
import {
  STATUS,
  createStatus,
  updateStatus,
} from '../../src/status';


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
  describe('denormalizeSingle', () => {
    it('denormalizes valid object relationships data', () => {
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

      const single = { value: { id: 'type1Id1', type: 'type1' } };
      const denormalizedData =
        denormalizer.denormalizeSingle(single, storage);
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
      denormalizer.denormalizeSingle('type1Id1', storage, 'type1');
      assert.deepEqual(
        denormalizedData,
        expectedData,
        'item not denormalized correctly'
      );
    });
    it('throws error when denormalizing primitive single and no schema provided', () => {
      const denormalizer = new ReduxApiStateDenormalizer();
      const storage = createSchemasMap(getStore(), createStorageMap());

      assert.throws(() => {
        denormalizer.denormalizeSingle('type1Id1', storage);
      }, 'Cannot create primitive single descriptor, schema is not provided.');
    });
    it('gets object from cache', () => {
      const denormalizer = new ReduxApiStateDenormalizer();
      const storage = createSchemasMap(getStore(), createStorageMap());

      const single = { value: { id: 'type1Id1', type: 'type1' } };

      const denormalizedData =
        denormalizer.denormalizeSingle(single, storage);
      const cachedDenormalizedData =
        denormalizer.denormalizeSingle(single, storage);

      assert.isOk(cachedDenormalizedData === denormalizedData, 'didn\'t get cached item');
      assert.isObject(cachedDenormalizedData[STATUS]);
      assert.isObject(cachedDenormalizedData['type2.test'][STATUS]);
    });
    it('returns new object when relationship changed', () => {
      const denormalizer = new ReduxApiStateDenormalizer();
      const store = getStore();
      let storage = createSchemasMap(store, createStorageMap());

      const single = { value: { id: 'type1Id1', type: 'type1' } };

      const denormalizedData = denormalizer.denormalizeSingle(single, storage);

      storage = createSchemasMap(getModifiedStore(store), createStorageMap());

      const notCachedDenormalizedData =
        denormalizer.denormalizeSingle(single, storage);

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
      assert.deepEqual(
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
        denormalizer.denormalizeCollection(collection, null, 'type1');
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
      collection[STATUS] = createStatus({ schema: 'type1', tag: ''});

      const denormalizedData =
        denormalizer.denormalizeCollection(collection);

      // Used to be sure that collection are not clashed between each other.
      // That not other cached collection data is used.
      const otherCollection = ['type1Id1'];
        otherCollection[STATUS] = createStatus({ schema: 'type1', tag: 'other'});
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
  });
});

