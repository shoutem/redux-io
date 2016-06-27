import ReduxDenormalizer from './ReduxDenormalizer';
import Cache, { isCollection, getUniqueRelationshipCollectionKey } from './lib/Cache';
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

function createDesriptorCollection(collection) {
  const collectionDescription = getCollectionDescription(collection);
  const descriptorCollection = collection.map(id => ({
    id,
    type: collectionDescription.schema
  }));
  applyStatus(collection, descriptorCollection);
  return descriptorCollection;
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
    const normalizedItem = this.getNormalizedItem(item);
    if (cache.hasItem(normalizedItem)) {
      return this.denormalizeCachedItem(normalizedItem);
    }
    return cache.cacheItem(super.denormalizeItem(item));
  }

  /**
   * Used to denromalize item in ProvideStorage mode or specific storage.
   *
   * @param item
   * @param storage
   * @returns {*}
   */
  denormalizeItemFromStorage(item, storage) {
    this.updateStorage(storage);
    return this.denormalizeItem(item);
  }

  /**
   * Reuse cached item or it's relationships
   *
   * @param item
   * @returns {*}
   */
  denormalizeCachedItem(normalizedItem) {
    const cachedRelationships = cache.getItemRelationships(normalizedItem);
    const newRelationships = this.denormalizeItemRelationships(normalizedItem);

    if (!cache.isItemChanged(normalizedItem) && cachedRelationships === newRelationships) {
      return cache.getItem(normalizedItem);
    }

    const attributes = super.denormalizeItemAttributes(normalizedItem);
    return cache.cacheItem(this.mergeDenormalizedItemData(
      normalizedItem,
      attributes,
      newRelationships
    ));
  }

  /**
   * Denormalize and cache item relationships
   *
   * @param item
   * @returns {*}
   */
  denormalizeItemRelationships(item) {
    const relationships = cache.resolveItemRelationshipsChanges(item, this.denormalizeItem);
    return cache.cacheRelationships(relationships, item);
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
    this.updateStorage(storage);
    const descriptorCollection = createDesriptorCollection(collection);

    const denormalizedCollection =
      cache.resolveCollectionItemsChange(descriptorCollection, this.denormalizeItem);

    applyStatus(collection, denormalizedCollection);
    return cache.cacheCollection(denormalizedCollection);
  }

  /**
   * Clear cache
   */
  flushCache() {
    cache.flush();
  }
}
