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

class RelationshipCacheReducer {
  constructor(relationship, cache, denormalizeItem) {
    this.relationship = relationship;
    this.cache = cache;
    this.denormalizeItem = denormalizeItem;
    this.relationshipChanged = false;
  }

  reduce(cachedRelationship) {
    if (isSingleRelation(this.relationship)) {
      return this.reduceSingleRelationship(cachedRelationship);
    } else if (isCollection(this.relationship)) {
      return this.reduceCollectionRelationship(cachedRelationship);
    }

    throw Error('Unknown relationship format!');
  }

  reduceSingleRelationship(cachedRelationship) {
    const newRelationship =
      this.relationship === null ? null : this.denormalizeItem(this.relationship);
    if (cachedRelationship !== newRelationship) {
      this.relationshipChanged = true;
    }
    return newRelationship;
  }

  reduceCollectionRelationship(cachedRelationship) {
    const collectionRelationshipReducer =
      new CollectionRelationshipCacheReducer(this.relationship, this.cache, this.denormalizeItem);
    const newRelationship = collectionRelationshipReducer.reduce(cachedRelationship);
    if (collectionRelationshipReducer.isChanged()) {
      this.relationshipChanged = true;
    }
    return newRelationship;
  }

  isChanged() {
    return this.relationshipChanged;
  }
}

class CollectionRelationshipCacheReducer {
  constructor(collection, cache, denormalizeItem) {
    this.collection = collection;
    this.cache = cache;
    this.denormalizeItem = denormalizeItem;
    this.matchedRelationshipsItems = 0;
    this.relationshipChanged = false;
  }
  reduce(cachedCollection) {
    const reducedCollection = this.collection.map(item => {
      const cachedItem = this.cache.getItem(item);

      const relationshipItem = this.denormalizeItem(item);
      if (isItemInCollection(cachedCollection, item)) {
        this.matchedRelationshipsItems += 1;
      }
      if (cachedItem !== relationshipItem) {
        this.relationshipChanged = true;
        return relationshipItem;
      }
      return cachedItem;
    });

    if (didCollectionChange(cachedCollection, reducedCollection, this.matchedRelationshipsItems)) {
      this.relationshipChanged = true;
    }
    return reducedCollection;
  }
  isChanged() {
    return this.relationshipChanged;
  }
}
