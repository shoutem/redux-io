import _ from 'lodash';
import { MAX_DEPTH_LIMIT } from '@shoutem/json-api-denormalizer';
import { getModificationTime, getId } from '../status';

function isItemInCollection(collection, item) {
  return collection.find(collectionItem => collectionItem.id === item.id);
}

function isSingleRelation(relationshipData) {
  return _.isPlainObject(relationshipData) || relationshipData === null;
}

function isCollection(entity) {
  return _.isArray(entity);
}

function isKeyValid(key) {
  return _.isNumber(key) || _.isString(key);
}


function getUniqueKey(item) {
  return _.isPlainObject(item) && isKeyValid(item.id) && isKeyValid(item.type) ?
    `${item.type}.${item.id}` :
    undefined;
}

/**
 * RIO one and collection have their own unique id in status, items do not.
 * We create unique key for item based on item id and type.
 *
 * @param reference
 * @returns {*}
 */
export function getReferenceUniqueKey(reference) {
  return getId(reference) || getUniqueKey(reference);
}

/**
 * Compare cached entity modification time with current.
 * It is not expected to require older version of references then current in the state,
 * thus if modification time is not strictly equal it is considered different.
 * This is preliminary change to get cache work as it will with reference comparator.
 *
 * @param cachedModificationTime
 * @param currentModificationTime
 * @returns {boolean}
 */
function isCacheValid(cachedModificationTime, currentModificationTime) {
  return cachedModificationTime === currentModificationTime;
}

/**
 * Compare references modification time to see if current reference is newer then cache.
 * Reference is considered changed when not strictly equal. If both references are not RIO they are
 * considered unchanged, this are most often descriptors. Use RIO cache only with RIO references.
 * @param reference
 * @param cachedReference
 * @returns {boolean}
 */
export function isReferenceChanged(reference, cachedReference) {
  const cachedReferenceModificationTime = getModificationTime(cachedReference);
  const currentReferenceModificationTime = getModificationTime(reference);

  if (!cachedReferenceModificationTime && !currentReferenceModificationTime) {
    const descriptor = getReferenceUniqueKey(reference);
    const cacheDescriptor = getReferenceUniqueKey(cachedReference);
    return descriptor !== cacheDescriptor;
  }

  return !isCacheValid(cachedReferenceModificationTime, currentReferenceModificationTime);
}

/**
 * Cache Redux input output data by 'type' and 'id'.
 * Provides methods to validate, get and resolve new data with cached data.
 */
export default class RioCache {
  constructor(getNormalizedItem, options = {}) {
    this.cache = {};
    this.traversedKeys = new Set();
    this.modificationCache = new Set();
    this.lastModificationTimestamp = new Date().getTime();
    // It is expected to return descriptor for items that can't be found.
    this.getNormalizedItem = getNormalizedItem;

    this.options = {
      useModificationCache: false,
      defaultMaxDepth: MAX_DEPTH_LIMIT,
      ...options,
    };
  }

  getReferenceUniqueKey(reference, maxDepth = -1) {
    const uniqueKey = getReferenceUniqueKey(reference);
    if (!uniqueKey) {
      return undefined;
    }

    const resolvedMaxDepth = maxDepth < 0 ? this.options.defaultMaxDepth : maxDepth;
    return `d${resolvedMaxDepth}:${uniqueKey}`;
  }

  setDefaultMaxDepth(defaultMaxDepth) {
    this.options.defaultMaxDepth = defaultMaxDepth;
    this.flush();
  }

  invalidateModificationCache(timestamp = new Date().getTime()) {
    this.lastModificationTimestamp = timestamp;
  }

  flushModificationCache() {
    this.modificationCache = new Set();
    this.invalidateModificationCache();
  }

  flush() {
    this.cache = {};
    this.traversedKeys = new Set();
    this.flushModificationCache();
  }

  delete(reference, maxDepth) {
    const referenceKey = this.getReferenceUniqueKey(reference, maxDepth);

    delete this.cache[referenceKey];
    delete this.modificationCache[referenceKey];
  }

  get(reference, maxDepth = this.defaultMaxDepth) {
    return this.cache[this.getReferenceUniqueKey(reference, maxDepth)];
  }

  add(reference, maxDepth) {
    const referenceKey = this.getReferenceUniqueKey(reference, maxDepth);

    if (!isKeyValid(referenceKey)) {
      // If provided entity is not RIO reference, it can not be cached
      return reference;
    }

    this.cache[referenceKey] = reference;
    this.addChecked(reference, maxDepth);

    return this.get(reference, maxDepth);
  }

  isChecked(reference, maxDepth) {
    if (!this.options.useModificationCache) {
      return false;
    }

    const referenceCheckedTimestamp = this.modificationCache[
      this.getReferenceUniqueKey(reference, maxDepth)
    ];

    if (!referenceCheckedTimestamp) {
      return false;
    }

    return referenceCheckedTimestamp > this.lastModificationTimestamp;
  }

  addChecked(reference, maxDepth) {
    const uniqueKey = this.getReferenceUniqueKey(reference, maxDepth);
    this.modificationCache[uniqueKey] = new Date().getTime();
  }

