import _ from 'lodash';

export default class CacheContext {
  constructor(cache, validate) {
    this.validate = validate;
    this.cache = cache;
  }
  get() {
    return this.cache;
  }
  isCached() {
    return this.cache !== undefined;
  }
  isValid() {
    return _.isFunction(this.validate) ? this.validate() : this.validate;
  }
}

export class ItemCacheContext extends CacheContext {
  constructor(cache, validate) {
    super(cache, validate);
    this.relationships;
  }
  getDescriptor() {
    return { id: this.cache.id, type: this.cache.type };
  }
  setNewRelationships(relationships) {
    this.relationships = relationships;
  }
  getNewRelationships() {
    return this.relationships;
  }
}
