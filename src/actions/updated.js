import _ from 'lodash';
import {
  UPDATE_SUCCESS,
} from './../middleware';
import { JSON_API_SOURCE } from './..';

export default function updated(payload, schema) {
  if (!_.isPlainObject(payload)) {
    throw new Error('Invalid payload type.');
  }
  if (!_.isArray(payload.data) && !_.isPlainObject(payload.data)) {
    throw new Error('Missing payload data property.');
  }
  if (!_.isString(schema)) {
    throw new Error(
      `Invalid schema, "updated" expected a string but got: ${JSON.stringify(schema)}`
    );
  }
  if (_.isEmpty(schema)) {
    throw new Error('Empty schema string.');
  }

  return {
    type: UPDATE_SUCCESS,
    payload,
    meta: {
      source: JSON_API_SOURCE,
      schema,
      timestamp: Date.now(),
    },
  };
}
