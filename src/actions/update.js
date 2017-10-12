import _ from 'lodash';
import { RSAA } from 'redux-api-middleware';
import {
  UPDATE_REQUEST,
  UPDATE_SUCCESS,
  UPDATE_ERROR,
} from './../consts';
import { JSON_API_SOURCE } from './..';
import {
  buildEndpoint,
  resolveResourceConfig,
  resolveSchemaType,
  resolveSchema,
} from './../resources';
import { normalize } from '../normalizer';
import thunkAction from './_thunkAction';
import { extendMetaWithResponse, buildRSAAConfig } from '../rsaa';

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
export function update(schema, item = null, params = {}, options = {}) {
  const config = resolveResourceConfig(schema, 'update');
  if (!config) {
    const schemaName = schema && _.isObject(schema) ? resolveSchemaType(config) : schema;
    throw new Error(`Couldn't resolve schema ${schemaName} in function find.`);
  }

  const rsaaConfig = buildRSAAConfig(config);
  const endpoint = buildEndpoint(rsaaConfig.endpoint, params, options);
  const source = _.get(config, 'request.resourceType', JSON_API_SOURCE);

  let body = null;
  if (item !== null) {
    if (!_.isObject(item)) {
      throw new Error('Item is not valid in method argument');
    }
    const normalizedItem = normalize(item, resolveSchema(config));
    body = JSON.stringify({ data: normalizedItem });
  } else {
    body = rsaaConfig.body;
  }

  const meta = {
    params,
    endpoint,
    options,
    source,
    schema: resolveSchemaType(config),
    timestamp: Date.now(),
  };

  return {
    [RSAA]: {
      method: 'PATCH',
      ...rsaaConfig,
      endpoint,
      body,
      types: [
        {
          type: UPDATE_REQUEST,
          meta,
          payload: { data: item },
        },
        {
          type: UPDATE_SUCCESS,
          meta: extendMetaWithResponse(meta),
        },
        {
          type: UPDATE_ERROR,
          meta: extendMetaWithResponse(meta),
        },
      ],
    },
  };
}

export default thunkAction(update);
