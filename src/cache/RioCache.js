import { getModificationTime, getId, getStatus } from '../status';
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

/**
 * Compare cached entity modification time with current.
 * If any argument is not provided, cache will be considered invalid.
 *
 * @param cachedModificationTime
 * @param currentModificationTime
 * @returns {boolean}
 */
function isCacheValid(cachedModificationTime, currentModificationTime) {
  return cachedModificationTime >= currentModificationTime;
}

/**
 * Compare references modification time to see if current reference is newer then cache.
 * If any argument is not RIO reference, function will mark reference as changed.
 * @param reference
 * @param cachedReference
 * @returns {boolean}
 */
export function isReferenceChanged(reference, cachedReference) {
  const cachedReferenceModificationTime = getModificationTime(cachedReference);
  const currentReferenceModificationTime = getModificationTime(reference);

  return !isCacheValid(cachedReferenceModificationTime, currentReferenceModificationTime);
}

function isReference(reference) {
  return !!getStatus(reference);
}

function getUniqueKey(item) {
  return _.isPlainObject(item) && item.id && item.type ? `${item.type}.${item.id}` : undefined;
}

/**
 * RIO one and collection have their own unique id in status, items do not.
 * We create unique key for item based on item id and type.
 *
 * @param reference
 * @returns {*}
 */
function getReferenceUniqueKey(reference) {
  return getId(reference) || getUniqueKey(reference);
}

/**
 * Cache Redux input output data by 'type' and 'id'.
 * Provides methods to validate, get and resolve new data with cached data.
 */
export default class RioCache {
  constructor(getNormalizedItem) {
    this.cache = {};
    this.getNormalizedItem = getNormalizedItem;
  }

  flush() {
    this.cache = {};
  }

  delete(reference) {
    delete this.cache[getReferenceUniqueKey(reference)];
  }

  get(reference) {
    return this.cache[getReferenceUniqueKey(reference)];
  }

  add(reference) {
    const referenceKey = getReferenceUniqueKey(reference);
    if (!referenceKey) {
      // If provided entity is not RIO reference, it can not be cached
      return reference;
    }
    this.cache[referenceKey] = reference;
    return this.get(reference);
  }

  // eslint-disable-next-line consistent-return
  getValidItem(itemDescriptor) {
    const normalizedItem = this.getNormalizedItem(itemDescriptor);
    if (normalizedItem && this.isItemCacheValid(normalizedItem)) {
      return this.get(normalizedItem);
    }
    // Delete invalid cache
    this.delete(normalizedItem);
  }

  /**
   * Get one reference from cache if valid
   * @param one - RIO one reference
   * @returns {*}
   */
  // eslint-disable-next-line consistent-return
  getValidOne(one) {
    const cachedOne = this.get(one);
    if (this.isOneCacheValid(one, cachedOne)) {
      return cachedOne;
    }
    // Delete invalid cache
    this.delete(one);
  }

  // eslint-disable-next-line consistent-return
  getValidCollection(descriptorCollection) {
    const cachedCollection = this.get(descriptorCollection);
    if (this.isCollectionCacheValid(descriptorCollection, cachedCollection)) {
      return cachedCollection;
    }
    // Delete invalid cache
    this.delete(descriptorCollection);
  }

  isItemCacheValid(normalizedItem) {
    if (!this.isItemModified(normalizedItem) &&
      this.areCachedItemRelationshipsValid(normalizedItem)) {
      return true;
    }
    return false;
  }

  isOneCacheValid(one, cachedOne) {
    if (!this.isOneModified(one, cachedOne)) {
      return true;
    }
    return false;
  }

  isCollectionCacheValid(collection, cachedCollection) {
    if (!this.isCollectionModified(collection, cachedCollection) &&
      !this.areCollectionItemsChanged(collection, cachedCollection)) {
      return true;
    }
    return false;
  }

  isItemModified(normalizedItem) {
    const cachedItem = this.get(normalizedItem);
    if (!isReference(normalizedItem)) {
      // Usually when normalizedItem is not reference it is only item descriptor
      return !_.isEqual(normalizedItem, cachedItem);
    }
    return !cachedItem || isReferenceChanged(normalizedItem, cachedItem);
  }

  isOneModified(one, cachedOne) {
    // Get real item to which One "points"
    const oneItem = cachedOne && this.getNormalizedItem({ id: cachedOne.id, type: cachedOne.type });
    return !oneItem || isReferenceChanged(one, cachedOne) || !this.isItemCacheValid(oneItem);
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

    const relationshipItem = this.getValidItem(relationship);
    return !relationshipItem || relationshipItem !== cachedRelationship;
  }

  /**
   * Takes collection of item descriptors and check if cached collection items match current items
   *
   * @param descriptorCollection
   * @param cachedCollection
   * @returns {boolean}
   */
  areCollectionItemsChanged(descriptorCollection, cachedCollection = []) {
    let matchedRelationshipsItems = 0;

    const relationshipChanged = _.some(descriptorCollection, item => {
      if (!isItemInCollection(cachedCollection, item) || !this.getValidItem(item)) {
        return true;
      }

      matchedRelationshipsItems += 1;
      return false;
    });

    return relationshipChanged || cachedCollection.length !== matchedRelationshipsItems;
  }

  areCachedItemRelationshipsValid(normalizedItem) {
    const relationshipsNames = Object.keys(normalizedItem.relationships || {});

    // TODO - can relationship be removed so there is no property at all?
    // if so, new and old relationship keys must match to be valid!
    return !_.some(
      relationshipsNames,
      relationshipName => this.isRelationshipChanged(normalizedItem, relationshipName)
    );
  }

  isRelationshipChanged(normalizedItem, relationshipName) {
    const relationship = normalizedItem.relationships[relationshipName].data;
    const cachedItem = this.get(normalizedItem);
    const cachedRelationship = cachedItem[relationshipName];

    if (isSingleRelation(relationship)) {
      return this.isSingleRelationshipModified(relationship, cachedRelationship);
    } else if (isCollection(relationship)) {
      return this.areCollectionItemsChanged(relationship, cachedRelationship);
    }

    throw Error('Unknown relationship format!');
  }
}
