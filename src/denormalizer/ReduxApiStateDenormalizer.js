import ReduxDenormalizer from './ReduxDenormalizer';
import Cache from './lib/Cache';
import { getCollectionDescription } from '../collection';
import _ from 'lodash';
import { applyStatus } from './../status';

// As redux has only one store, we can create single instance of cache
// for every denormlizer instance
const cache = new Cache();

/**
 * Created getStore for ReduxDenormalizer by using storageMap to find relationships.
 * @param store
 * @param storeSchemasPaths
 * @returns {{}}
 */
export function createSchemasMap(store, storeSchemasPaths) {
  const storage = {};

  _.forEach(storeSchemasPaths, (path, schema) => storage[schema] = _.get(store, path));

  return storage;
}
/**
 * Returns provided data in denormalized form
 */
export default class ReduxApiStateDenormalizer extends ReduxDenormalizer {
  /**
   * ReduxDenormalizer has two modes Find and Provide.
   * ReduxApiStateDenormalizer uses
   *  FindStorage mode
   *    If getStore and storeSchemasPaths are set.
   *    getStore and storeSchemasPaths are used to create generic function
   *    to provide latest storage for relationships resolving
   *  ProvideStorage mode
   *    If there is no getStore and storeSchemasPaths.
   *    Denormalization functions require storage to resolve relationships
   *
   * Storage map gives location of schema saved in storage.
   *
   * @param getStore - returns latest store
   * @param storeSchemasPaths - { schema: pathInStoreToSchema }
   */
  constructor(getStore, storeSchemasPaths) {
    if (getStore && storeSchemasPaths) {
      // FindStorage mode
      super(() => createSchemasMap(getStore(), storeSchemasPaths));
    } else {
      // ProvideStorage mode
      super();
    }
    this.denormalizeItem = this.denormalizeItem.bind(this);
    this.denormalizeRelationshipItem = this.denormalizeRelationshipItem.bind(this);
  }

  /**
   *
   * Denormalize id for given schema.
   * Storage is needed in ProvideStorage mode.
   *
   * @param id
   * @param schema
   * @param storage
   * @returns {{}}
   */
  denormalizeItem(item) {
    if (!cache.isItemChanged(item)) {
      return this.useCache(item);
    }
    return cache.cacheItem(super.denormalizeItem(item));
  }
  
  denormalizeItemFromStorage(item, storage) {
    return cache.cacheItem(super.denormalizeItemFromStorage(item, storage));
  }

  /**
   * Resolving relationships use already set storage so data doesn't get mixed
   *
   * @param item
   * @returns {*}
   */
  denormalizeRelationshipItem(item) {
    if (!cache.isItemChanged(item)) {
      return this.useCache(item);
    }
    return cache.cacheItem(super.denormalizeItem(item));
  }

  /**
   * Reuse cached item or it's relationships
   *
   * @param item
   * @returns {*}
   */
  useCache(item) {
    const normalizedItem = this.getNormalizedItem(item);
    const newRelationships = this.denormalizeItemRelationships(normalizedItem);
    // console.log('has cache', item.id, newRelationships);
    if (!cache.areRelationshipsChanged(normalizedItem, newRelationships)) {
      // console.log('relationships not changed')
      return cache.getItem(normalizedItem);
    }
    // console.log('relationships changed')

    const attributes = super.denormalizeItemAttributes(normalizedItem);
    return cache.cacheItem(this.mergeDenormalizedItemData(
      normalizedItem,
      attributes,
      newRelationships
    ));
  }

  denormalizeItemRelationships(item, storage) {
    if (cache.hasItemRelationships(item)) {
      // if relationships it self nor items haven't changed, relationship will stay the same
      const relationships =
        cache.resolveItemRelationshipsChanges(item, this.denormalizeRelationshipItem);
      return cache.cacheRelationships(relationships, item);
    }
    return cache.cacheRelationships(super.denormalizeItemRelationships(item), item);
  }

  /**
   *
   * Override original mergeDenormalizedItemData
   * Add redux-api-state STATUS from normalized object
   *
   * @param normalizedItem
   * @param itemData
   * @param relationshipsData
   * @returns {{}}
   */
  mergeDenormalizedItemData(normalizedItem, itemData, relationshipsData) {
    const mergedItem = super.mergeDenormalizedItemData(normalizedItem, itemData, relationshipsData);
    applyStatus(normalizedItem, mergedItem);
    return mergedItem;
  }

  /**
   * Denormalize collection for given schema
   * Storage is needed in ProvideStorage mode.
   *
   * @param collection
   * @param schema
   * @param storage
   * @returns {{}}
   */
  denormalizeCollection(collection, storage) {
    // Collection description contains { schema, tag }
    const collectionDescription = getCollectionDescription(collection);
    const descriptorCollection = collection.map(id => ({
      id,
      type: collectionDescription.schema
    }));

    if (!cache.isCollectionChanged(collection)) {
      const updatedCollection =
        cache.resolveCollectionItemsChange(descriptorCollection, this.denormalizeItem);
      if (updatedCollection !== cache.getCollection(collection)) {
        applyStatus(updatedCollection, updatedCollection);
      }
      return updatedCollection;
    }

    const denormalizedCollection = super.denormalizeCollection(descriptorCollection, storage);
    applyStatus(collection, denormalizedCollection);

    return cache.cacheCollection(denormalizedCollection);
  }
}
