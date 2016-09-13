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

/**
 * Compare cached entity modification time with current.
 *
 * @param cachedModificationTime
 * @param currentModificationTime
 * @returns {boolean}
 */
function isCacheValid(cachedModificationTime, currentModificationTime) {
  return cachedModificationTime >= currentModificationTime;
}

/**
 *
 * @param reference - either RIO reference or descriotor
 * @param cachedReference - either RIO reference or descriotor
 * @returns {boolean}
 */
export function isReferenceChanged(reference, cachedReference) {
  const cachedReferenceModificationTime = getModificationTime(cachedReference);
  const currentReferenceModificationTime = getModificationTime(reference);

  /**
   * If modification times are undefined, references are descriptors
   * without STATUS object because there is no reference in state.
   * In that case we consider entity not to be changed
   * as we are always returning descriptor.
   */
  if (!cachedReferenceModificationTime && !currentReferenceModificationTime) {
    return false;
  }

  return !isCacheValid(cachedReferenceModificationTime, currentReferenceModificationTime);
}

function getJsonApiUniqueKey(item) {
  return _.isPlainObject(item) && item.id && item.type ? `${item.type}.${item.id}` : undefined;
}

function getReferenceUniqueKey(reference) {
  return getId(reference) || getJsonApiUniqueKey(reference);
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
  }

  // eslint-disable-next-line consistent-return
  getValidCollection(descriptorCollection) {
    const cachedCollection = this.get(descriptorCollection);
    if (this.isCollectionCacheValid(descriptorCollection, cachedCollection)) {
      return cachedCollection;
    }
  }

  isItemCacheValid(normalizedItem) {
    if (!this.isItemModified(normalizedItem) &&
      this.areCachedItemRelationshipsValid(normalizedItem)) {
      return true;
    }
    // Delete invalid cache
    this.delete(normalizedItem);
    return false;
  }

  isOneCacheValid(one, cachedOne) {
    // Get real item to which One "points"
    const oneItem = cachedOne && this.getNormalizedItem({ id: cachedOne.id, type: cachedOne.type });
    if (
      cachedOne && cachedOne &&
      !isReferenceChanged(one, cachedOne) && this.isItemCacheValid(oneItem)
    ) {
      return true;
    }
    // Delete invalid cache
    this.delete(one);
    return false;
  }

  isCollectionCacheValid(collection, cachedCollection) {
    if (!this.isCollectionModified(collection) &&
      !this.areCollectionItemsChanged(collection, cachedCollection)) {
      return true;
    }
    // Delete invalid cache
    this.delete(collection);
    return false;
  }

  isItemModified(normalizedItem) {
    const cachedItem = this.get(normalizedItem);
    return !cachedItem || isReferenceChanged(normalizedItem, cachedItem);
  }

  isCollectionModified(collection) {
    const cachedCollection = this.get(collection);
    return !cachedCollection || isReferenceChanged(collection, cachedCollection);
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
      return !this.getValidItem(relationship);
    } else if (isCollection(relationship)) {
      return this.areCollectionItemsChanged(relationship, cachedRelationship);
    }

    throw Error('Unknown relationship format!');
  }
}
