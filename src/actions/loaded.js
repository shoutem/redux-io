import _ from 'lodash';
import {
  LOAD_SUCCESS,
} from './../middleware';
import { JSON_API_SOURCE } from './..';
import thunkAction from './_thunkAction';

export function loaded(payload, schema, tag = '') {
  if (!_.isPlainObject(payload)) {
    throw new Error('Invalid payload type.');
  }
  if (!_.isArray(payload.data) && !_.isPlainObject(payload.data)) {
    throw new Error('Missing payload data property.');
  }
  if (!_.isString(schema)) {
    throw new Error(`Invalid schema, "loaded" expected a string but got: ${JSON.stringify(schema)}`);
  }
  if (!_.isString(tag)) {
    throw new Error(`Invalid tag, "loaded" expected a string but got: ${JSON.stringify(tag)}`);
  }

  return {
    type: LOAD_SUCCESS,
    payload,
    meta: {
      source: JSON_API_SOURCE,
      schema,
      tag,
      timestamp: Date.now(),
    },
  };
}

export default thunkAction(loaded);
