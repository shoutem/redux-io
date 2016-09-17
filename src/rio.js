import _ from 'lodash';
import { validateSchemaConfig } from './schemaConfig';
import { JSON_API_SOURCE, transform } from './standardizers/json-api-standardizer';

/**
 * Adds additional layer over library by providing central place for defining rio behavior
 * and enabling easier usage by resolving configurations, standardization, denormalization.
 */
export class Rio {
  constructor() {
    this.clear();
  }

  /**
   * Register schema configuration. As schema configuration object or
   * as passing a function that acts as schema resolver.
  */
  registerSchema(config) {
    if (_.isFunction(config)) {
      this.schemaResolvers.push(config);
    } else if (_.isObject(config)) {
      validateSchemaConfig(config);
      this.schemaConfigs[config.schema] = config;
    } else {
      throw new Error('Schema argument is invalid. Only object of function are allowed.');
    }
  }

  /**
   * Resolve schema by finding a schema configuration object
   * or by resolving schema with registered schema resolvers.
   */
  getSchema(schema) {
    let config = this.schemaConfigs[schema];
    if (config) {
      return _.cloneDeep(config);
    }

    this.schemaResolvers.forEach(resolver => {
      config = resolver(schema);
      if (config) {
        validateSchemaConfig(config);
        return false;
      }
      return true;
    });

    return _.cloneDeep(config);
  }

  /**
   * Register source type for data standardization.
   */
  registerSourceType(sourceType, standardizer) {
    if (!_.isString(sourceType)) {
      throw new Error('rio.registerSourceType sourceType argument must be string.');
    }
    if (_.isEmpty(sourceType)) {
      throw new Error('rio.registerSourceType sourceType is empty.');
    }
    if (!_.isFunction(standardizer)) {
      throw new Error('rio.registerSourceType standardizer argument must be a function.');
    }

    this.standardizers[sourceType] = standardizer;
  }

  /**
   * Get standardizer function based on source type.
   */
  getStandardizer(sourceType) {
    if (!_.isString(sourceType)) {
      throw new Error('rio.getStandardizer sourceType argument must be string.');
    }
    if (_.isEmpty(sourceType)) {
      throw new Error('rio.getStandardizer sourceType is empty.');
    }

    return this.standardizers[sourceType];
  }

  /**
   * Set instance of configured denormalizer used for denormalization with Rio.
   */
  setDenormalizer(denormalizer) {
    this.denormalizer = denormalizer;
  }

  /**
   * Set instance of configured denormalizer used for denormalization with Rio.
   */
  setSchemaPaths(schemaPaths) {
    this.schemaPaths = schemaPaths;
  }

  /**
   * Clears registered collections and resolvers
   */
  clear() {
    this.schemaConfigs = {};
    this.schemaResolvers = [];
    this.schemaPaths = {};
    this.denormalizer = null;
    this.standardizers = {};

    // Default standardizer for json-api
    this.registerSourceType(JSON_API_SOURCE, transform);
  }
}

// Single instance of rio per application
const rio = new Rio();
export default rio;
