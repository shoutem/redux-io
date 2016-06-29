import { createUniqueTargetKey } from '@shoutem/json-api-denormalizer';
import { getModificationTime } from '../../status';
import RelationshipCacheReducer from './RelationshipCacheReducer'
import CollectionCacheReducer from './CollectionCacheReducer'
import _ from 'lodash';

export function getUniqueTargetKey(item) {
  return createUniqueTargetKey(item);
}

export function getUniqueCollectionKey(collection) {
  return `${collection.schema}.${collection.tag}`;
}

export function getUniqueItemRelationshipsKey(item) {
  return `${item.id}.${item.type}.relationships`;
}

function isCacheValid(cachedModificationTime, currentModificationTime) {
  return cachedModificationTime >= currentModificationTime;
}

function isRasEntityUpdated(entity, cachedEntity) {
  const cachedEntityModificationTime = getModificationTime(cachedEntity);
  const currentEntityModificationTime = getModificationTime(entity);

  return isCacheValid(cachedEntityModificationTime, currentEntityModificationTime);
}

export default class JsonApiCache {
  constructor() {
    this.cache = {};
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

  getItemRelationships(item) {
    return this.getCacheByKey(getUniqueItemRelationshipsKey(item));
  }

  hasItem(item) {
    return this.cacheExists(getUniqueTargetKey(item));
  }

  hasCollection(collection) {
    return this.cacheExists(getUniqueCollectionKey(collection));
  }

  hasItemRelationships(item) {
    return this.cacheExists(getUniqueItemRelationshipsKey(item));
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

  cacheRelationships(relationships, item) {
    const relationshipsKey = getUniqueItemRelationshipsKey(item);
    this.cache[relationshipsKey] = relationships;
    return this.getCacheByKey(relationshipsKey);
  }

  isItemChanged(item) {
    if (!this.hasItem(item)) {
      return true;
    }
    const cachedItem = this.getItem(item);
    return !isRasEntityUpdated(item, cachedItem);
  }

  isCollectionChanged(collection) {
    if (!this.hasCollection(collection)) {
      return true;
    }
    const cachedCollection = this.getCollection(collection);
    return !isRasEntityUpdated(collection, cachedCollection);
  }

  resolveCollectionItemsChange(descriptorCollection, denormalizeItem) {
    const cachedCollection = this.getCollection(descriptorCollection);
    const collectionReducer =
      new CollectionCacheReducer(descriptorCollection, this, denormalizeItem);

    const newCollection = collectionReducer.reduce(cachedCollection);

    if (this.isCollectionChanged(descriptorCollection) || collectionReducer.isChanged()) {
      return newCollection;
    }

    return cachedCollection;
  }

  resolveItemRelationshipsChanges(item, denormalizeItem) {
    const cachedRelationships = this.getItemRelationships(item);
    const relationships = item.relationships;
    let relationshipsChanged = false;

    if (!relationships) {
      return relationships;
    }

    const newRelationships = _.reduce(relationships, (newRelationships, relationship, schema) => {
      const cachedRelationship = cachedRelationships && cachedRelationships[schema];

      const relationshipReducer =
        new RelationshipCacheReducer(relationship.data, this, denormalizeItem);
      const newRelationship = relationshipReducer.reduce(cachedRelationship);

      const relationshipChanged = relationshipReducer.isChanged();

      newRelationships[schema] = relationshipChanged ? newRelationship : cachedRelationship;

      if (relationshipChanged) {
        relationshipsChanged = true;
      }

      return newRelationships;
    }, {});
    return relationshipsChanged ? newRelationships : cachedRelationships;
  }

}
