import _ from 'lodash';
import {
  COLLECTION_CLEARED,
} from './index';

export default (schema, tag = '') => {
  if (!_.isString(schema)) {
    throw new Error('Schema is invalid.');
  }
  if (!_.isString(tag)) {
    throw new Error('Tag isn\'t string.');
  }

  return {
    type: COLLECTION_CLEARED,
    meta: {
      schema,
      tag,
    },
  };
};
