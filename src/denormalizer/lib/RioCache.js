import RelationshipCacheReducer from './RelationshipCacheReducer';
import CollectionCacheReducer from './CollectionCacheReducer';
import { createUniqueTargetKey } from '@shoutem/json-api-denormalizer';
import { getModificationTime } from '../../status';
import _ from 'lodash';

export function getUniqueTargetKey(item) {
  return createUniqueTargetKey(item);
}

export function getUniqueCollectionKey(collection) {
  return `${collection.schema}.${collection.tag}`;
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
    this.relationshipsCacheResolver = new RelationshipCacheReducer(this);
    this.collectionCacheResolver = new CollectionCacheReducer(this);
  }

  flush() {
    this.cache = {};
  }

  getCacheByKey(itemKey) {
    return this.cache[itemKey];
  }

  cacheExists(key) {
    return this.cache.hasOwnProperty(key);
  }

  getItem(item) {
    return this.getCacheByKey(getUniqueTargetKey(item));
  }

  getCollection(collection) {
    return this.getCacheByKey(getUniqueCollectionKey(collection));
  }

  hasItem(item) {
    return this.cacheExists(getUniqueTargetKey(item));
  }

  hasCollection(collection) {
    return this.cacheExists(getUniqueCollectionKey(collection));
  }

  cacheItem(item) {
    const itemKey = getUniqueTargetKey(item);
    this.cache[itemKey] = item;
    return this.getCacheByKey(itemKey);
  }

  cacheCollection(collection) {
    const collectionKey = getUniqueCollectionKey(collection);
    this.cache[collectionKey] = collection;
    return this.getCacheByKey(collectionKey);
  }

  isItemModified(item) {
    if (!this.hasItem(item)) {
      return true;
    }
    const cachedItem = this.getItem(item);
    return !isRioEntityUpdated(item, cachedItem);
  }

  isCollectionModified(collection) {
    if (!this.hasCollection(collection)) {
      return true;
    }
    const cachedCollection = this.getCollection(collection);
    return !isRioEntityUpdated(collection, cachedCollection);
  }

  isRelationshipsCacheChanged(item) {
    const relationshipsNames = Object.keys(item.relationships || {});

    // TODO - can relationship be removed so there is no property at all?
    // if so, new and old relationship keys must match to be valid!
    return _.some(relationshipsNames,(relationshipName) => {
      return this.relationshipsCacheResolver.isChanged(item, relationshipName);
    });
  }

  isItemCacheValid(itemDescriptor) {
    const normalizedItem = this.getNormalizedItem(itemDescriptor);
    if (this.isItemModified(normalizedItem) || this.isRelationshipsCacheChanged(normalizedItem)) {
      return false;
    }
    return true;
  }

  isCollectionCacheValid(descriptorCollection) {
    if (this.isCollectionModified(descriptorCollection)) {
      return false;
    }
    const cachedCollection = this.getCollection(descriptorCollection);
    return !this.collectionCacheResolver.isChanged(descriptorCollection, cachedCollection);
  }
}
