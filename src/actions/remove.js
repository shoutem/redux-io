import _ from 'lodash';
import { RSAA } from 'redux-api-middleware';
import {
  REMOVE_REQUEST,
  REMOVE_SUCCESS,
  REMOVE_ERROR,
} from './../consts';
import { JSON_API_SOURCE } from './..';
import {
  buildEndpoint,
  resolveConfig,
  buildRSAAConfig,
} from './../schemaConfig';
import thunkAction from './_thunkAction';
import { extendMetaWithResponse } from './_rsaa';

/**
 * Action creator used to delete item on api (DELETE). Tag is not needed because all collection
 * with configured schema value as in argument of delete will be invalidated upon successful
 * action of deleting item on api
 * @param schema can be name of schema or schema configuration. In both cases
 * rio resolves schema with registered schema configurations, and in case of schema
 * configuration passed in argument it merges two configuration objects. Schema configuration
 * object holds config.request attribute which is configuration based on RSAA
 * configuration from redux-api-middleware, allowing full customization expect types
 * part of configuration.
 * @param item to remove/delete
 * @param params to be resolved in schema configuration endpoint. Params are first resolved
 * in endpoint if endpoint holds exact keys {param}, rest of params are resolved
 * as query params key=value
 * @returns {{}}
 */
export function remove(schema, item, params = {}, options = {}) {
  const config = resolveConfig(schema);
  if (!config) {
    const schemaName = schema && _.isObject(schema) ? schema.schema : schema;
    throw new Error(`Couldn't resolve schema ${schemaName} in function find.`);
  }
  if (!_.isObject(item)) {
    throw new Error('Item isn\'t object.');
  }

  const rsaaConfig = buildRSAAConfig(config);
  const endpoint = buildEndpoint(rsaaConfig.endpoint, params, options);

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
      method: 'DELETE',
      ...rsaaConfig,
      endpoint,
      types: [
        {
          type: REMOVE_REQUEST,
          meta,
          payload: { data: item },
        },
        {
          type: REMOVE_SUCCESS,
          meta: extendMetaWithResponse(meta),
          payload: () => ({ data: item }),
        },
        {
          type: REMOVE_ERROR,
          meta: extendMetaWithResponse(meta),
        },
      ],
    },
  };
}

export default thunkAction(remove);
