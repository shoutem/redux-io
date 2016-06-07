import _ from 'lodash';
import {
  UPDATE_SUCCESS,
  middlewareJsonApiSource,
} from './middleware';

export default (payload, schema) => {
  if (!_.isPlainObject(payload)) {
    throw new Error('Invalid payload type.');
  }
  if (!_.isArray(payload.data) && !_.isPlainObject(payload.data)) {
    throw new Error('Missing payload data property.');
  }
  if (!_.isString(schema)) {
    throw new Error('Schema is invalid.');
  }

  return {
    type: UPDATE_SUCCESS,
    payload,
    meta: {
      source: middlewareJsonApiSource,
      schema,
    },
  };
};
