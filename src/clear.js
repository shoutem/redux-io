import _ from 'lodash';
import {
  REFERENCE_CLEAR,
} from './index';

export default (schema, tag = '') => {
  if (!_.isString(schema)) {
    throw new Error('Schema is invalid.');
  }
  if (!_.isString(tag)) {
    throw new Error('Tag isn\'t string.');
  }

  return {
    type: REFERENCE_CLEAR,
    meta: {
      schema,
      tag,
    },
  };
};
