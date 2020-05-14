import _ from 'lodash';
import { validateResourceConfig, resolveSchemaType } from './resources';
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
   * @deprecated Since version 2.0. Will be deleted in version 3.0. Use registerResource instead.
   */
  registerSchema(config) {
    console.warn('Calling deprecated function rio.registerSchema, use rio.registerResource!');
    this.registerResource(config);
  }

  /**
   * @deprecated Since version 2.0. Will be deleted in version 3.0. Use getResource instead.
   */
  getSchema(schema) {
    console.warn('Calling deprecated function rio.getSchema, use rio.getResource!');
    return this.getResource(schema);
  }

  /**
   * @deprecated Since version 2.0. Will be deleted in version 3.0. Use registerResource instead.
   */
  setSchemaPaths(schemaPaths) {
    console.warn('Calling deprecated function rio.setSchemaPaths, use rio.setResourcePaths!');
    this.setResourcePaths(schemaPaths);
  }

  /**
   * Register resource configuration. As resource configuration object or
   * as passing a function that acts as resource resolver.
  */
  registerResource(config) {
    if (_.isFunction(config)) {
      this.resourceResolvers.push(config);
    } else if (_.isObject(config)) {
      validateResourceConfig(config);
      const schema = resolveSchemaType(config);
      this.resourceConfigs[schema] = config;
    } else {
      throw new Error('Register argument is invalid. Only object of function are allowed.');
    }
  }

  /**
   * Resolve resource by finding a resource configuration object
   * or by resolving resource with registered resource resolvers.
   */
  getResource(schema) {
    let config = this.resourceConfigs[schema];
    if (config) {
      return _.cloneDeep(config);
    }

    this.resourceResolvers.forEach(resolver => {
      config = resolver(schema);
      if (config) {
        validateResourceConfig(config);
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
   * Set resource paths
   */
  setResourcePaths(resourcePaths) {
    this.resourcePaths = resourcePaths;
  }

  /**
   * Set option to append unused query params for endpoint.
   * Enabling this option, all params that were not used by
   * an endpoint template will be resolved into query params
   * as 'key=value' pairs and concatenated to the endpoint.
   */
  enableAppendOfUnusedQueryParams() {
    this.appendUnusedQueryParams = true;
  }

  /**
   * Append resource paths to existing resource paths
   */
  appendResourcePaths(resourcePaths) {
    this.resourcePaths = {
      ...resourcePaths,
      ...this.resourcePaths,
    };
  }

  /**
   * Clears registered collections and resolvers
   */
  clear() {
    this.resourceConfigs = {};
    this.resourceResolvers = [];
    this.resourcePaths = {};
    this.denormalizer = null;
    this.appendUnusedQueryParams = false;
    this.standardizers = {};

    // Default standardizer for json-api
    this.registerSourceType(JSON_API_SOURCE, transform);
  }
}

// Single instance of rio per application
const rio = new Rio();
export default rio;
