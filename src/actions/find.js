import _ from 'lodash';
import { RSAA } from 'redux-api-middleware';
import {
  LOAD_REQUEST,
  LOAD_SUCCESS,
  LOAD_ERROR,
} from './../consts';
import { JSON_API_SOURCE } from './..';
import {
  buildEndpoint,
  resolveResourceConfig,
  resolveSchemaType,
} from './../resources';
import thunkAction from './_thunkAction';
import { extendMetaWithResponse, buildRSAAConfig } from '../rsaa';

/**
 * If this options key is set to true, the data will be
 * appended to existing data in the state, instead of
 * overwriting it.
 */
export const APPEND_MODE = 'appendMode';

/**
 * Check if current dispatched action is in "append" mode.
 * @param {Object} action Current dispatched action
 */
export function isAppendMode(action) {
  return !!(_.get(action, ['meta', 'options', APPEND_MODE]));
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
export function find(schema, tag = '', params = {}, options = {}) {
  const config = resolveResourceConfig(schema, 'find');
  const schemaType = resolveSchemaType(config);

  if (!config) {
    const schemaName = schema && _.isObject(schema) ? schemaType : schema;
    throw new Error(`Couldn't resolve schema ${schemaName} in function find.`);
  }
  if (!_.isString(tag)) {
    throw new Error(`Invalid tag, "find" expected a string but got: ${JSON.stringify(tag)}`);
  }

  const rsaaConfig = buildRSAAConfig(config);
  const endpoint = buildEndpoint(rsaaConfig.endpoint, params, options);

  const meta = {
    tag,
    params,
    endpoint,
    options,
    source: config.request.resourceType || JSON_API_SOURCE,
    schema: schemaType,
    timestamp: Date.now(),
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
          meta: extendMetaWithResponse(meta),
        },
        {
          type: LOAD_ERROR,
          meta: extendMetaWithResponse(meta),
        },
      ],
    },
  };
}

export default thunkAction(find);

