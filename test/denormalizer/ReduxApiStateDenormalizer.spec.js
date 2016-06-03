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
  describe('denormalizeItem', () => {
    it('denormalizes valid object relationships data', () => {
      const denormalizer = new ReduxApiStateDenormalizer();
      const expectedData = {
        id: 'type1Id1',
        type: 'type1',
        name: 'type1Id1',
        'type2.test': {
          id: 'type2Id1',
          type: 'type2.test',
          name: 'type2Id1',
        },
        type1: [
          { id: 'type1Id2', type: 'type1', name: 'type1Id2' },
          {
            id: 'type1Id3',
            type: 'type1',
            name: 'type1Id3',
            type1: [{ id: 'type1Id2', type: 'type1', name: 'type1Id2' }],
          },
        ],
      };
      const storage = createSchemasMap(getStore(), createStorageMap());

      const denormalizedData =
        denormalizer.denormalizeItem({id: 'type1Id1', type: 'type1'}, storage);
      assert.deepEqual(
        denormalizedData,
        expectedData,
        'item not denormalized correctly'
      );
      assert.isObject(denormalizedData[STATUS]);
      assert.isObject(denormalizedData['type2.test'][STATUS]);
    });
    it('gets object from cache', () => {
      const denormalizer = new ReduxApiStateDenormalizer();
      const expectedData = {
        id: 'type1Id1',
        type: 'type1',
        name: 'type1Id1',
        'type2.test': {
          id: 'type2Id1',
          type: 'type2.test',
          name: 'type2Id1',
        },
        type1: [
          { id: 'type1Id2', type: 'type1', name: 'type1Id2' },
          {
            id: 'type1Id3',
            type: 'type1',
            name: 'type1Id3',
            type1: [{ id: 'type1Id2', type: 'type1', name: 'type1Id2' }],
          },
        ],
      };
      const storage = createSchemasMap(getStore(), createStorageMap());

      const denormalizedData =
        denormalizer.denormalizeItem({id: 'type1Id1', type: 'type1'}, storage);
      const cachedDenormalizedData =
        denormalizer.denormalizeItem({id: 'type1Id1', type: 'type1'}, storage);
      assert.isOk(cachedDenormalizedData === denormalizedData, 'didn\'t get cached item');
      assert.isObject(cachedDenormalizedData[STATUS]);
      assert.isObject(cachedDenormalizedData['type2.test'][STATUS]);
    });
  });
  describe('denormalizeCollection', () => {
    it('denormalizes valid object collection', () => {
      const denormalizer = new ReduxApiStateDenormalizer(getStore, createStorageMap());
      const expectedData = [
        {
          id: 'type1Id1',
          type: 'type1',
          name: 'type1Id1',
          'type2.test': {
            id: 'type2Id1',
            type: 'type2.test',
            name: 'type2Id1',
          },
          type1: [
            { id: 'type1Id2', type: 'type1', name: 'type1Id2' },
            {
              id: 'type1Id3',
              type: 'type1',
              name: 'type1Id3',
              type1: [{ id: 'type1Id2', type: 'type1', name: 'type1Id2' }],
            },
          ],
        },
      ];
      const collection = ['type1Id1'];
      collection[STATUS] = createStatus({ schema: 'type1', tag: ''});
      const denormalizedData =
        denormalizer.denormalizeCollection(collection);
      assert.deepEqual(
        denormalizedData,
        expectedData,
        'collection not denormalized correctly'
      );
      assert.isObject(denormalizedData[STATUS]);
    });
    it('gets collection from cache', () => {
      const denormalizer = new ReduxApiStateDenormalizer(getStore, createStorageMap());
      const expectedData = [
        {
          id: 'type1Id1',
          type: 'type1',
          name: 'type1Id1',
          'type2.test': {
            id: 'type2Id1',
            type: 'type2.test',
            name: 'type2Id1',
          },
          type1: [
            { id: 'type1Id2', type: 'type1', name: 'type1Id2' },
            {
              id: 'type1Id3',
              type: 'type1',
              name: 'type1Id3',
              type1: [{ id: 'type1Id2', type: 'type1', name: 'type1Id2' }],
            },
          ],
        },
      ];
      const collection = ['type1Id1'];
      collection[STATUS] = createStatus({ schema: 'type1', tag: ''});
      const denormalizedData =
        denormalizer.denormalizeCollection(collection);
      const cachedDenormalizedData =
        denormalizer.denormalizeCollection(collection);

      assert.isOk(cachedDenormalizedData === denormalizedData, 'didn\'t get cached item');
      assert.isObject(cachedDenormalizedData[STATUS]);

    });
  });
});

