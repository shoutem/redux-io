import { ObjectDenormalizer } from '@shoutem/json-api-denormalizer';
import _ from 'lodash';

function resolveStorageMap(getStore, storagePath) {
  const store = getStore();

  if (!storagePath) {
    return store;
  }

  return _.get(getStore(), storagePath);
}

/**
 * Returns provided data in denormalized form
 */
export default class ReduxDenormalizer extends ObjectDenormalizer {
  /**
   * ReduxDenormalizer has two modes:
   *  1st - FindStorage mode
   *    Provide getStore and storagePath dynamically get latest storage
   *  2nd - ProvideStorage mode
   *    There is no getStore and storagePath,
   *    denormalization functions require storage to resolve relationships
   *
   * @param getStore - function to get current store
   * @param storagePath - path to storage object in store
   */
  constructor(getStore, storagePath) {
    // storage reference will be updated every time denormalizing
    // Object denormalizer requires normalizedData object when initialising
    super({});

    if (!getStore && !storagePath) {
      this.provideStorageMode = true;
    } else {
      this.provideStorageMode = false;
      if (!_.isFunction(getStore)) {
        throw Error('Invalid getStore, must be function.');
      }
      if (storagePath && !_.isString(storagePath)) {
        throw Error('Invalid storagePath, must be string.');
      }
    }

    this.getStore = getStore;
    this.storagePath = storagePath;
    this.denormalizeItem = this.denormalizeItem.bind(this);
  }

  /**
   * Create new storageMap depending on active mode.
   *
   * @param storage
   * @returns {*}
   */
  createStorageMap(storage) {
    // Check if ReduxDenormalizer is in ProvideStorage mode and if it is,
    // check if storage is provided. ProvideStorage mode requires storage!
    if (this.provideStorageMode && !storage) {
      throw Error('Invalid storage, ProvideStorage mode requires storage object');
    }
    return storage || resolveStorageMap(this.getStore, this.storagePath);
  }

  /**
   * Create new storageMap and update normalized data with it.
   * Normalized data is ObjectDenormalizer pool for normalized items.
   *
   * @param storage
   */
  updateStorageMap(storage) {
    const denormalizationStorage = this.createStorageMap(storage);
    super.setNormalizedData(denormalizationStorage);
  }

  /**
   * Returns denormalized item
   *
   * @returns {{}}
   */
  denormalizeItem(item) {
    // TODO(Braco) - find a way to be sure that when in ProvideStorageMode,
    // denormalize is not called directly
    if (!this.provideStorageMode) {
      this.updateStorageMap();
    }
    return super.denormalizeItem(item);
  }

  /**
   * Updates denormalizer storage and denormalizes item
   *
   * @param collection
   * @param storage
   * @returns {{}} - denormalized items
   */

  denormalizeItemFromStorage(item, storage) {
    this.updateStorageMap(storage);
    return this.denormalizeItem(item);
  }

  /**
   * Denormalizes collection
   *
   * @param collection
   * @returns {{}} - denormalized items
   */
  denormalizeCollection(collection) {
    return collection.map(this.denormalizeItem);
  }

  /**
   * Updates denormalizer storage and denormalizes collection
   *
   * @param collection
   * @param storage
   * @returns {{}} - denormalized items
   */
  denormalizeCollectionFromStorage(collection, storage) {
    this.updateStorageMap(storage);
    return this.denormalizeCollection(collection);
  }
}
