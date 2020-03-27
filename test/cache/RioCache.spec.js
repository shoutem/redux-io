import { assert } from 'chai';
import sinon from 'sinon';
import _ from 'lodash';
import uuid from 'uuid-random';
import RioCache from '../../src/cache/RioCache';
import {
  STATUS,
  createStatus,
} from '../../src/status';

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

const type1Id1Status = createStatus();
const type1Id2Status = createStatus();
const type1Id3Status = createStatus();
const type2Id1Status = createStatus();

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
  };
  normalizedData.type1.type1Id1[STATUS] = type1Id1Status;
  normalizedData.type1.type1Id2[STATUS] = type1Id2Status;
  normalizedData.type1.type1Id3[STATUS] = type1Id3Status;
  normalizedData['type2.test'].type2Id1[STATUS] = type2Id1Status;
  return normalizedData;
};

const getDenormalizedItems = () => {
  const type1Id1DenormalizedStatus = { ...type1Id1Status };
  const type1Id2DenormalizedStatus = { ...type1Id2Status };
  const type1Id3DenormalizedStatus = { ...type1Id3Status };
  const type2Id1DenormalizedStatus = { ...type2Id1Status };

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
      reference[STATUS] = { id: uuid() };

      cache.add(reference);

      assert.isOk(reference === cache.get(reference), 'did not cache valid reference');
    });
    it('doesn\'t cache non reference entity', () => {
      const cache = new RioCache();
      const reference = {};

      cache.add(reference);

      assert.isUndefined(cache.get(reference), 'returned something from cache');
    });
  });

  describe('isSingleRelationshipModified', () => {
    it('is modified', () => {
      const id = 1;
      const type = 'type';
      const reference = { id, type };
      reference[STATUS] = { modifiedTimestamp: 1 };
      const cachedReference = { ...reference };
      const nullReference = {};

      const cache = new RioCache(() => reference);
      cache.add();

      assert.isFalse(
          cache.isSingleRelationshipModified(nullReference, cachedReference),
          'is modified'
        );
        assert.isOk(
          cache.isSingleRelationshipModified(reference, nullReference),
          'not modified'
        );
        assert.isFalse(
          cache.isSingleRelationshipModified(reference, cachedReference),
          'is modified'
        );
      });
      it('is not modified', () => {
        const id = 1;
        const type = 'type';
        const reference = { id, type };
        reference[STATUS] = { modifiedTimestamp: 1 };
        const cachedReference = { ...reference };
        const nullReference = {};

        const cache = new RioCache(() => reference);
        cache.add();

        assert.isOk(
          cache.isSingleRelationshipModified(nullReference, nullReference),
          'not modified'
        );
        assert.isFalse(
          cache.isSingleRelationshipModified(reference, cachedReference),
          'is modified'
        );
      });
  });

  describe('getValidItem', () => {
    it('returns cached item', () => {
      const id = 1;
      const type = 'type';

      const reference = { id, type };
      reference[STATUS] = { modifiedTimestamp: 1 };

      const cache = new RioCache(() => reference);

      const denormalizedReference = { ...reference };
      denormalizedReference[STATUS] = { ...reference[STATUS] };

      cache.add(denormalizedReference);

      const cachedReference = cache.getValidItem({ id, type }, denormalizedReference);

      assert.isOk(denormalizedReference === cachedReference, 'didn\'t return valid reference');
    });

    it('returns cached item for item descriptor', () => {
      const id = 1;
      const type = 'type';

      const reference = { id, type };

      const cache = new RioCache(() => ({ id, type }));

      cache.add(reference);

      const cachedReference = cache.getValidItem({ id, type }, reference);

      assert.isOk(reference === cachedReference, 'didn\'t return valid reference');
    });

    it('doesn\'t return cached item when item changed', () => {
      const id = 1;
      const type = 'type';

      const reference = { id, type };
      reference[STATUS] = { modifiedTimestamp: 1 };

      const changedReference = { id, type };
      // simulate update - change modifiedTimestamp
      changedReference[STATUS] = { ...reference[STATUS], modifiedTimestamp: 2 };

      const denormalizedReference = {};
      denormalizedReference[STATUS] = { ...reference[STATUS] };

      const cache = new RioCache(() => changedReference);
      cache.add(denormalizedReference);

      assert.isNull(cache.getValidItem({ id, type }, denormalizedReference), 'returned some entity');
    });

    it('returns cached item when non rio object required even if changed', () => {
      const id = 1;
      const type = 'type';

      const reference = { id, type, attr: 1 };

      const cache = new RioCache(() => ({ id, type, attr: 2 }));

      cache.add(reference);

      const cachedReference = cache.getValidItem({ id, type }, reference);

      assert.isOk(reference === cachedReference, 'didn\'t return valid reference');
    });
  });

  describe('getValidOne', () => {
    it('returns cached one', () => {
      const id = 1;
      const type = 'type';

      const item = { id, type };
      item[STATUS] = { modifiedTimestamp: 1 };

      const one = {};
      one[STATUS] = { id: uuid(), modifiedTimestamp: 1 };

      const cache = new RioCache((descriptor) => descriptor.id ? item : one);

      const denormalizedOne = { ...item };
      denormalizedOne[STATUS] = { ...one[STATUS] };

      const denormalizedItem = { ...item };
      denormalizedItem[STATUS] = { ...item[STATUS] };

      cache.add(denormalizedOne);
      cache.add(denormalizedItem);

      const cachedDenormalizedOne = cache.getValidOne(one);

      assert.isOk(
        denormalizedOne === cachedDenormalizedOne
        , 'didn\'t return valid reference'
      );
    });

    it('doesn\'t return cached one when one changed' , () => {
      const id = 1;
      const type = 'type';

      const item = { id, type };
      item[STATUS] = { modifiedTimestamp: 1 };

      const one = {};
      one[STATUS] = { id: uuid(), modifiedTimestamp: 1 };
      const changedOne = {};
      changedOne[STATUS] = {...one[STATUS], modifiedTimestamp: 2};

      const cache = new RioCache((descriptor) => descriptor.id ? item : one);

      const denormalizedOne = { ...item };
      denormalizedOne[STATUS] = { ...one[STATUS] };

      const denormalizedItem = { ...item };
      denormalizedItem[STATUS] = { ...item[STATUS] };

      cache.add(denormalizedOne);
      cache.add(denormalizedItem);

      cache.flushModificationCache();

      assert.isOk(
        denormalizedOne !== cache.getValidOne(changedOne)
        , 'returned cached one'
      );
    });

    it('doesn\'t return cached one when item modified' , () => {
      const id = 1;
      const type = 'type';

      const item = { id, type };
      item[STATUS] = { modifiedTimestamp: 1 };
      const changedItem = {...item};
      changedItem[STATUS] = {...item[STATUS], modifiedTimestamp: 2};

      const one = {};
      one[STATUS] = { id: uuid(), modifiedTimestamp: 1 };

      const cache = new RioCache((descriptor) => descriptor.id ? changedItem : one);

      const denormalizedOne = { ...item };
      denormalizedOne[STATUS] = { ...one[STATUS] };

      const denormalizedItem = { ...item };
      denormalizedItem[STATUS] = { ...item[STATUS] };

      cache.add(denormalizedOne);
      cache.add(denormalizedItem);

      assert.isOk(
        denormalizedOne !== cache.getValidOne(one)
        , 'returned cached one'
      );
    });

    it('returns cached one with modification check', (done) => {
      const id = 1;
      const type = 'type';

      const item = { id, type };
      item[STATUS] = { modifiedTimestamp: 1 };

      const one = {};
      one[STATUS] = { id: uuid(), modifiedTimestamp: 1 };

      const cache = new RioCache((descriptor) => descriptor.id ? item : one, {
        useModificationCache: true,
      });

      const denormalizedOne = { ...item };
      denormalizedOne[STATUS] = { ...one[STATUS] };

      const denormalizedItem = { ...item };
      denormalizedItem[STATUS] = { ...item[STATUS] };

      cache.add(denormalizedOne);
      cache.add(denormalizedItem);

      // cache is time based
      setTimeout(() => {
        const cachedDenormalizedOne = cache.getValidOne(one);

        assert.isOk(
          denormalizedOne === cachedDenormalizedOne
          , 'didn\'t return valid reference'
        );

        const isChecked = sinon.spy(cache, "isChecked");
        const isOneModified = sinon.spy(cache, "isOneModified");

        const cachedDenormalizedOneWithActiveOne = cache.getValidOne(one);

        assert.isOk(
          cachedDenormalizedOneWithActiveOne === cachedDenormalizedOne
          , 'didn\'t return valid reference'
        );

        assert.isOk(isChecked.called, 'check not called');
        assert.isOk(isOneModified.notCalled, 'valid item called');
        assert.isOk(isChecked.returned(true), 'check returned false');
        done();
      }, 10);
    });

    it('doesn\'t return cached one when item modified with modification check' , (done) => {
      const id = 1;
      const type = 'type';

      const item = { id, type };
      item[STATUS] = { modifiedTimestamp: 1 };
      const changedItem = {...item};
      changedItem[STATUS] = {...item[STATUS], modifiedTimestamp: 2};

      const one = {};
      one[STATUS] = { id: uuid(), modifiedTimestamp: 1 };

      const cache = new RioCache((descriptor) => descriptor.id ? changedItem : one, {
        useModificationCache: true,
      });

      const denormalizedOne = { ...item };
      denormalizedOne[STATUS] = { ...one[STATUS] };

      const denormalizedItem = { ...item };
      denormalizedItem[STATUS] = { ...item[STATUS] };

      cache.add(denormalizedOne);
      cache.add(denormalizedItem);

      cache.invalidateModificationCache();

      // cache is time based
      setTimeout(() => {
        const isChecked = sinon.spy(cache, "isChecked");
        const isOneModified = sinon.spy(cache, "isOneModified");

        const cachedDenormalizedOne = cache.getValidOne(one);

        assert.isOk(
          denormalizedOne !== cachedDenormalizedOne
          , 'returned cached one'
        );

        assert.isOk(isChecked.called, 'check not called');
        assert.isOk(isOneModified.called, 'valid item not called');
        assert.isOk(isChecked.returned(false), 'check returned true');
        assert.isOk(isOneModified.returned(true), 'check returned true');

        done();
      }, 10);
    });

    it('modification check doesnt have timestamp so isChecked fails', () => {
      const id = 1;
      const type = 'type';

      const item = { id, type };
      item[STATUS] = { modifiedTimestamp: 1 };

      const one = {};
      one[STATUS] = { id: uuid(), modifiedTimestamp: 1 };

      const cache = new RioCache((descriptor) => descriptor.id ? item : one, {
        useModificationCache: true,
      });

      const isChecked = sinon.spy(cache, "isChecked");
      const isOneCacheValid = sinon.spy(cache, "isOneCacheValid");

      const cachedDenormalizedOne = cache.getValidOne(one);

      assert.isOk(isChecked.called, 'check not called');
      assert.isOk(isOneCacheValid.called, 'valid item not called');
      assert.isOk(isChecked.returned(false), 'check returned true');
    });
  });

  describe('getValidCollection', () => {
    it('returns cached collection', () => {
      const id = 1;
      const schema = 'type';
      const type = schema;

      const item = { id, type };
      item[STATUS] = { id: uuid(), modifiedTimestamp: 1 };

      const collection = [1];
      collection[STATUS] = { schema, id: uuid(), modifiedTimestamp: 1 };

      const cache = new RioCache(() => item);
      cache.add(item);

      const denormalizedReference = [{
        id,
        type,
        [STATUS]: item[STATUS],
      }];
      denormalizedReference[STATUS] = { ...collection[STATUS] };

      cache.add(denormalizedReference);

      const descriptorCollection = [{ id, type }];
      descriptorCollection[STATUS] = { ...collection[STATUS] };

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
      item[STATUS] = { id: uuid(), modifiedTimestamp: 1 };

      const collection = [1];
      collection[STATUS] = { schema, id: uuid(), modifiedTimestamp: 1 };

      const cache = new RioCache(() => item);
      cache.add(item);

      const denormalizedReference = [{ id, type }];
      denormalizedReference[STATUS] = { ...collection[STATUS] };

      cache.add(denormalizedReference);

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
      item[STATUS] = { id: uuid(), modifiedTimestamp: 1 };

      const reference = [1];
      reference[STATUS] = { schema, id: uuid(), modifiedTimestamp: 1 };

      const changedItem = { id, type };
      // simulate item update - change modifiedTimestamp
      changedItem[STATUS] = { ...item[STATUS], modifiedTimestamp: 2 };

      const cache = new RioCache(() => changedItem);
      cache.add(item);

      const denormalizedReference = [{ id, type }];
      denormalizedReference[STATUS] = { ...reference[STATUS] };

      cache.add(denormalizedReference);

      const descriptorCollection = [{ id, type }];
      descriptorCollection[STATUS] = { ...reference[STATUS] };

      assert.isUndefined(
        cache.getValidCollection(descriptorCollection),
        'didn\'t return valid reference'
      );
    });

    it('returns cached collection with modifiation check', (done) => {
      const id = 1;
      const schema = 'type';
      const type = schema;

      const item = { id, type };
      item[STATUS] = { id: uuid(), modifiedTimestamp: 1 };

      const collection = [1];
      collection[STATUS] = { schema, id: uuid(), modifiedTimestamp: 1 };

      const cache = new RioCache(
        () => item,
        { useModificationCache: true }
      );

      cache.add(item);

      const denormalizedReference = [{
        id,
        type,
        [STATUS]: item[STATUS],
      }];
      denormalizedReference[STATUS] = { ...collection[STATUS] };

      cache.add(denormalizedReference);

      const descriptorCollection = [{ id, type }];
      descriptorCollection[STATUS] = { ...collection[STATUS] };

      // cache is time based
      setTimeout(() => {
        const denormalizedCollection = cache.getValidCollection(descriptorCollection);

        assert.isOk(
          denormalizedReference === denormalizedCollection,
          'didn\'t return valid reference'
        );

        const isChecked = sinon.spy(cache, "isChecked");
        const isCollectionCacheValid = sinon.spy(cache, "isCollectionCacheValid");

        const denormalizedCollectionWithCheck = cache.getValidCollection(descriptorCollection);

        assert.isOk(isChecked.called, 'check not called');
        assert.isOk(isCollectionCacheValid.notCalled, 'valid collection cache called');
        assert.isOk(isChecked.returned(true), 'check returned false');
      done();
      }, 10);
    });
  });

  describe('areCollectionItemsChanged', () => {
    it('confirms that collection is cached', () => {
      const normalizedData = new NormalizedData(getNormalizedData());
      const cache = new RioCache(normalizedData.getNormalizedItem);
      const denormalizedItems = getDenormalizedItems();

      const item1 = denormalizedItems[0];
      const item2 = denormalizedItems[1];

      denormalizedItems.forEach((item) => {
        cache.add(item);
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
        cache.add(item);
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
        cache.add(item);
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
        cache.add(item);
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
        cache.add(item);
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
    it('confirms that cached relationships are valid', () => {
      const normalizedData = new NormalizedData(getNormalizedData());
      const cache = new RioCache(normalizedData.getNormalizedItem);
      const denormalizedItems = getDenormalizedItems();

      denormalizedItems.forEach((item) => {
        cache.add(item);
      });

      const cachedItem = cache.get({ id: 'type1Id1',
      type: 'type1'});

      const normalizedItemType1Id1 = normalizedData.getNormalizedItem({
        id: 'type1Id1',
        type: 'type1'
      });

      assert.isOk(
        cache.areCachedItemRelationshipsValid(normalizedItemType1Id1, cachedItem),
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
          cache.add(item);
        });

        const cachedItem = cache.get({id, type});

        const normalizedItemType1Id1 = normalizedData.getNormalizedItem({ id, type });
        const normalizedItemType2Id1 = normalizedData.getNormalizedItem({ id: id2, type: type2 });

        const changedItem = { id: id2, type: type2 };
        changedItem[STATUS] = { ...normalizedItemType2Id1[STATUS], modifiedTimestamp: Date.now() };
        normalizedData.updateItem(changedItem);

        assert.isNotOk(
          cache.areCachedItemRelationshipsValid(normalizedItemType1Id1, cachedItem),
          'item relationships marked as valid (cached)'
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
          cache.add(item);
        });

        const cachedItem = cache.get({id, type});

        const normalizedItemType1Id1 = normalizedData.getNormalizedItem({ id, type });
        const normalizedItemType1Id3 = normalizedData.getNormalizedItem({ id: id3, type });

        const changedItem = { id: id3, type };
        changedItem[STATUS] = { ...normalizedItemType1Id3[STATUS], modifiedTimestamp: Date.now() };
        normalizedData.updateItem(changedItem);

        assert.isNotOk(
          cache.areCachedItemRelationshipsValid(normalizedItemType1Id1, cachedItem),
          'item relationships marked as valid (cached)'
        );
      });
    });
  });
});