  getValidItem(itemDescriptor, cachedItem = null, maxDepth) {
    const normalizedItem = this.getNormalizedItem(itemDescriptor);

    if (!normalizedItem) {
      this.delete(normalizedItem, maxDepth);
      return null;
    }

    const uniqueKey = getReferenceUniqueKey(itemDescriptor);

    if (this.traversedKeys.has(uniqueKey)) {
      return itemDescriptor;
    }

    const resolvedMaxDepth = maxDepth || this.options.defaultMaxDepth;
    if (_.size(this.traversedKeys) >= resolvedMaxDepth) {
      return itemDescriptor;
    }

    this.traversedKeys.add(uniqueKey);

    if (!this.isItemCacheValid(normalizedItem, cachedItem, maxDepth)) {
      this.delete(normalizedItem, maxDepth);
      this.traversedKeys.delete(uniqueKey);
      return null;
    }

    this.traversedKeys.delete(uniqueKey);

    return cachedItem;
  }

  /**
   * Get one reference from cache if valid
   * @param one - RIO one reference
   * @returns {*}
   */
  // eslint-disable-next-line consistent-return
  getValidOne(one, maxDepth) {
    const cachedOne = this.get(one, maxDepth);

    if (this.isChecked(one, maxDepth)) {
      return cachedOne;
    }

    if (this.isOneCacheValid(one, cachedOne, maxDepth)) {
      return cachedOne;
    }
    // Delete invalid cache
    this.delete(one, maxDepth);
  }

  // eslint-disable-next-line consistent-return
  getValidCollection(descriptorCollection, maxDepth) {
    const cachedCollection = this.get(descriptorCollection, maxDepth);
    if (this.isChecked(descriptorCollection, maxDepth)) {
      return cachedCollection;
    }

    if (this.isCollectionCacheValid(descriptorCollection, cachedCollection, maxDepth)) {
      return cachedCollection;
    }
    // Delete invalid cache
    this.delete(descriptorCollection, maxDepth);
  }

  isItemCacheValid(normalizedItem, cachedItem, maxDepth) {
    return (
      !this.isItemModified(normalizedItem, cachedItem) &&
      this.areCachedItemRelationshipsValid(normalizedItem, cachedItem, maxDepth)
    );
  }

  isOneCacheValid(one, cachedOne, maxDepth) {
    if (!cachedOne) {
      return false;
    }

    const isValid = !this.isOneModified(one, cachedOne, maxDepth);
    if (isValid) {
      this.addChecked(one, maxDepth);
    }

    return isValid;
  }

  isCollectionCacheValid(collection, cachedCollection, maxDepth) {
    const isValid = (
      !this.isCollectionModified(collection, cachedCollection) &&
      !this.areCollectionItemsChanged(collection, cachedCollection, maxDepth)
    );

    if (isValid) {
      this.addChecked(collection, maxDepth);
    }

    return isValid;
  }

  isItemModified(normalizedItem, cachedItem) {
    return !cachedItem || isReferenceChanged(normalizedItem, cachedItem);
  }

  isOneModified(one, cachedOne, maxDepth) {
    // Get real item to which One "points"
    const cachedReference = { id: cachedOne.id, type: cachedOne.type };
    const cachedItem = this.get(cachedReference);
    const oneItem = this.getNormalizedItem(cachedReference);

    return (
      isReferenceChanged(one, cachedOne) ||
      !this.isItemCacheValid(oneItem, cachedItem, maxDepth)
    );
  }

  isCollectionModified(collection, cachedCollection) {
    return !cachedCollection || isReferenceChanged(collection, cachedCollection);
  }

  /**
   * @param relationship
   * @param cachedRelationship
   * @returns {boolean}
   */
  isSingleRelationshipModified(relationship, cachedRelationship, maxDepth) {
    if (!relationship) {
      return relationship !== cachedRelationship;
    }

    const relationshipItem = this.getValidItem(relationship, cachedRelationship, maxDepth);
    return !relationshipItem || relationshipItem !== cachedRelationship;
  }

  /**
   * Takes collection of item descriptors and check if cached collection items match current items
   *
   *
   * @param descriptorCollection
   * @param cachedCollection
   * @returns {boolean}
   */
  areCollectionItemsChanged(descriptorCollection, cachedCollection = [], maxDepth) {
    let matchedRelationshipsItems = 0;

    const relationshipChanged = _.some(descriptorCollection, (item, index) => {
      const cachedItem = _.get(cachedCollection, [index]);

      if (
        !isItemInCollection(cachedCollection, item, cachedItem) ||
        !this.getValidItem(item, cachedItem, maxDepth)
      ) {
        return true;
      }

      matchedRelationshipsItems += 1;
      return false;
    });

    return relationshipChanged || cachedCollection.length !== matchedRelationshipsItems;
  }

  areCachedItemRelationshipsValid(normalizedItem, cachedItem, maxDepth) {
    const relationshipsNames = Object.keys(normalizedItem.relationships || {});

    // TODO - can relationship be removed so there is no property at all?
    // if so, new and old relationship keys must match to be valid!
    return !_.some(
      relationshipsNames,
      relationshipName => (
        this.isRelationshipChanged(normalizedItem, relationshipName, cachedItem, maxDepth)
      )
    );
  }

  isRelationshipChanged(normalizedItem, relationshipName, cachedItem, maxDepth) {
    const relationship = normalizedItem.relationships[relationshipName].data;
    const cachedRelationship = cachedItem[relationshipName];

    if (isSingleRelation(relationship)) {
      return this.isSingleRelationshipModified(relationship, cachedRelationship, maxDepth);
    } else if (isCollection(relationship)) {
      return this.areCollectionItemsChanged(relationship, cachedRelationship, maxDepth);
    }
    throw Error('Unknown relationship format!');
  }
}
