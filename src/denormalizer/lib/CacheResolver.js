import CacheContext, { ItemCacheContext } from './CacheContext';
import RelationshipCacheReducer from './RelationshipCacheReducer';
import CollectionCacheReducer from './CollectionCacheReducer';
import _ from 'lodash';

function getCachedItemRelationships(cachedItem, relationships) {
  return Object.keys(relationships).reduce((cachedRelationships, key) => {
    cachedRelationships[key] = cachedItem[key];
    return cachedRelationships;
  }, {});
}

export default class {
  constructor(cache, denormalizeItem) {
    this.cache = cache;
    this.denormalizeItem = denormalizeItem;
  }

  resolveItem(item) {
    if (!this.cache.hasItem(item)) {
      return new CacheContext();
    }
    const relationshipsCache = this.resolveItemRelationships(item);

    const validateFunc = () => !this.cache.isItemChanged(item) && !relationshipsCache.isValid();

    const cachedItem = new ItemCacheContext(this.cache.getItem(item), validateFunc);
    cachedItem.setNewRelationships(relationshipsCache.get());

    return cachedItem;
  }

  resolveItemRelationships(item) {
    const relationships = item.relationships;
    let relationshipsChanged = false;
    if (!relationships) {
      return new CacheContext(relationships, () => false);
    }

    const cachedItem = this.cache.getItem(item);
    const cachedRelationships = getCachedItemRelationships(cachedItem, relationships);

    const reducedRelationships = _.reduce(relationships, (newRelationships, relationship, schema) => {
      const cachedRelationship = cachedRelationships && cachedRelationships[schema];

      const relationshipReducer =
        new RelationshipCacheReducer(relationship.data, this.cache, this.denormalizeItem);
      const newRelationship = relationshipReducer.reduce(cachedRelationship);

      const relationshipChanged = relationshipReducer.isChanged();

      newRelationships[schema] = relationshipChanged ? newRelationship : cachedRelationship;

      if (relationshipChanged) {
        relationshipsChanged = true;
      }

      return newRelationships;
    }, {});

    return new CacheContext(reducedRelationships, relationshipsChanged);
  }

  /**
   * Check if collection or any item within is changed.
   * If changed return new, otherwise return cached collection.
   *
   * @param descriptorCollection - collection with item descriptors [{id, type}...]
   * @param denormalizeItem - function to denormalize single item
   * @returns {*}
   */
  resolveCollection(descriptorCollection) {
    const cachedCollection = this.cache.getCollection(descriptorCollection);
    const collectionReducer =
      new CollectionCacheReducer(descriptorCollection, this.cache, this.denormalizeItem);

    const newCollection = collectionReducer.reduce(cachedCollection);

    if (this.cache.isCollectionChanged(descriptorCollection) || collectionReducer.isChanged()) {
      return newCollection;
    }

    return cachedCollection;
  }

}
