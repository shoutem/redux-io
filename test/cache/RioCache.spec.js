import { assert } from 'chai';
import RioCache from '../../src/cache/RioCache';
import {
  STATUS,
  createStatus,
} from '../../src/status';
import _ from 'lodash';

function spread(obj) {
  return {
    ...obj,
  }
}

class NormalizedData {
  constructor(normalizedData) {
    this.normalizedData = normalizedData;
    this.getNormalizedItem = this.getNormalizedItem.bind(this);
  }

  updateItem(item) {
    this.normalizedData[item.type][item.id] = item;
  }

  getNormalizedItem(dataDescriptor) {
    return _.get(this.normalizedData, [dataDescriptor.type, dataDescriptor.id]);
  }
}

const type1Id1Status = createStatus({ id: _.uniqueId() });
const type1Id2Status = createStatus({ id: _.uniqueId() });
const type1Id3Status = createStatus({ id: _.uniqueId() });
const type2Id1Status = createStatus({ id: _.uniqueId() });

const getNormalizedData = () => {
  const normalizedData = {
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
              { id: 'type1Id2', type: 'type1' },
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
        attributes: { name: 'type1Id2' },
        relationships: {
          type1: {
            data: [
              { id: 'type1Id3', type: 'type1' },
            ],
          },
        },
      },
      type1Id3: {
        id: 'type1Id3',
        type: 'type1',
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
  };
  normalizedData.type1.type1Id1[STATUS] = type1Id1Status;
  normalizedData.type1.type1Id2[STATUS] = type1Id2Status;
  normalizedData.type1.type1Id3[STATUS] = type1Id3Status;
  normalizedData['type2.test'].type2Id1[STATUS] = type2Id1Status;
  return normalizedData;
};

