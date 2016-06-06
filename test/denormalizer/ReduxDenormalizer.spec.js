/* eslint-disable no-new */
import { assert } from 'chai';
import ReduxDenormalizer from '../../src/denormalizer/ReduxDenormalizer';

function getStore() {
  return {
    storage: {
      type1: {
        type1Id1: {
          attributes: {
            id: 'type1Id1',
            type: 'type1',
            name: 'type1Id1',
          },
          relationships: {
            type1: {
              data: [
                { id: 'type1Id2', type: 'type1' },
                { id: 'type1Id3', type: 'type1' },
              ],
            },
            type2: {
              data: {
                id: 'type2Id1', type: 'type2',
              },
            },
          },
        },
        type1Id2: {
          id: 'type1Id2',
          type: 'type1',
          attributes: { name: 'type1Id2' },
        },
        type1Id3: {
          id: 'type1Id3',
          type: 'type1',
          attributes: { name: 'type1Id3' },
          relationships: {
            type1: {
              data: [
                { id: 'type1Id2', type: 'type1' },
              ],
            },
          },
        },
      },
      type2: {
        type2Id1: {
          id: 'type2Id1',
          type: 'type2',
          attributes: {
            name: 'type2Id1',
          },
        },
      },
    },
  };
}

describe('ReduxDenormalizer', () => {
  describe('new instance', () => {
    it('creates ReduxDenormalizer instance', () => {
      const denormalizer = new ReduxDenormalizer();
      assert.isOk(
        denormalizer instanceof ReduxDenormalizer,
        'denormalizer not instance ReduxDenormalizer'
      );
    });
    it('creates ReduxDenormalizer instance in FindStorage mode', () => {
      const denormalizer = new ReduxDenormalizer(getStore, 'storage');
      assert.isOk(
        !denormalizer.provideStorageMode,
        'denormalizer not in FindStorage mode'
      );
    });
    it('creates ReduxDenormalizer instance in ProvideStorage mode', () => {
      const denormalizer = new ReduxDenormalizer();
      assert.isOk(
        denormalizer.provideStorageMode,
        'denormalizer not in ProvideStorage mode'
      );
    });
    it('throws error if invalid getStore argument', () => {
      assert.throw(() => {
        new ReduxDenormalizer(1);
      }, 'Invalid getStore, must be function');
    });
    it('throws error if invalid storagePath argument', () => {
      assert.throw(() => {
        new ReduxDenormalizer(getStore, {});
      }, 'Invalid storagePath, must be string');
    });
  });
  describe('denormalizeItem', () => {
    it('denormalizes valid object relationships data in FindStorage mode', () => {
      const denormalizer = new ReduxDenormalizer(getStore, 'storage');
      const expectedData = {
        id: 'type1Id1',
        type: 'type1',
        name: 'type1Id1',
        type2: {
          id: 'type2Id1',
          type: 'type2',
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
      const denormalizedData =
        denormalizer.denormalizeItem({ id: 'type1Id1', type: 'type1' });
      assert.deepEqual(
        denormalizedData,
        expectedData,
        'item not denormalized correctly'
      );
    });
    it('denormalizes valid object relationships data in ProvideStorage mode', () => {
      const denormalizer = new ReduxDenormalizer();
      const expectedData = {
        id: 'type1Id1',
        type: 'type1',
        name: 'type1Id1',
        type2: {
          id: 'type2Id1',
          type: 'type2',
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
      const denormalizedData =
        denormalizer.denormalizeItemWithStorage(
          { id: 'type1Id1', type: 'type1' },
          getStore().storage
        );
      assert.deepEqual(
        denormalizedData,
        expectedData,
        'item not denormalized correctly'
      );
    });
    it('throws error if invalid storage in ProvideStorage mode', () => {
      assert.throw(() => {
        new ReduxDenormalizer().denormalizeItem();
      }, 'Invalid storage, ProvideStorage mode requires storage object');
    });
  });
  describe('denormalizeCollection', () => {
    it('denormalizes valid object collection in FindStorage mode', () => {
      const denormalizer = new ReduxDenormalizer(getStore, 'storage');
      const expectedData = [
        {
          id: 'type1Id1',
          type: 'type1',
          name: 'type1Id1',
          type2: {
            id: 'type2Id1',
            type: 'type2',
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
        {
          id: 'type2Id1',
          type: 'type2',
          name: 'type2Id1',
        },
      ];
      const denormalizedData =
        denormalizer.denormalizeCollection([
          { id: 'type1Id1', type: 'type1' },
          { id: 'type2Id1', type: 'type2' },
        ]);
      assert.deepEqual(
        denormalizedData,
        expectedData,
        'collection not denormalized correctly'
      );
    });
    it('denormalizes valid object collection in ProvideStorage mode', () => {
      const denormalizer = new ReduxDenormalizer();
      const expectedData = [
        {
          id: 'type1Id1',
          type: 'type1',
          name: 'type1Id1',
          type2: {
            id: 'type2Id1',
            type: 'type2',
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
        {
          id: 'type2Id1',
          type: 'type2',
          name: 'type2Id1',
        },
      ];
      const denormalizedData =
        denormalizer.denormalizeCollection(
          [
            { id: 'type1Id1', type: 'type1' },
            { id: 'type2Id1', type: 'type2' },
          ],
          getStore().storage
        );
      assert.deepEqual(
        denormalizedData,
        expectedData,
        'collection not denormalized correctly'
      );
    });
    it('throws error if invalid storage in ProvideStorage mode', () => {
      assert.throw(() => {
        new ReduxDenormalizer().denormalizeCollection([1]);
      }, 'Invalid storage, ProvideStorage mode requires storage object');
    });
  });
});

