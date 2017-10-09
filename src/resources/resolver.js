import _ from 'lodash';
import UriTemplate from 'urijs/src/URITemplate';
import { getStatus } from '../status';
import { RESOLVED_ENDPOINT } from '../consts';
import rio from '../rio';
import validateResourceConfig from './validation';

function resolveAction(config, action) {
  const actionConfig = _.get(config, ['actions', action], {});

  return _
    .chain({})
    .merge(config, actionConfig)
    .omit('actions')
    .value();
}

function resolveResource(config) {
  if (_.isString(config)) {
    const schemaType = config;
    return rio.getResource(schemaType);
  } else if (_.isObject(config)) {
    const argConfig = config;
    const rioConfig = rio.getResource(argConfig.schema);
    return _.merge({}, rioConfig, argConfig);
  }

  return null;
}

/**
 * Encapsulates additional logic around rio.resolveResource. In case schema argument is object,
 * function merges argument configuration with registered configuration in rio. Allowing
 * overriding base configuration.
 * @param config
 * @returns resolvedConfig
 */
export function resolveResourceConfig(config, action = null) {
  const resolvedResource = resolveResource(config);

  if (!resolvedResource) {
    return null;
  }

  const actionResource = resolveAction(resolvedResource, action);
  validateResourceConfig(actionResource);
  return actionResource;
}

/**
 * Replace endpoint placeholders '{key}' with corresponding value of key in params dict.
 * Unused params are resolved into query params as 'key=value' pairs and concatenated to endpoint
 * @param endpoint
 * @param params
 * @param options
 * @returns {string}
 */
export function buildEndpoint(endpoint, params = {}, options = {}) {
  const isEndpointResolved = options[RESOLVED_ENDPOINT];
  if (isEndpointResolved) {
    return endpoint;
  }

  return new UriTemplate(endpoint).expand(params);
}

export function resolveReferenceSchemaType(reference, schema) {
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

export function resolveSchemaType(config) {
  const schemaConfig = _.get(config, 'schema');

  if (_.isString(schemaConfig)) {
    return schemaConfig;
  }

  return _.get(schemaConfig, 'type');
}
