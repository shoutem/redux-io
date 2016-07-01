import RelationshipCacheReducer from './RelationshipCacheReducer'
import _ from 'lodash';

function getCachedItemRelationships(cachedItem, relationships) {
  return Object.keys(relationships).reduce((cachedRelationships, key) => {
    cachedRelationships[key] = cachedItem[key];
    return cachedRelationships;
  }, {});
}

function isCollection(entity) {
  return _.isArray(entity);
}

/**
 * Reduce item relationship with cached data.
 * Always returns new reference.
 * Provides method to check if any change occur.
 */
export default class {
  constructor(item, cache, denormalizeItem) {
    this.item = item;
    this.cache = cache;
    this.denormalizeItem = denormalizeItem;
    this.relationshipsChanged = false;
    this.reducedRelationships;
  }

  reduce() {
    const relationships = this.item.relationships;
    if (!relationships) {
      return relationships;
    }

    const cachedItem = this.cache.getItem(this.item);
    const cachedRelationships = getCachedItemRelationships(cachedItem, relationships);

    this.reducedRelationships = _.reduce(relationships, (newRelationships, relationship, schema) => {
      const cachedRelationship = cachedRelationships && cachedRelationships[schema];

      const relationshipReducer =
        new RelationshipCacheReducer(relationship.data, this.cache, this.denormalizeItem);
      const newRelationship = relationshipReducer.reduce(cachedRelationship);

      const relationshipChanged = relationshipReducer.isChanged();

      newRelationships[schema] = relationshipChanged ? newRelationship : cachedRelationship;

      if (relationshipChanged) {
        this.relationshipsChanged = true;
      }

      return newRelationships;
    }, {});

    return this;
  }

  get() {
    return this.reducedRelationships;
  }

  isChanged() {
    return this.relationshipsChanged;
  }
}