const getDenormalizedItems = () => {
  const type1Id1DenormalizedStatus = spread(type1Id1Status);
  const type1Id2DenormalizedStatus = spread(type1Id2Status);
  const type1Id3DenormalizedStatus = spread(type1Id3Status);
  const type2Id1DenormalizedStatus = spread(type2Id1Status);

  const type2Id1 = {
    id: 'type2Id1',
    type: 'type2.test',
    name: 'type2Id1',
    [STATUS]: type2Id1DenormalizedStatus,
  };
  const type1Id3 = {
    id: 'type1Id3',
    type: 'type1',
    [STATUS]: type1Id3DenormalizedStatus
  };
  const type1Id2 = {
    id: 'type1Id2',
    type: 'type1',
    name: 'type1Id2',
    type1: [type1Id3],
    [STATUS]: type1Id2DenormalizedStatus,
  };
  const type1Id1 = {
    id: 'type1Id1',
    type: 'type1',
    name: 'type1Id1',
    type1: [
      type1Id2,
    ],
    'type2.test': type2Id1,
    [STATUS]: type1Id1DenormalizedStatus,
  };
  return [type1Id1, type1Id2, type1Id3, type2Id1];
};

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

      assert.isOk(denormalizedReference === cache.getValidItem({
          id,
          type
        }), 'didn\'t return valid reference');
    });
    it('doesn\'t return cached item when item changed', () => {
      const id = 1;
      const type = 'type';

      const reference = { id, type };
      reference[STATUS] = { id: _.uniqueId(), modifiedTimestamp: 1 };

      const changedReference = { id, type };
      // simulate update - change modifiedTimestamp
      changedReference[STATUS] = { ...reference[STATUS], modifiedTimestamp: 2 };

      const denormalizedReference = {};
      denormalizedReference[STATUS] = spread(reference[STATUS]);

      const cache = new RioCache(() => changedReference);
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
      item[STATUS] = { id: _.uniqueId(), modifiedTimestamp: 1 };

      const collection = [1];
      collection[STATUS] = { schema, id: _.uniqueId(), modifiedTimestamp: 1 };

      const cache = new RioCache(() => item);
      cache.cacheItem(item);

      const denormalizedReference = [{ id, type }];
      denormalizedReference[STATUS] = spread(collection[STATUS]);

      cache.cacheReference(denormalizedReference);

      const descriptorCollection = [{ id, type }];
      descriptorCollection[STATUS] = spread(collection[STATUS]);

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
      item[STATUS] = { id: _.uniqueId(), modifiedTimestamp: 1 };

      const collection = [1];
      collection[STATUS] = { schema, id: _.uniqueId(), modifiedTimestamp: 1 };

      const cache = new RioCache(() => item);
      cache.cacheItem(item);

      const denormalizedReference = [{ id, type }];
      denormalizedReference[STATUS] = spread(collection[STATUS]);

      cache.cacheReference(denormalizedReference);

      const descriptorCollection = [{ id, type }];
      // simulate collection update - change modifiedTimestamp
      descriptorCollection[STATUS] = { ...collection[STATUS], modifiedTimestamp: 2 };

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
      item[STATUS] = { id: _.uniqueId(), modifiedTimestamp: 1 };

      const reference = [1];
      reference[STATUS] = { schema, id: _.uniqueId(), modifiedTimestamp: 1 };

      const changedItem = { id, type };
      // simulate item update - change modifiedTimestamp
      changedItem[STATUS] = { ...item[STATUS], modifiedTimestamp: 2 };

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
  describe('areCollectionItemsChanged', () => {
    it('confirms that collection is unchanged', () => {
      const normalizedData = new NormalizedData(getNormalizedData());
      const cache = new RioCache(normalizedData.getNormalizedItem);
      const denormalizedItems = getDenormalizedItems();

      const item1 = denormalizedItems[0];
      const item2 = denormalizedItems[1];

      denormalizedItems.forEach((item) => {
        cache.cacheItem(item);
      });

      const collection = [{ id: item1.id, type: item1.type }, { id: item2.id, type: item2.type }];
      collection[STATUS] = { schema: item1.type }; // both items must be same type!

      const cachedCollection = [item1, item2];

      assert.isNotOk(
        cache.areCollectionItemsChanged(collection, cachedCollection),
        'indicates that collection items are changed'
      );
    });
    it('confirms that collection is changed if collection item is changed', () => {
      const type = 'type1';
      const id3 = 'type1Id3';

      const normalizedData = new NormalizedData(getNormalizedData());
      const cache = new RioCache(normalizedData.getNormalizedItem);
      const denormalizedItems = getDenormalizedItems();

      const item1 = denormalizedItems[0];
      const item2 = denormalizedItems[1];

      denormalizedItems.forEach((item) => {
        cache.cacheItem(item);
      });

      const collection = [{ id: item1.id, type: item1.type }, { id: item2.id, type: item2.type }];
      collection[STATUS] = { schema: item1.type }; // both items must be same type!

      const cachedCollection = [item1, item2];

      const normalizedItemType1Id3 = normalizedData.getNormalizedItem({ id: id3, type });

      const changedItem = { id: id3, type };
      changedItem[STATUS] = { ...normalizedItemType1Id3[STATUS], modifiedTimestamp: Date.now() };
      normalizedData.updateItem(changedItem);

      assert.isOk(
        cache.areCollectionItemsChanged(collection, cachedCollection),
        'indicates that collection items are not changed'
      );
    });
    it('confirms that collection is changed if collection get new item', () => {
      const normalizedData = new NormalizedData(getNormalizedData());
      const cache = new RioCache(normalizedData.getNormalizedItem);
      const denormalizedItems = getDenormalizedItems();

      const item1 = denormalizedItems[0];
      const item2 = denormalizedItems[1];
      const item3 = denormalizedItems[2];

      denormalizedItems.forEach((item) => {
        cache.cacheItem(item);
      });

      const collection = [{ id: item1.id, type: item1.type }, { id: item2.id, type: item2.type }];
      collection[STATUS] = { schema: item1.type }; // both items must be same type!

      const cachedCollection = [item1, item2, item3];

      assert.isOk(
        cache.areCollectionItemsChanged(collection, cachedCollection),
        'indicates that collection items are not changed'
      );
    });
    it('confirms that collection is changed if collection loose item', () => {
      const normalizedData = new NormalizedData(getNormalizedData());
      const cache = new RioCache(normalizedData.getNormalizedItem);
      const denormalizedItems = getDenormalizedItems();

      const item1 = denormalizedItems[0];
      const item2 = denormalizedItems[1];
      const item3 = denormalizedItems[2];

      denormalizedItems.forEach((item) => {
        cache.cacheItem(item);
      });

      const collection = [{ id: item1.id, type: item1.type }, { id: item2.id, type: item2.type }];
      collection[STATUS] = { schema: item1.type }; // both items must be same type!

      const cachedCollection = [item1];

      assert.isOk(
        cache.areCollectionItemsChanged(collection, cachedCollection),
        'indicates that collection items are not changed'
      );
    });
    it('confirms that collection is changed if collection replace item', () => {
      const normalizedData = new NormalizedData(getNormalizedData());
      const cache = new RioCache(normalizedData.getNormalizedItem);
      const denormalizedItems = getDenormalizedItems();

      const item1 = denormalizedItems[0];
      const item2 = denormalizedItems[1];
      const item3 = denormalizedItems[2];

      denormalizedItems.forEach((item) => {
        cache.cacheItem(item);
      });

      const collection = [{ id: item1.id, type: item1.type }, { id: item2.id, type: item2.type }];
      collection[STATUS] = { schema: item1.type }; // both items must be same type!

      const cachedCollection = [item1, item3];

      assert.isOk(
        cache.areCollectionItemsChanged(collection, cachedCollection),
        'indicates that collection items are not changed'
      );
    });
  });
  describe('areItemRelationshipsValid', () => {
    it('confirms that unchanged relationships are valid', () => {
      const normalizedData = new NormalizedData(getNormalizedData());
      const cache = new RioCache(normalizedData.getNormalizedItem);
      const denormalizedItems = getDenormalizedItems();

      denormalizedItems.forEach((item) => {
        cache.cacheItem(item);
      });

      const normalizedItemType1Id1 = normalizedData.getNormalizedItem({
        id: 'type1Id1',
        type: 'type1'
      });

      assert.isOk(
        cache.areCachedItemRelationshipsValid(normalizedItemType1Id1),
        'item relationships marked as invalid (changed)'
      );
    });
    describe('single relationship change', () => {
      it('confirms that changed relationships aren\'t valid', () => {
        const id = 'type1Id1';
        const type = 'type1';
        const id2 = 'type2Id1';
        const type2 = 'type2.test';

        const normalizedData = new NormalizedData(getNormalizedData());
        const cache = new RioCache(normalizedData.getNormalizedItem);
        const denormalizedItems = getDenormalizedItems();

        denormalizedItems.forEach((item) => {
          cache.cacheItem(item);
        });

        const normalizedItemType1Id1 = normalizedData.getNormalizedItem({ id, type });
        const normalizedItemType2Id1 = normalizedData.getNormalizedItem({ id: id2, type: type2 });

        const changedItem = { id: id2, type: type2 };
        changedItem[STATUS] = { ...normalizedItemType2Id1[STATUS], modifiedTimestamp: Date.now() };
        normalizedData.updateItem(changedItem);

        assert.isNotOk(
          cache.areCachedItemRelationshipsValid(normalizedItemType1Id1),
          'item relationships marked as valid (unchanged)'
        );
      });
    });
    describe('collection relationship change', () => {
      it('confirms that changed relationships aren\'t valid', () => {
        const id = 'type1Id1';
        const id3 = 'type1Id3';
        const type = 'type1';

        const normalizedData = new NormalizedData(getNormalizedData());
        const cache = new RioCache(normalizedData.getNormalizedItem);
        const denormalizedItems = getDenormalizedItems();

        denormalizedItems.forEach((item) => {
          cache.cacheItem(item);
        });

        const normalizedItemType1Id1 = normalizedData.getNormalizedItem({ id, type });
        const normalizedItemType1Id3 = normalizedData.getNormalizedItem({ id: id3, type });

        const changedItem = { id: id3, type };
        changedItem[STATUS] = { ...normalizedItemType1Id3[STATUS], modifiedTimestamp: Date.now() };
        normalizedData.updateItem(changedItem);

        assert.isNotOk(
          cache.areCachedItemRelationshipsValid(normalizedItemType1Id1),
          'item relationships marked as valid (unchanged)'
        );
      });
    });
  });
});
