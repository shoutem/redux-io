import CollectionCacheReducer from './CollectionCacheReducer'
import _ from 'lodash';

function isSingleRelation(relationshipData) {
  return _.isPlainObject(relationshipData) || relationshipData === null;
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
  constructor(cache) {
    this.cache = cache;
    this.collectionRelationshipReducer = new CollectionCacheReducer(this.cache);
  }

  isChanged(item, relationshipName) {
    const relationship = item.relationships[relationshipName].data;
    const cachedItem = this.cache.getItem(item);
    const cachedRelationship = cachedItem[relationshipName];

    if (isSingleRelation(relationship)) {
      return !this.cache.isItemCacheValid(relationship);
    } else if (isCollection(relationship)) {
      return this.collectionRelationshipReducer.isChanged(relationship, cachedRelationship);
    }

    throw Error('Unknown relationship format!');
  }
}
