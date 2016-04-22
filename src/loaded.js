import _ from 'lodash';
import {
  LOAD_SUCCESS,
  middlewareJsonApiSource,
} from './middleware';

export default (payload, tag = '') => {
  const schema = _.get(payload, 'data.type');
  if (!_.isString(schema) || _.isEmpty(schema)) {
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
