import { getModificationTime, getId } from '../status';
import _ from 'lodash';

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
    this.lastChecked = new Set();
    this.lastChange = new Date().getTime();
    // It is expected to return descriptor for items that can't be found.
    this.getNormalizedItem = getNormalizedItem;

    this.options = {
      useLastCheckedCache: false,
      ...options,
    };
  }

  setLastChanged(timestamp = new Date().getTime()) {
    this.lastChange = timestamp;
  }

  flushLastChecked() {
    this.lastChecked = new Set();
    this.setLastChanged();
  }

  flush() {
    this.cache = {};
    this.traversedKeys = new Set();
    this.flushLastChecked();
  }

  delete(reference) {
    const referenceKey = getReferenceUniqueKey(reference);

    delete this.cache[referenceKey];
    delete this.lastChecked[referenceKey];
  }

  get(reference) {
    return this.cache[getReferenceUniqueKey(reference)];
  }

  add(reference) {
    const referenceKey = getReferenceUniqueKey(reference);

    if (!isKeyValid(referenceKey)) {
      // If provided entity is not RIO reference, it can not be cached
      return reference;
    }

    this.cache[referenceKey] = reference;
    this.addLastChecked(reference);

    return this.get(reference);
  }

  isAlreadyChecked(reference) {
    if (!this.options.useLastCheckedCache) {
      return false;
    }

    const referenceLastChecked = this.lastChecked[getReferenceUniqueKey(reference)];

    if (!referenceLastChecked) {
      return false;
    }

    return referenceLastChecked > this.lastChange;
  }

  addLastChecked(reference) {
    this.lastChecked[getReferenceUniqueKey(reference)] = new Date().getTime();
  }

  getValidItem(itemDescriptor, cachedItem = null) {
    const normalizedItem = this.getNormalizedItem(itemDescriptor);

    if (!normalizedItem) {
      this.delete(normalizedItem);
      return null;
    }

    const uniqueKey = getReferenceUniqueKey(itemDescriptor);

    if (this.traversedKeys.has(uniqueKey)) {
      return itemDescriptor;
    }

    this.traversedKeys.add(uniqueKey);

    if (!this.isItemCacheValid(normalizedItem, cachedItem)) {
      this.delete(normalizedItem);
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
  getValidOne(one) {
    const cachedOne = this.get(one);

    if (this.isAlreadyChecked(one)) {
      return cachedOne;
    }

    if (this.isOneCacheValid(one, cachedOne)) {
      return cachedOne;
    }
    // Delete invalid cache
    this.delete(one);
  }

  // eslint-disable-next-line consistent-return
  getValidCollection(descriptorCollection) {
    const cachedCollection = this.get(descriptorCollection);
    if (this.isAlreadyChecked(descriptorCollection)) {
      return cachedCollection;
    }

    if (this.isCollectionCacheValid(descriptorCollection, cachedCollection)) {
      return cachedCollection;
    }
    // Delete invalid cache
    this.delete(descriptorCollection);
  }

  isItemCacheValid(normalizedItem, cachedItem) {
    return (
      !this.isItemModified(normalizedItem, cachedItem) &&
      this.areCachedItemRelationshipsValid(normalizedItem, cachedItem)
    );
  }

  isOneCacheValid(one, cachedOne) {
    if (!cachedOne) {
      return false;
    }

    const isValid = !this.isOneModified(one, cachedOne);
    if (isValid) {
      this.addLastChecked(one);
    }

    return isValid;
  }

  isCollectionCacheValid(collection, cachedCollection) {
    const isValid = (
      !this.isCollectionModified(collection, cachedCollection) &&
      !this.areCollectionItemsChanged(collection, cachedCollection)
    );

    if (isValid) {
      this.addLastChecked(collection);
    }

    return isValid;
  }

  isItemModified(normalizedItem, cachedItem) {
    return !cachedItem || isReferenceChanged(normalizedItem, cachedItem);
  }

  isOneModified(one, cachedOne) {
    // Get real item to which One "points"
    const cachedReference = { id: cachedOne.id, type: cachedOne.type };
    const cachedItem = this.get(cachedReference);
    const oneItem = this.getNormalizedItem(cachedReference);

    return (
      isReferenceChanged(one, cachedOne) ||
      !this.isItemCacheValid(oneItem, cachedItem)
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
  isSingleRelationshipModified(relationship, cachedRelationship) {
    if (!relationship) {
      return relationship !== cachedRelationship;
    }

    const relationshipItem = this.getValidItem(relationship, cachedRelationship);
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
  areCollectionItemsChanged(descriptorCollection, cachedCollection = []) {
    let matchedRelationshipsItems = 0;

    const relationshipChanged = _.some(descriptorCollection, (item, index) => {
      const cachedItem = _.get(cachedCollection, [index]);

      if (
        !isItemInCollection(cachedCollection, item, cachedItem) ||
        !this.getValidItem(item, cachedItem)
      ) {
        return true;
      }

      matchedRelationshipsItems += 1;
      return false;
    });

    return relationshipChanged || cachedCollection.length !== matchedRelationshipsItems;
  }

  areCachedItemRelationshipsValid(normalizedItem, cachedItem) {
    const relationshipsNames = Object.keys(normalizedItem.relationships || {});

    // TODO - can relationship be removed so there is no property at all?
    // if so, new and old relationship keys must match to be valid!
    return !_.some(
      relationshipsNames,
      relationshipName => (
        this.isRelationshipChanged(normalizedItem, relationshipName, cachedItem)
      )
    );
  }

  isRelationshipChanged(normalizedItem, relationshipName, cachedItem) {
    const relationship = normalizedItem.relationships[relationshipName].data;
    const cachedRelationship = cachedItem[relationshipName];

    if (isSingleRelation(relationship)) {
      return this.isSingleRelationshipModified(relationship, cachedRelationship);
    } else if (isCollection(relationship)) {
      return this.areCollectionItemsChanged(relationship, cachedRelationship);
    }
    throw Error('Unknown relationship format!');
  }
}
