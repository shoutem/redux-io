import _ from 'lodash';

function isSchemaConfigValid (config) {
  // TODO: do we want to validate schema configurations?
}

// Adds additional layer over library by providing central place for defining rio behavior
// and enabling easier usage by resolving configurations, standardization, denormalization.
export class Rio {
  constructor() {
    this.schemaConfigs = {};
    this.schemaResolvers = [];
  }

  /**
   * Register schema configuration.
   * Allows passing objects or resolve functions
  */
  registerSchema(config) {
    if (_.isFunction(config)) {
      this.schemaResolvers.push(config);
    } else {
      this.schemaConfigs[config.schema] = config;
    }
  }

  /**
   * Resolve schema by finding a
   * Allows passing objects or resolve functions
   */
  resolveSchema(schema) {
    let config = this.schemaConfigs[schema];
    if (config) {
      return config;
    }

    this.schemaResolvers.forEach(resolver => {
      config = resolver(schema);
      if (config) {
        return false;
      }
      return true;
    });

    return config;
  }

  clear() {
    this.schemaConfigs = {};
    this.schemaResolvers = [];
  }
}

// Single instance of rio per application
const rio = new Rio();
export default rio;
