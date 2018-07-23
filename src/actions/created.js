import _ from 'lodash';
import {
  CREATE_SUCCESS,
} from '../consts';
import { JSON_API_RESOURCE } from '../resources';

export default function created(payload, schema) {
  if (!_.isPlainObject(payload)) {
    throw new Error('Invalid payload type.');
  }
  if (!_.isArray(payload.data) && !_.isPlainObject(payload.data)) {
    throw new Error('Missing payload data property.');
  }
  if (!_.isString(schema)) {
    throw new Error(
      `Invalid schema, "created" expected a string but got: ${JSON.stringify(schema)}`
    );
  }

  return {
    type: CREATE_SUCCESS,
    payload,
    meta: {
      source: JSON_API_RESOURCE,
      schema,
      timestamp: Date.now(),
    },
  };
}
