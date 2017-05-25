import _ from 'lodash';
import ZSchema from 'z-schema';
import { getStatus } from './status';
import { RESOLVED_ENDPOINT } from './consts';
import rio from './rio';

const validator = new ZSchema();
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
        resourceType: {
          type: 'string',
        },
        body: {
          type: ['object', 'string'],
        },
      },
      additionalProperties: false,
      required: [
        'endpoint',
        'headers',
      ],
    },
    actions: {
      type: 'object',
    },
  },
  additionalProperties: false,
  required: [
    'schema',
    'request',
  ],
};

/**
 * Validates schema configuration using AJV library and json-schema convention.
 * Returns useful errors to enable developer easier fixing invalid schema configuration.
 * @param config
 */
export function validateSchemaConfig(config) {
  const validResult = validator.validate(config, schemaDefinition);
  if (!validResult) {
    const validationErrorsMsg = JSON.stringify(validator.getLastErrors());
    const configMsg = JSON.stringify(config);
    throw new Error(
      `Schema configuration is invalid. Error: ${validationErrorsMsg}.`
      + ` Invalid schema config: ${configMsg}`
    );
  }
}

/**
 * Encapsulates additional logic around rio.resolveSchema. In case schema argument is object,
 * function merges argument configuration with registered configuration in rio. Allowing
 * overriding base configuration.
 * @param schema
 * @returns config
 */
export function resolveConfig(schema) {
  if (_.isString(schema)) {
    return rio.getSchema(schema);
  } else if (_.isObject(schema)) {
    const argConfig = schema;
    const rioConfig = rio.getSchema(argConfig.schema);
    const resolvedSchema = _.merge(rioConfig, argConfig);
    validateSchemaConfig(resolvedSchema);
    return resolvedSchema;
  }
  return undefined;
}

/**
 * Creates new config with data pulled out from config request,
 * @param config
 * @returns config
 */
export function buildRSAAConfig(config) {
  const rsaaConfig = {
    endpoint: config.request.endpoint,
    headers: config.request.headers,
    types: config.request.types,
    method: config.request.method,
    body: config.request.body,
  };

  return _.omitBy(rsaaConfig, _.isNil);
}

/**
 * Replace endpoint placeholders '{key}' with corresponding value of key in params dict.
 * Unused params are resolved into query params as 'key=value' pairs and concatenated to endpoint
 * @param endpoint
 * @param params
 * @param options
 * @returns {string}
 */
export function buildEndpoint(endpoint, params, options) {
  const isEndpointResolved = options[RESOLVED_ENDPOINT];
  if (isEndpointResolved) {
    return endpoint;
  }

  const usedParams = [];
  const paramEndpoint = endpoint.replace(/{(\w+)}/g, (match, key) => {
    usedParams.push(key);
    return params[key];
  });
  const unusedParamKeys = _.difference(Object.keys(params), usedParams);
  const queryParams = unusedParamKeys.map(key => `${key}=${params[key]}`);
  if (_.isEmpty(queryParams)) {
    return paramEndpoint;
  }
  return `${paramEndpoint}?${queryParams.join('&')}`;
}

export function resolveSchemaName(reference, schema) {
  const referenceSchema = _.get(getStatus(reference), 'schema');

  const isReferenceSchemaValid = !_.isEmpty(referenceSchema) && _.isString(referenceSchema);
  const isArgumentSchemaValid = !_.isEmpty(schema) && _.isString(schema);

  if (isReferenceSchemaValid && isArgumentSchemaValid) {
    // eslint-disable-next-line no-console
    console.warn(
      `getCollection or getOne gets both reference schema (${referenceSchema})`
      + ` and argument schema (${schema}). Reference schema has priority`
      + ' over schema argument.'
    );
  }
  if (!isReferenceSchemaValid && !isArgumentSchemaValid) {
    throw new Error(
      'Missing schema name in getCollection or getOne function. Schema needs to'
      + ' be defined in reference or as argument.'
    );
  }

  if (isReferenceSchemaValid) {
    return referenceSchema;
  }
  return schema;
}
