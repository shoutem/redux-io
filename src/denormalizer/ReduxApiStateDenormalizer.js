import ReduxDenormalizer from './ReduxDenormalizer';
import RioCache from './lib/RioCache';
import { getCollectionDescription } from '../collection';
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
 *
 * @param collection - RIO collection or List of IDs
 * @param schema - used if collection is List of IDs
 * @returns {*}
 */
function createDesriptorCollection(collection, schema) {
  const collectionDescription = getCollectionDescription(collection);
  const descriptorCollection = collection.map(id => ({
    id,
    type: schema || collectionDescription.schema
  }));
  applyStatus(collection, descriptorCollection);
  return descriptorCollection;
}

function createSingleDescriptor(single, schema) {
  if (schema) {
    return {
      id: single,
      type: schema,
    };
  }

  return {
    id: single.id,
    type: single.type,
  };
}

function resolveSchemaAndStorageFromArgs(args) {
  let storage;
  let schema;

  if (args.length === 2) {
    storage = args[1];
  } else if (args.length === 3) {
    schema = args[1];
    storage = args[2];
  }

  return {
    schema,
    storage,
  }
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
    // TODO(Braco) - optimize relationships cache
    // TODO(Braco) - use state entities to detect change
    if (getStore && storeSchemasPaths) {
      // FindStorage mode
      super(() => createSchemasMap(getStore(), storeSchemasPaths));
    } else {
      // ProvideStorage mode
      super();
    }
    this.denormalizeItem = this.denormalizeItem.bind(this);
    this.getNormalizedItem = this.getNormalizedItem.bind(this);
    this.cache = new RioCache(this.getNormalizedItem);
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
  denormalizeItem(itemDescriptor) {
    if (this.cache.isItemCacheValid(itemDescriptor)) {
      return this.cache.getItem(itemDescriptor);
    }

    return this.cache.cacheItem(super.denormalizeItem(itemDescriptor));
  }

  /**
   *
   * @param single - can be RIO single entity (with status) or id value
   * @returns {{}}
   */
  denormalizeSingle(single) {
    const { storage, schema } = resolveSchemaAndStorageFromArgs(arguments);
    const itemDescriptor = createSingleDescriptor(single, schema);

    // if storage is undefined, denormalizer is in Find storage mode
    this.updateStorage(storage);
    return this.denormalizeItem(itemDescriptor);
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
  denormalizeCollection(collection) {
    const { storage, schema } = resolveSchemaAndStorageFromArgs(arguments);
    const descriptorCollection = createDesriptorCollection(collection, schema);

    if (this.cache.isCollectionCacheValid(descriptorCollection)) {
      return this.cache.getCollection(collection);
    }

    this.updateStorage(storage);

    const denormalizedCollection =
      descriptorCollection.map(itemDescriptor => this.denormalizeItem(itemDescriptor));

    applyStatus(collection, denormalizedCollection);
    return this.cache.cacheCollection(denormalizedCollection);
  }

  /**
   * Clear cache
   */
  flushCache() {
    this.cache.flush();
  }
}
