import _ from 'lodash';
import { CALL_API } from 'redux-api-middleware';
import {
  CREATE_REQUEST,
  CREATE_SUCCESS,
  CREATE_ERROR,
  middlewareJsonApiSource,
} from './middleware';

// Action creator used to create item on api (POST). Config arg is based on CALL_API
// configuration from redux-api-middleware, allowing full customization expect types
// part of configuration. Create function expects schema name of data which correspond
// with storage reducer with same schema value to listen for created data. Item arg
// holds object that you want to pass to api. Tag is not needed because all collection
// with configured schema value as in argument of create will be invalidated upon successful
// action of creating item on api.
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

  const meta = {
    source: middlewareJsonApiSource,
    schema,
  };

  return {
    [CALL_API]: {
      method: 'POST',
      ...config,
      body: JSON.stringify({
        data: item,
      }),
      types: [
        {
          type: CREATE_REQUEST,
          meta,
        },
        {
          type: CREATE_SUCCESS,
          meta,
        },
        CREATE_ERROR,
      ],
    },
  };
};
