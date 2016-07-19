import ReduxDenormalizer from './ReduxDenormalizer';
import RioCache from '../cache/RioCache';
import _ from 'lodash';
import { applyStatus, getStatus } from './../status';

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

function getType(collection, schema) {
  const collectionStatus = getStatus(collection);

  if (!collectionStatus && !schema) {
    throw Error('Denormalizing non RIO Collection (pure Array of IDs) but no schema provided!');
  }

  return schema || collectionStatus.schema;
}
/**
 * Create array of itemDescriptor from array of IDs
 *
 * @param collection - RIO collection or List of IDs
 * @param schema - used if collection is List of IDs
 * @returns {*}
 */
function createDesriptorCollection(collection, schema) {
  const type = getType(collection, schema);
  const descriptorCollection = collection.map(id => ({
    id,
    type,
  }));
  applyStatus(collection, descriptorCollection);
  return descriptorCollection;
}

function createSingleDescriptor(single, schema) {
  const singleIsPrimitiveValue = _.isNumber(single) || _.isString(single);
  if (singleIsPrimitiveValue && !schema) {
    throw Error('Denormalizing primitive single but no schema is provided!');
  }

  if (singleIsPrimitiveValue) {
    return {
      id: single,
      type: schema,
    };
  }

  return {
    id: single.value.id,
    type: single.value.type,
  };
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
   * Denormalize item descriptor for given schema.
   * Storage is needed in ProvideStorage mode.
   *
   * @param itemDescriptor - { id, type }
   * @returns {{}}
   */
  denormalizeItem(itemDescriptor) {
    if (this.cache.isItemCacheValid(itemDescriptor)) {
      return this.cache.getItem(itemDescriptor);
    }

    return this.cache.cacheItem(super.denormalizeItem(itemDescriptor));
  }

  /**
   * Denormalize single RIO entity or id value.
   * If single is primitive value, schema is required so itemDescriptor can be created.
   * Storage is needed in ProvideStorage mode.
   *
   * @param single - can be RIO single entity (with status) or id value
   * @param storage (optional)
   * @param schema (optional)
   * @returns {{}}
   */
  denormalizeSingle(single, storage, schema) {
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
   * Denormalize RIO collection or array of IDs.
   * If collection is not RIO collection but array of IDs,
   * schema is required so itemDescriptors can be created.
   * Storage is needed in ProvideStorage mode.
   *
   * @param collection
   * @param storage (optional)
   * @param schema (optional)
   * @returns {{}}
   */
  denormalizeCollection(collection, storage, schema) {
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
