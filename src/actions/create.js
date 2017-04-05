import _ from 'lodash';
import { RSAA } from 'redux-api-middleware';
import {
  CREATE_REQUEST,
  CREATE_SUCCESS,
  CREATE_ERROR,
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
 * Action creator used to create item on api (POST). Tag is not needed because all collection
 * with configured schema value as in argument of create will be invalidated upon successful
 * action of creating item on api.
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
 * @returns {function}
 */
export function create(schema, item = null, params = {}, options = {}) {
  const config = resolveConfig(schema);
  if (!config) {
    const schemaName = schema && _.isObject(schema) ? schema.schema : schema;
    throw new Error(`Couldn't resolve schema ${schemaName} in function find.`);
  }

  const rsaaConfig = buildRSAAConfig(config);
  const endpoint = buildEndpoint(rsaaConfig.endpoint, params, options);

  let body = null;
  if (item !== null) {
    if (!_.isObject(item)) {
      throw new Error('Item is not valid in method argument');
    }
    body = JSON.stringify({ data: item });
  } else {
    body = rsaaConfig.body;
  }

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
      method: 'POST',
      ...rsaaConfig,
      endpoint,
      body,
      types: [
        {
          type: CREATE_REQUEST,
          meta,
        },
        {
          type: CREATE_SUCCESS,
          meta: extendMetaWithResponse(meta),
        },
        {
          type: CREATE_ERROR,
          meta: extendMetaWithResponse(meta),
        },
      ],
    },
  };
}

export default thunkAction(create);
