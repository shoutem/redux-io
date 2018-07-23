import _ from 'lodash';
import UriTemplate from 'urijs/src/URITemplate';
import { getStatus } from '../status';
import { RESOLVED_ENDPOINT } from '../consts';
import rio from '../rio';
import { validateResourceConfig } from './validation';
import { JSON_API_RESOURCE } from './config';

export function resolveSchemaType(config) {
  const schemaConfig = _.get(config, 'schema');

  if (_.isString(schemaConfig)) {
    return schemaConfig;
  }

  return _.get(schemaConfig, 'type');
}

export function resolveSchema(config) {
  const schemaConfig = _.get(config, 'schema');

  if (_.isString(schemaConfig)) {
    return null;
  }

  return schemaConfig;
}

function resolveAction(config, action) {
  const actionConfig = _.get(config, ['actions', action], {});

  return _
    .chain({})
    .merge(config, actionConfig)
    .omit('actions')
    .value();
}

function resolveSchemaResourceConfig(config) {
  if (_.isString(config)) {
    return rio.getResource(config);
  } else if (_.isObject(config)) {
    const schema = resolveSchemaType(config);
    return rio.getResource(schema);
  }

  return null;
}

export function getResourceType(config) {
  if (_.isObject(config)) {
    return config.type;
  }

  return null;
}

export function resolveResourceType(...configs) {
  const resolvedResourceType = _.chain(configs)
    .map(config => getResourceType(config), JSON_API_RESOURCE)
    .compact()
    .head()
    .value();

  return resolvedResourceType || JSON_API_RESOURCE;
}

/**
 * Encapsulates additional logic around rio.resolveResource. In case schema argument is object,
 * function merges argument configuration with registered configuration in rio. Allowing
 * overriding base configuration.
 * @param config
 * @returns resolvedConfig
 */
export function resolveResourceConfig(config, action = null) {
  if (_.isEmpty(config)) {
    return null;
  }

  // resolve schema resource config
  const schemaResourceConfig = resolveSchemaResourceConfig(config);
  if (_.isString(config) && !schemaResourceConfig) {
    return null;
  }

  // resolve type resource config
  const resourceType = resolveResourceType(config, schemaResourceConfig);
  const typeResourceConfig = rio.getResourceType(resourceType);

  // merge schema and type resource config
  const registeredResourceConfig = _.merge({}, typeResourceConfig, schemaResourceConfig);

  // merge resource config with it's action resource config
  const registeredActionResourceConfig = resolveAction(registeredResourceConfig, action);

  // merge resource config with argument config
  const argumentResourceConfig = _.isString(config) ? {} : config;
  const resolvedResourceConfig = _.merge({}, registeredActionResourceConfig, argumentResourceConfig);

  // validate resource config
  if (!resolvedResourceConfig) {
    return null;
  }

  validateResourceConfig(resolvedResourceConfig);
  return resolvedResourceConfig;
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
