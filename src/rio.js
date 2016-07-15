import _ from 'lodash';
import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true });
const schemaDefinition = {
  type: 'object',
  properties: {
    schema: {
      type: 'string',
    },
    request: {
      type: 'object',
      properties: {
        endpoint: {
          type: 'string',
        },
        headers: {
          type: 'object',
        },
        method: {
          type: 'string',
        },
        types: {
          type: 'array',
        },
      },
      additionalProperties: false,
      required: [
        'endpoint',
        'headers',
      ],
    },
  },
  additionalProperties: false,
  required: [
    'schema',
    'request',
  ],
};

export function validateSchemaConfig(config) {
  const validResult = ajv.validate(schemaDefinition, config);
  if (!validResult) {
    throw new Error(
      `Schema configuration is invalid. Error: ${ajv.errorsText(validResult.errors)}`
      + `Current schema config: ${config}`
    );
  }
}

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
  resolveSchema(schema) {
    let config = this.schemaConfigs[schema];
    if (config) {
      return config;
    }

    this.schemaResolvers.forEach(resolver => {
      config = resolver(schema);
      if (config) {
        validateSchemaConfig(config);
        return false;
      }
      return true;
    });

    return config;
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
  }
}

// Single instance of rio per application
const rio = new Rio();
export default rio;
