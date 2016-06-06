import { ObjectDenormalizer } from '@shoutem/json-api-denormalizer';
import _ from 'lodash';

function getStorage(getStore, storagePath) {
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

  createStorage(storage) {
    // Check if ReduxDenormalizer is in ProvideStorage mode and if it is,
    // check if storage is provided. ProvideStorage mode requires storage!
    if (this.provideStorageMode && !storage) {
      throw Error('Invalid storage, ProvideStorage mode requires storage object');
    }
    return storage || getStorage(this.getStore, this.storagePath);
  }

  updateStorage(storage) {
    const denormalizationStorage = this.createStorage(storage);
    super.setNormalizedData(denormalizationStorage);
  }

  denormalizeItemWithStorage(item, storage) {
    this.updateStorage(storage);
    return this.denormalizeItem(item);
  }
  /**
   * Returns denormalized item
   * Storage is needed in ProvideStorage mode.
   *
   * @returns {{}}
   */
  denormalizeItem(item) {
    // TODO(Braco) - find a way to be sure that when in ProvideStorageMode,
    // denormalize is not called directly
    if (!this.provideStorageMode) {
      this.updateStorage();
    }
    return super.denormalizeItem(item);
  }

  /**
   * Returns denormalized collection
   * Storage is needed in ProvideStorage mode.
   *
   * @returns {{}} - denormalized items
   */
  denormalizeCollection(collection, storage) {
    this.updateStorage(storage);
    return collection.map(this.denormalizeItem);
  }
}
