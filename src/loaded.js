import _ from 'lodash';
import {
  LOAD_SUCCESS,
  middlewareJsonApiSource,
} from './middleware';

export default (payload, schema, tag = '') => {
  if (!_.isString(schema)) {
    throw new Error('Schema is invalid.');
  }
  if (!_.isString(tag)) {
    throw new Error('Tag isn\'t string.');
  }

  return {
    type: LOAD_SUCCESS,
    payload,
    meta: {
      source: middlewareJsonApiSource,
      schema,
      tag,
    },
  };
};
