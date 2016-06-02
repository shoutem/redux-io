import ReduxDenormalizer from './ReduxDenormalizer';
import _ from 'lodash';
import { applyStatus } from './../status';

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
  denormalizeItem(id, schema, storage) {
    return super.denormalizeItem({ id, type: schema }, storage);
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
  denormalizeCollection(collection, schema, storage) {
    const denormalizedCollection = collection.map(id =>
      (this.denormalizeItem(id, schema, storage))
    );
    applyStatus(collection, denormalizedCollection);
    return denormalizedCollection;
  }
}
