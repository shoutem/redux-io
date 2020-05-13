import _ from 'lodash';
import UriTemplate from 'urijs/src/URITemplate';
import Uri from 'urijs';
import { getStatus } from '../status';
import { RESOLVED_ENDPOINT } from '../consts';
import rio from '../rio';
import { validateResourceConfig } from './validation';

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

function resolveResource(config) {
  if (_.isString(config)) {
    const schemaType = config;
    return rio.getResource(schemaType);
  } else if (_.isObject(config)) {
    const argConfig = config;
    const argSchemaType = resolveSchemaType(argConfig);
    const rioConfig = rio.getResource(argSchemaType);
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

  const usedParams = [];
  const template = new UriTemplate(endpoint);
  const templateUri = template.expand(key => {
    usedParams.push(key);
    return params[key];
  });

  if (!rio.appendUnusedQueryParams) {
    return templateUri.toString();
  }

  const unusedQueryParams = _.omit(params, usedParams);
  if (_.isEmpty(unusedQueryParams)) {
    return templateUri;
  }

  const paramEndpointUri = new Uri(templateUri);
  const resolvedQueryParams = {
    ...paramEndpointUri.query(true),
    ...unusedQueryParams,
  };

  return paramEndpointUri
    .query(resolvedQueryParams)
    .toString();
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
