import _ from 'lodash';

function isItemInCollection(collection, item) {
  return collection.find(collectionItem => collectionItem.id === item.id);
}

/**
 * Reduce collection with cached data.
 * Always return new reference.
 * Provides method to check if any change occur.
 */
export default class {
  constructor(cache) {
    this.cache = cache;
  }

  isChanged(collection, cachedCollection = []) {
    let matchedRelationshipsItems = 0;

    const relationshipChanged = _.some(collection, item => {
      if (!isItemInCollection(cachedCollection, item) || !this.cache.isItemCacheValid(item)) {
        return true;
      } else {
        matchedRelationshipsItems += 1;
      }
    });

    return relationshipChanged || cachedCollection.length !== matchedRelationshipsItems;
  }
}
