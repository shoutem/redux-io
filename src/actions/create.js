import _ from 'lodash';
import { RSAA } from 'redux-api-middleware';
import {
  CREATE_REQUEST,
  CREATE_SUCCESS,
  CREATE_ERROR,
} from './../middleware';
import { JSON_API_SOURCE } from './..';

/**
 * Action creator used to create item on api (POST). Tag is not needed because all collection
 * with configured schema value as in argument of create will be invalidated upon successful
 * action of creating item on api.
 * @param config based on RSAA configuration from redux-api-middleware,
 * allowing full customization expect types part of configuration
 * @param schema defines what reducers will listen for creation of new item
 * @param item holds object that you want to pass to api
 * @returns {{}}
 */
export default function create(config, schema, item = null) {
  if (!_.isObject(config)) {
    throw new TypeError('Config isn\'t an object.');
  }
  if (!_.isString(schema)) {
    throw new Error(`Invalid schema, "create" expected a string but got: ${JSON.stringify(schema)}`);
  }
  if (_.isEmpty(schema)) {
    throw new Error('Empty schema string.');
  }

  let body = null;
  if (item !== null) {
    if (!_.isObject(item)) {
      throw new Error('Item is not valid in method argument');
    }
    body = JSON.stringify({ data: item });
  } else {
    // we expect a body property in the config if the item is not supplied
    if (!config.body) {
      throw new Error('Item is missing in method argument and in config.body');
    }
    body = config.body;
  }

  const meta = {
    source: JSON_API_SOURCE,
    schema,
    timestamp: Date.now(),
  };

  return {
    [RSAA]: {
      method: 'POST',
      ...config,
      body,
      types: [
        {
          type: CREATE_REQUEST,
          meta,
        },
        {
          type: CREATE_SUCCESS,
          meta,
        },
        {
          type: CREATE_ERROR,
          meta,
        },
      ],
    },
  };
}
