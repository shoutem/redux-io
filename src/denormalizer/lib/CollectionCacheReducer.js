function didCollectionChange(cachedCollection, newCollection, matchedItemsLength) {
  return (!cachedCollection && !!newCollection) ||
    (
      cachedCollection.length !== newCollection.length ||
      cachedCollection.length !== matchedItemsLength
    );
}

function isItemInCollection(collection, item) {
  return collection && collection.find(collectionItem => collectionItem.id === item.id);
}

/**
 * Reduce collection with cached data.
 * Always return new reference.
 * Provides method to check if any change occur.
 */
export default class {
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
