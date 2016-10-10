import _ from 'lodash';
import { RSAA } from 'redux-api-middleware';
import {
  UPDATE_REQUEST,
  UPDATE_SUCCESS,
  UPDATE_ERROR,
} from './../middleware';
import { JSON_API_SOURCE } from './..';

/**
 * Action creator used to update item on api (POST). Tag is not needed because all collections
 * with configured schema value as in argument of update will be invalidated upon successful
 * action of updating item on api.
 * @param config is based on RSAA configuration from redux-api-middleware,
 * allowing full customization expect types part of configuration
 * @param schema name of data which correspond with storage reducer with same
 * schema value to listen for updated data
 * @param item holds object that you want to pass to api
 * @returns {{}}
 */
export default function update(config, schema, item) {
  if (!_.isObject(config)) {
    throw new TypeError('Config isn\'t object.');
  }
  if (!_.isString(schema)) {
    throw new Error(`Invalid schema, "update" expected a string but got: ${JSON.stringify(schema)}`);
  }
  if (_.isEmpty(schema)) {
    throw new Error('Empty schema string.');
  }
  if (!_.isObject(item)) {
    throw new Error('Item isn\'t object.');
  }

  const meta = {
    source: JSON_API_SOURCE,
    schema,
    timestamp: Date.now(),
  };

  return {
    [RSAA]: {
      method: 'PATCH',
      ...config,
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
