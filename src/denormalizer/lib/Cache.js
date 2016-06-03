import { createUniqueTargetKey } from '@shoutem/json-api-denormalizer';
import { getModificationTime } from '../../status';
import _ from 'lodash';

function getUniqueTargetKey(item) {
  return createUniqueTargetKey(item);
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

  getItemRelationshipCollection(item, relationshipSchema) {
    return this.getCacheByKey(getUniqueRelationshipCollectionKey(item, relationshipSchema));
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
    const cachedRelationships = this.getItemRelationships(item);
    return cachedRelationships !== newRelationships;
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
    const relationships = item.relationships;

    if (!relationships) {
      return relationships
    }

    const newRelationships = _.reduce(relationships, (lels, relationship, schema) => {
      const relationshipData = relationship.data;
      let newRelationship;
      let cachedRelationship;

      if (_.isPlainObject(relationshipData)) {

        newRelationship = denormalizeItem(relationshipData);
        // console.log(relationshipData, newRelationship)
        // console.log(this.isItemChanged(newRelationship), newRelationship.id);
        if (!relationshipsChanged && this.isItemChanged(newRelationship)) {
          relationshipsChanged = true;
        }
      } else if (isCollection(relationshipData)) {

        cachedRelationship = this.getItemRelationshipCollection(item, schema);
        let collectionChanged = false;
        let matchedRelationshipsItems = 0;
        const collectionKey = getUniqueRelationshipCollectionKey(item, schema);

        newRelationship = relationshipData.map(item => {
          const relationshipItem = denormalizeItem(item);
          if (cachedRelationship && cachedRelationship.find(oldItem => oldItem.id === item.id)) {
            matchedRelationshipsItems += 1;
          }
          // console.log(relationshipItem.id, item.id);
          if (this.isItemChanged(relationshipItem)) {
            collectionChanged = true;
          }
        });

        if (
          (!cachedRelationship && newRelationship) ||
          (
            cachedRelationship.length !== newRelationship.length ||
            cachedRelationship.length !== matchedRelationshipsItems
          )
        ) {
          cachedRelationship = true;
        }

        if (collectionChanged) {
          this.cacheRelationshipCollection(newRelationship, collectionKey);
          relationshipsChanged = true;
        }
      } else if (relationshipData === null) {
        // for empty to-one relationships
        newRelationship = null;
        if (!relationshipsChanged && this.isItemChanged(relationshipData)) {
          relationshipsChanged = true;
        }
      }
      lels[schema] = newRelationship;
      return lels;
    }, {});

    if (!relationshipsChanged) {
      return this.getItemRelationships(item);
    }
    return newRelationships;
  }

}
