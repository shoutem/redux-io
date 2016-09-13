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

function isCacheValid(cachedModificationTime, currentModificationTime) {
  return cachedModificationTime >= currentModificationTime;
}

function isRioEntityUpdated(entity, cachedEntity) {
  const cachedEntityModificationTime = getModificationTime(cachedEntity);
  const currentEntityModificationTime = getModificationTime(entity);

  return isCacheValid(cachedEntityModificationTime, currentEntityModificationTime);
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

  releaseReference(reference) {
    delete this.cache[getId(reference)];
  }

  get(reference) {
    return this.cache[getId(reference)];
  }

  add(reference) {
    const referenceKey = getId(reference);
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
    this.releaseReference(normalizedItem);
    return false;
  }

  isCollectionCacheValid(collection, cachedCollection) {
    if (!this.isCollectionModified(collection) &&
      !this.areCollectionItemsChanged(collection, cachedCollection)) {
      return true;
    }
    // Delete invalid cache
    this.releaseReference(collection);
    return false;
  }

  isItemModified(normalizedItem) {
    const cachedItem = this.get(normalizedItem);
    return !cachedItem || !isRioEntityUpdated(normalizedItem, cachedItem);
  }

  isCollectionModified(collection) {
    const cachedCollection = this.get(collection);
    return !cachedCollection || !isRioEntityUpdated(collection, cachedCollection);
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
