import _ from 'lodash';
import ZSchema from 'z-schema';
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
          type: 'object',
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
 * Replace endpoint placeholders '{key}' with corresponding value of key in params dict.
 * Unused params are resolved into query params as 'key=value' pairs and concatenated to endpoint
 * @param endpoint
 * @param params
 * @returns {string}
 */
export function buildEndpoint(endpoint, params) {
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

