import _ from 'lodash';
import { RSAA } from 'redux-api-middleware';
import {
  UPDATE_REQUEST,
  UPDATE_SUCCESS,
  UPDATE_ERROR,
  RESOLVED_ENDPOINT,
} from './../consts';
import { JSON_API_SOURCE } from './..';
import {
  buildEndpoint,
  resolveConfig,
  buildRSAAConfig
} from './../schemaConfig';
import thunkAction from './_thunkAction';

/**
 * Action creator used to update item on api (POST). Tag is not needed because all collections
 * with configured schema value as in argument of update will be invalidated upon successful
 * action of updating item on api.
 * @param schema can be name of schema or schema configuration. In both cases
 * rio resolves schema with registered schema configurations, and in case of schema
 * configuration passed in argument it merges two configuration objects. Schema configuration
 * object holds config.request attribute which is configuration based on RSAA
 * configuration from redux-api-middleware, allowing full customization expect types
 * part of configuration.
 * @param item holds object that you want to pass to api
 * @param params to be resolved in schema configuration endpoint. Params are first resolved
 * in endpoint if endpoint holds exact keys {param}, rest of params are resolved
 * as query params key=value
 * @returns {{}}
 */
export function update(schema, item, params = {}, options = {}) {
  const config = resolveConfig(schema);
  if (!config) {
    const schemaName = schema && _.isObject(schema) ? schema.schema : schema;
    throw new Error(`Couldn't resolve schema ${schemaName} in function find.`);
  }
  if (!_.isObject(item)) {
    throw new Error('Item isn\'t object.');
  }

  const rsaaConfig = buildRSAAConfig(config);
  const isEndpointResolved = options[RESOLVED_ENDPOINT];
  const endpoint = isEndpointResolved
    ? rsaaConfig.endpoint
    : buildEndpoint(rsaaConfig.endpoint, params);

  const meta = {
    source: config.request.resourceType || JSON_API_SOURCE,
    schema: config.schema,
    params,
    endpoint,
    options,
    timestamp: Date.now(),
  };

  return {
    [RSAA]: {
      method: 'PATCH',
      ...rsaaConfig,
      endpoint,
      body: JSON.stringify({
        data: item,
      }),
      types: [
        {
          type: UPDATE_REQUEST,
          meta,
          payload: { data: item },
        },
        {
          type: UPDATE_SUCCESS,
          meta,
        },
        {
          type: UPDATE_ERROR,
          meta,
        },
      ],
    },
  };
}

export default thunkAction(update);
