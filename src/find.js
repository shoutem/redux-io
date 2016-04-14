import _ from 'lodash';
import { CALL_API } from 'redux-api-middleware';
import {
  LOAD_REQUEST,
  LOAD_SUCCESS,
  LOAD_ERROR,
  middlewareJsonApiSource,
} from './middleware';

// Action creator used to fetch data from api (GET). Config arg is based on CALL_API
// configuration from redux-api-middleware, allowing full customization expect types
// part of configuration. Find function expects schema name of data which correspond
// with storage reducer with same schema value to listen for received data. Tag arg
// is optional, but when used allows your collections with same tag value to respond
// on received data.
export default (config, schema, tag = '') => {
  if (!_.isObject(config)) {
    throw new TypeError('Config isn\'t object.');
  }
  if (!_.isString(schema) || _.isEmpty(schema)) {
    throw new Error('Schema is invalid.');
  }
  if (!_.isString(tag)) {
    throw new Error('Tag isn\'t string.');
  }

  return {
    [CALL_API]: {
      method: 'GET',
      ...config,
      types: [
        LOAD_REQUEST,
        {
          type: LOAD_SUCCESS,
          meta: {
            source: middlewareJsonApiSource,
            schema,
            tag,
          },
        },
        LOAD_ERROR,
      ],
    },
  };
};
