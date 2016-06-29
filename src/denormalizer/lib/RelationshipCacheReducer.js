import CollectionCacheReducer from './CollectionCacheReducer'
import _ from 'lodash';

function isSingleRelation(relationshipData) {
  return _.isPlainObject(relationshipData) || relationshipData === null;
}

function isCollection(entity) {
  return _.isArray(entity);
}

export default class {
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
      new CollectionCacheReducer(this.relationship, this.cache, this.denormalizeItem);
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
