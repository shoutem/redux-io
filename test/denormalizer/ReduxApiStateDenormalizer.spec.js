import { assert } from 'chai';
import { ReduxApiStateDenormalizer } from '../../src/index';
import { createSchemasMap } from '../../src/denormalizer/ReduxApiStateDenormalizer';

function createStorageMap() {
  return {
    'type1': 'storage.type1',
    'type2.test': 'storage["type2.test"]',
  }
}

function getStore() {
  return {
    storage: {
      type1: {
        type1Id1: {
          attributes: {
            name: 'type1Id1'
          },
          relationships: {
            type1: {
              data: [
                { id: 'type1Id2', type: 'type1' },
                { id: 'type1Id3', type: 'type1' },
              ]
            },
            'type2.test': {
              data: {
                id: 'type2Id1', type: 'type2.test'
              }
            }
          }
        },
        type1Id2: {
          attributes: { name: 'type1Id2' },
        },
        type1Id3: {
          attributes: { name: 'type1Id3' },
          relationships: {
            type1: {
              data: [
                { id: 'type1Id2', type: 'type1' }
              ]
            }
          }
        },
      },
      'type2.test': {
        type2Id1: {
          attributes: {
            name: 'type2Id1',
          },
        }
      }
    },
  }
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
  describe('denormalizeItem', () => {
    it('denormalizes valid object relationships data', () => {
      const denormalizer = new ReduxApiStateDenormalizer();
      const expectedData = {
        name: 'type1Id1',
        'type2.test': {
          name: 'type2Id1'
        },
        type1: [
          { name: 'type1Id2' },
          { name: 'type1Id3', type1: [{ name: 'type1Id2' }] },
        ]
      };
      const storage = createSchemasMap(getStore(), createStorageMap());

      const denormalizedData =
        denormalizer.denormalizeItem('type1Id1', 'type1', storage);
      assert.deepEqual(
        denormalizedData,
        expectedData,
        'item not denormalized correctly'
      );
    });
  });
  describe('denormalizeCollection', () => {
    it('denormalizes valid object collection', () => {
      const denormalizer = new ReduxApiStateDenormalizer(getStore, createStorageMap());
      const expectedData = [
        {
          name: 'type1Id1',
          'type2.test': {
            name: 'type2Id1'
          },
          type1: [
            { name: 'type1Id2' },
            { name: 'type1Id3', type1: [{ name: 'type1Id2' }] },
          ]
        }
      ];
      const denormalizedData =
        denormalizer.denormalizeCollection(['type1Id1'], 'type1') ;
      assert.deepEqual(
        denormalizedData,
        expectedData,
        'collection not denormalized correctly'
      );
    });
  });
});

