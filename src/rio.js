import _ from 'lodash';
import {
  validateResourceConfig,
  validateResourceTypeConfig,
  resolveSchemaType,
  jsonApiResourceTypeConfig,
  resolveResourceType,
  Resource,
} from './resources';
import JsonApiStandardizer from './standardizers/JsonApiStandardizer';

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
      return null;
    } else if (_.isObject(config)) {
      const resourceType = resolveResourceType(config);
      const resourceTypeConfig = this.getResourceType(resourceType);

      const resolvedConfig = _.merge({}, resourceTypeConfig, config);

      // validation of resource configurtion is done on merged configurations
      // because schema resource config alone can be invalid, but resolved configuration
      // can be valid because resource type configuration can add missing parts
      validateResourceConfig(resolvedConfig);

      const schema = resolveSchemaType(config);
      this.resourceConfigs[schema] = Object.freeze(config);

      return new Resource(resolvedConfig);
    }

    throw new Error('Register argument is invalid. Only object of function are allowed.');
  }

  /**
   * Resolve resource by finding a resource configuration object
   * or by resolving resource with registered resource resolvers.
   */
  getResource(schema) {
    let config = this.resourceConfigs[schema];
    if (config) {
      return config;
    }

    this.resourceResolvers.forEach(resolver => {
      config = resolver(schema);
      if (config) {
        validateResourceConfig(config);
        return false;
      }
      return true;
    });

    return config;
  }

  /**
   * Register resource type for data.
   */
  registerResourceType(config) {
    if (!config) {
      throw new Error('rio.registerResourceType config argument must be object.');
    }

    const { type, standardizer } = config;

    if (!_.isString(type)) {
      throw new Error('rio.registerResourceType type argument must be string.');
    }
    if (_.isEmpty(type)) {
      throw new Error('rio.registerResourceType type is empty.');
    }
    if (!_.isObject(standardizer)) {
      throw new Error('rio.registerResourceType standardizer argument must be an object.');
    }

    validateResourceTypeConfig(config);
    this.resourceTypeConfigs[type] = Object.freeze(config);
    this.standardizers[type] = standardizer;
  }

  /**
   * Resolve resource by finding a resource based on resourceType
   */
  getResourceType(resourceType) {
    return this.resourceTypeConfigs[resourceType];
  }

  /**
   * Get standardizer function based on source type.
   */
  getStandardizer(resourceType) {
    if (!_.isString(resourceType)) {
      throw new Error('rio.getStandardizer resourceType argument must be string.');
    }
    if (_.isEmpty(resourceType)) {
      throw new Error('rio.getStandardizer resourceType is empty.');
    }

    return this.standardizers[resourceType];
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
    this.resourceTypeConfigs = {};
    this.resourceConfigs = {};
    this.resourceResolvers = [];
    this.resourcePaths = {};
    this.denormalizer = null;
    this.standardizers = {};

    // Default standardizer for json-api
    this.registerResourceType({
      ...jsonApiResourceTypeConfig,
      standardizer: new JsonApiStandardizer(),
    });
  }
}

// Single instance of rio per application
const rio = new Rio();
export default rio;
