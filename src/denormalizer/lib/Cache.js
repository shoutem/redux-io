import { createUniqueTargetKey } from '@shoutem/json-api-denormalizer';
import { getModificationTime } from '../../status';
import _ from 'lodash';

function getUniqueTargetKey(item) {
  createUniqueTargetKey(item);
}

function getUniqueCollectionKey(collection) {
  return `${collection.schema}.${collection.tag}`;
}

function getUniqueItemRelationshipsKey(item) {
  return `${item.id}.${item.type}.relationships`;
}
function getUniqueRelationshipCollectionKey(item, relationshipSchema) {
  const itemRelationshipsKey = getUniqueItemRelationshipsKey(item);
  return `${itemRelationshipsKey}.${relationshipSchema}`;
}

function isCacheValid(cachedModificationTime, currentModificationTime) {
  if (cachedModificationTime >= currentModificationTime) {
    return false;
  }
  return true;
}

function didCollectionChange(descriptorCollection, cachedCollection) {
  const cachedCollectionModificationTime = getModificationTime(cachedCollection);
  const currentCollectionModificationTime = getModificationTime(descriptorCollection);

  return isCacheValid(cachedCollectionModificationTime, currentCollectionModificationTime);
}

function isCollection(entity) {
  return _.isArray(entity);
}

export default class JsonApiCache {
  constructor() {
    this.cache = {};
  }

  getCacheByKey(itemKey) {
    return this.cache[itemKey];
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

  getItemRelationshipCollection(item, relationshipSchema) {
    return this.getCacheByKey(getUniqueRelationshipCollectionKey(item, relationshipSchema));
  }

  hasItem(item) {
    return !!this.getItem(item);
  }

  hasCollection(collection) {
    return !!this.getCollection(collection);
  }

  hasRelationships(item) {
    return !!this.getItemRelationships(item);
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

  cacheRelationshipCollection(collection, collectionKey) {
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
    const cachedItemModificationTime = getModificationTime(cachedItem);
    const currentItemModificationTime = getModificationTime(item);

    return isCacheValid(cachedItemModificationTime, currentItemModificationTime);
  }

  isCollectionChanged(collection) {
    if (!this.hasCollection(collection)) {
      return true;
    }
    const cachedCollection = this.getCollection(collection);
    const cachedCollectionModificationTime = getModificationTime(cachedCollection);
    const currentCollectionModificationTime = getModificationTime(collection);

    return isCacheValid(cachedCollectionModificationTime, currentCollectionModificationTime);
  }

  areRelationshipsChanged(item, newRelationships) {
    return this.getItemRelationships(item) === newRelationships;
  }

  resolveCollectionItemsChange(descriptorCollection, denormalizeItem) {
    let collectionChanged = false;
    const newCollection = descriptorCollection.map(item => {
      const newItem = denormalizeItem(item);
      const cachedItem = this.getItem(item);
      if (newItem !== cachedItem) {
        collectionChanged = true;
      }
    });
    if (collectionChanged) {
      return newCollection;
    }
    return this.getCollection(descriptorCollection);
  }

  resolveItemRelationshipsChanges(item, denormalizeItem) {
    let relationshipsChanged = false;

    const newRelationships = item.relationships.map((relationship, schema) => {
      let newRelationship;
      let cachedRelationship;

      if (_.isPlainObject(relationship)) {

        newRelationship = denormalizeItem(relationship);
        if (!relationshipsChanged && this.isItemChanged(newRelationship)) {
          relationshipsChanged = true;
        }
      } else if (isCollection(relationship)) {

        cachedRelationship =this.getItemRelationshipCollection(item, schema);
        let collectionChanged = false;
        let matchedRelationshipsItems = 0;
        const collectionKey = getUniqueRelationshipCollectionKey(item, schema);

        newRelationship = relationship.map(item => {
          const relationshipItem = denormalizeItem(item);
          if (cachedRelationship.find(oldItem => oldItem.id === item.id)) {
            matchedRelationshipsItems += 1;
          }
          if (this.isItemChanged(relationshipItem)) {
            collectionChanged = true;
          }
        });

        if (
          cachedRelationship.length !== newRelationship.length ||
          cachedRelationship.length !== matchedRelationshipsItems
        ) {
          cachedRelationship = true;
        }

        if (collectionChanged) {
          this.cacheRelationshipCollection(newRelationship, collectionKey);
          relationshipsChanged = true;
        }
      } else if (relationship === null) {
        // for empty to-one relationships
        newRelationship = null;
        if (!relationshipsChanged && this.isItemChanged(relationship)) {
          relationshipsChanged = true;
        }
      }

    });

    if (!relationshipsChanged) {
      return this.getItemRelationships(item);
    }

    return newRelationships;
  }

}
