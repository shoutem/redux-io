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
  denormalizeItem(item, storage) {
    if (!cache.isItemChanged(item)) {
      const newRelationships = this.denormalizeItemRelationships(item);
      if (!cache.areRelationshipsChanged(item, newRelationships)) {
        return cache.getItem(item);
      }
      cache.cacheRelationships(newRelationships, item);
      return this.mergeDenormalizedItemData(
        item,
        super.denormalizeItemAttributes(item),
        newRelationships
      );
    }
    return cache.cacheItem(super.denormalizeItem(item, storage));
  }

  denormalizeItemRelationships(normalizedItem) {
    if (cache.hasRelationships(normalizedItem)) {
      return cache.resolveItemRelationshipsChanges(normalizedItem);
    }
    return super.denormalizeItemRelationships(normalizedItem);
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
        cache.resolveCollectionItemsChange(collection, this.denormalizeItem);
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
