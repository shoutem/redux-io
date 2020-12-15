import _ from 'lodash';
import {
  REFERENCE_CLEAR,
} from './../';

export default function clear(schema, tag = '*') {
  if (!_.isString(schema)) {
    throw new Error(`Invalid schema, "clear" expected a string but got: ${JSON.stringify(schema)}`);
  }
  if (!_.isString(tag)) {
    throw new Error(`Invalid tag, "updated" expected a string but got: ${JSON.stringify(tag)}`);
  }

  return {
    type: REFERENCE_CLEAR,
    meta: {
      schema,
      tag,
    },
  };
}
