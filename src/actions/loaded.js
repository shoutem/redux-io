import _ from 'lodash';
import {
  LOAD_SUCCESS,
} from '../consts';
import { JSON_API_RESOURCE } from '../resources';

export default function loaded(payload, schema, tag = '') {
  if (!_.isPlainObject(payload)) {
    throw new Error('Invalid payload type.');
  }
  if (!_.isArray(payload.data) && !_.isPlainObject(payload.data)) {
    throw new Error('Missing payload data property.');
  }
  if (!_.isString(schema)) {
    throw new Error(
      `Invalid schema, "loaded" expected a string but got: ${JSON.stringify(schema)}`
    );
  }
  if (!_.isString(tag)) {
    throw new Error(`Invalid tag, "loaded" expected a string but got: ${JSON.stringify(tag)}`);
  }

  return {
    type: LOAD_SUCCESS,
    payload,
    meta: {
      schema,
      tag,
      source: JSON_API_RESOURCE,
      timestamp: Date.now(),
    },
  };
}
