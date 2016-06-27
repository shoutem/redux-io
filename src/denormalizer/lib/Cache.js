import { createUniqueTargetKey } from '@shoutem/json-api-denormalizer';
import { getModificationTime } from '../../status';
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

function didCollectionChange(cachedCollection, newCollection, matchedItemsLength) {
  return (!cachedCollection && !!newCollection) ||
    (
      cachedCollection.length !== newCollection.length ||
      cachedCollection.length !== matchedItemsLength
    );
}

function isRasEntityUpdated(entity, cachedEntity) {
  const cachedEntityModificationTime = getModificationTime(cachedEntity);
  const currentEntityModificationTime = getModificationTime(entity);

  return isCacheValid(cachedEntityModificationTime, currentEntityModificationTime);
}

function isItemInCollection(collection, item) {
  return collection && collection.find(collectionItem => collectionItem.id === item.id);
}

export function isCollection(entity) {
  return _.isArray(entity);
}

export function isSingleRelation(relationshipData) {
  return _.isPlainObject(relationshipData) || relationshipData === null;
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
    let collectionChanged = this.isCollectionChanged(descriptorCollection);
    let matchedItems = 0;
    const newCollection = descriptorCollection.map(item => {
      const cachedItem = this.getItem(item);
      const newItem = denormalizeItem(item);
      if (isItemInCollection(cachedCollection, item)) {
        matchedItems += 1;
      }
      if (newItem !== cachedItem) {
        collectionChanged = true;
      }
      return newItem;
    });

    if (!collectionChanged) {
      collectionChanged = didCollectionChange(cachedCollection, newCollection, matchedItems);
    }

    if (collectionChanged) {
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
      const relationshipData = relationship.data;
      const cachedRelationship = cachedRelationships && cachedRelationships[schema];
      let newRelationship;
      let relationshipChanged = false;

      if (isSingleRelation(relationshipData)) {

        newRelationship = relationshipData === null ? null : denormalizeItem(relationshipData);
        if (cachedRelationship !== newRelationship) {
          relationshipChanged = true;
        }
      } else if (isCollection(relationshipData)) {

        let matchedRelationshipsItems = 0;

        newRelationship = relationshipData.map(item => {
          const cachedItem = this.getItem(item);

          const relationshipItem = denormalizeItem(item);
          if (isItemInCollection(cachedRelationship, item)) {
            matchedRelationshipsItems += 1;
          }
          if (cachedItem !== relationshipItem) {
            relationshipChanged = true;
            return relationshipItem;
          }
          return cachedItem;
        });

        if (didCollectionChange(cachedRelationship, newRelationship, matchedRelationshipsItems)) {
          relationshipChanged = true;
        }
      }

      if (relationshipChanged) {
        relationshipsChanged = true;
      }
      newRelationships[schema] = relationshipChanged ? newRelationship : cachedRelationship;
      return newRelationships;
    }, {});

    return relationshipsChanged ? newRelationships : cachedRelationships;
  }

}
