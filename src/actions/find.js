import _ from 'lodash';
import { RSAA } from 'redux-api-middleware';
import {
  LOAD_REQUEST,
  LOAD_SUCCESS,
  LOAD_ERROR,
} from './../middleware';
import { JSON_API_SOURCE } from './..';
import { buildEndpoint, resolveConfig } from './../schemaConfig';

function buildRSAAConfig(config) {
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
 * Action creator used to fetch data from api (GET).
 * @param schema can be name of schema or schema configuration. In both cases
 * rio resolves schema with registered schema configurations, and in case of schema
 * configuration passed in argument it merges two configuration objects. Schema configuration
 * object holds config.request attribute which is configuration based on RSAA
 * configuration from redux-api-middleware, allowing full customization expect types
 * part of configuration.
 * @param tag is optional, but when used allows your collections with same
 * tag value to respond on received data.
 * @param params to be resolved in schema configuration endpoint. Params are first resolved
 * in endpoint if endpoint holds exact keys {param}, rest of params are resolved
 * as query params key=value
 * @returns action
 */
export default function find(schema, tag = '', params = {}, options = {}) {
  const config = resolveConfig(schema);
  if (!config) {
    const schemaName = schema && _.isObject(schema) ? schema.schema : schema;
    throw new Error(`Couldn't resolve schema ${schemaName} in function find.`);
  }
  if (!_.isString(tag)) {
    throw new Error(`Invalid tag, "find" expected a string but got: ${JSON.stringify(tag)}`);
  }

  const rsaaConfig = buildRSAAConfig(config);
  const endpoint = buildEndpoint(rsaaConfig.endpoint, params);

  const meta = {
    source: config.request.resourceType || JSON_API_SOURCE,
    schema: config.schema,
    tag,
    params,
    endpoint,
    options,
  };

  return {
    [RSAA]: {
      method: 'GET',
      ...rsaaConfig,
      endpoint,
      types: [
        {
          type: LOAD_REQUEST,
          meta,
        },
        {
          type: LOAD_SUCCESS,
          meta,
        },
        {
          type: LOAD_ERROR,
          meta,
        },
      ],
    },
  };
}
