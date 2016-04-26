import _ from 'lodash';
import { CALL_API } from 'redux-api-middleware';
import {
  UPDATE_REQUEST,
  UPDATE_SUCCESS,
  UPDATE_ERROR,
  middlewareJsonApiSource,
} from './middleware';

// Action creator used to update item on api (POST). Config arg is based on CALL_API
// configuration from redux-api-middleware, allowing full customization expect types
// part of configuration. Update function expects schema name of data which correspond
// with storage reducer with same schema value to listen for updated data. Item arg
// holds object that you want to pass to api. Tag is not needed because all collections
// with configured schema value as in argument of update will be invalidated upon successful
// action of updating item on api.
export default (config, schema, item) => {
  if (!_.isObject(config)) {
    throw new TypeError('Config isn\'t object.');
  }
  if (!_.isString(schema) || _.isEmpty(schema)) {
    throw new Error('Schema is invalid.');
  }
  if (!_.isObject(item)) {
    throw new Error('Item isn\'t object.');
  }

  return {
    [CALL_API]: {
      method: 'POST',
      ...config,
      body: JSON.stringify({
        data: item,
      }),
      types: [
        UPDATE_REQUEST,
        {
          type: UPDATE_SUCCESS,
          meta: {
            source: middlewareJsonApiSource,
            schema,
          },
        },
        UPDATE_ERROR,
      ],
    }
  };
};
