import ReduxDenormalizer from './ReduxDenormalizer';
import RioCache from '../cache/RioCache';
import _ from 'lodash';
import { cloneStatus, getStatus } from './../status';

/**
 * Created getStore for ReduxDenormalizer by using storageMap to find relationships.
 * @param state
 * @param storeSchemasPaths {schema: 'path.to.storage' || schema: ['path', 'to', 'storage]}
 * @returns {{}}
 */
export function createSchemasMap(state, storeSchemasPaths) {
  const storage = {};

  // eslint-disable-next-line no-return-assign
  _.forEach(storeSchemasPaths, (path, schema) => storage[schema] = _.get(state, path));

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
function createDescriptorCollection(collection, schema) {
  const type = getType(collection, schema);
  const descriptorCollection = collection.map(id => ({
    id,
    type,
  }));
  cloneStatus(collection, descriptorCollection);
  return descriptorCollection;
}

function createSingleDescriptor(single, schema) {
  const singleIsPrimitiveValue = _.isNumber(single) || _.isString(single);
  if (singleIsPrimitiveValue && !schema) {
    throw Error('Cannot create primitive one descriptor, schema is not provided.!');
  }

  if (singleIsPrimitiveValue) {
    return {
      id: single,
      type: schema,
    };
  }

  const { schema: type } = getStatus(single);

  return {
    id: single.value,
    type,
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
   * Return normalized item or item descriptor.
   * Item which is not accessible from storage map will be denormalized and saved in cache
   * as given descriptor. Cache must to be able to get normalized item to validate cache,
   * this function provides either true normalized item or descriptor which will be cached.
   *
   * @param itemDescriptor
   * @returns {*}
   */
  getNormalizedItem(itemDescriptor) {
    return super.getNormalizedItem(itemDescriptor) || itemDescriptor;
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
    let item = this.cache.getValidItem(itemDescriptor);
    if (!item) {
      item = this.cache.add(super.denormalizeItem(itemDescriptor));
    }
    return item;
  }

  /**
   * Denormalize RIO One entity or id value.
   * If one is primitive value, schema is required so itemDescriptor can be created.
   * When one is RIO reference, status of denormalized object is same as status of one reference,
   * in other cases status is copied from items.
   * Storage is needed in ProvideStorage mode.
   *
   * @param one - can be RIO one entity (with status) or id value
   * @param storage (optional)
   * @param schema (optional)
   * @returns {{}}
   */
  denormalizeOne(one, storage, schema) {
    if (!one) {
      // If one undefined we have nothing to do with it
      return undefined;
    }

    const itemDescriptor = createSingleDescriptor(one, schema);
    // if storage is undefined, denormalizer is in Find storage mode
    this.updateStorageMap(storage);

    if (_.isPlainObject(one)) {
      // is RIO One reference
      let denormalizedOne = this.cache.getValidOne(one);
      if (denormalizedOne) {
        return denormalizedOne;
      }

      // One is different object then denormalizedItem
      denormalizedOne = { ...this.denormalizeItem(itemDescriptor) };
      // Append One status to denormalizedOne
      // When One is RIO reference we want status of reference and not status of contained item.
      cloneStatus(one, denormalizedOne);
      return this.cache.add(denormalizedOne);
    }

    // is Primitive value
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
    cloneStatus(normalizedItem, mergedItem);
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
    if (!collection) {
      // If collection undefined we have nothing to do with it
      return undefined;
    }

    const descriptorCollection = createDescriptorCollection(collection, schema);

    let denormalizedCollection = this.cache.getValidCollection(descriptorCollection);
    if (!denormalizedCollection) {
      this.updateStorageMap(storage);

      denormalizedCollection =
        descriptorCollection.map(itemDescriptor => this.denormalizeItem(itemDescriptor));

      if (!getStatus(collection)) {
        return denormalizedCollection;
      }

      cloneStatus(collection, denormalizedCollection);
      this.cache.add(denormalizedCollection);
    }

    return denormalizedCollection;
  }

  /**
   * Clear cache
   */
  flushCache() {
    this.cache.flush();
  }
}
