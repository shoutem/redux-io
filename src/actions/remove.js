import _ from 'lodash';
import { RSAA } from 'redux-api-middleware';
import {
  REMOVE_REQUEST,
  REMOVE_SUCCESS,
  REMOVE_ERROR,
  RESOLVED_ENDPOINT,
} from './../consts';
import { JSON_API_SOURCE } from './..';
import { buildEndpoint } from './../schemaConfig';
import thunkAction from './_thunkAction';

/**
 * Action creator used to delete item on api (DELETE). Tag is not needed because all collection
 * with configured schema value as in argument of delete will be invalidated upon successful
 * action of deleting item on api
 * @param config is based on RSAA configuration from redux-api-middleware,
 * allowing full customization expect types part of configuration
 * @param schema name of data which correspond with storage reducer with same schema
 * value to listen for deleted data
 * @param item to remove/delete
 * @returns {{}}
 */
export function remove(config, schema, item, params = {}, options = {}) {
  if (!_.isObject(config)) {
    throw new TypeError('Config isn\'t object.');
  }
  if (!_.isString(schema)) {
    throw new Error(`Invalid schema, "remove" expected a string but got: ${JSON.stringify(schema)}`);
  }
  if (_.isEmpty(schema)) {
    throw new Error('Empty schema string.');
  }
  if (!_.isObject(item)) {
    throw new Error('Item isn\'t object.');
  }

  const isEndpointResolved = options[RESOLVED_ENDPOINT];
  const endpoint = isEndpointResolved
    ? config.endpoint
    : buildEndpoint(config.endpoint, params);

  const meta = {
    source: JSON_API_SOURCE,
    schema,
    params,
    endpoint,
    options,
    timestamp: Date.now(),
  };

  return {
    [RSAA]: {
      method: 'DELETE',
      ...config,
      endpoint,
      types: [
        {
          type: REMOVE_REQUEST,
          meta,
          payload: { data: item },
        },
        {
          type: REMOVE_SUCCESS,
          meta,
          payload: () => ({ data: item }),
        },
        {
          type: REMOVE_ERROR,
          meta,
        },
      ],
    },
  };
}

export default thunkAction(remove);
