import _ from 'lodash';
import {
  REFERENCE_FETCHED,
  REFERENCE_STATUS,
  REFERENCE_CLEAR,
} from './../middleware';
import {
  STATUS,
  validationStatus,
  busyStatus,
  getStatus,
  createStatus,
  updateStatus,
  setStatus,
} from './../status';
export const APPEND_MODE = 'appendMode';

function isValid(action, schema, tag) {
  if (_.get(action, 'meta.schema') !== schema) {
    return false;
  }

  // Only if the tag in the action is the same as the one on the collection reducer
  if (_.get(action, 'meta.tag') !== tag) {
    // Every collection should change status if action is type of REFERENCE_STATUS
    // and action meta tag is broadcast
    if (action.type === REFERENCE_STATUS && _.get(action, 'meta.tag') === '*') {
      return true;
    }
    return false;
  }

  return true;
}

function createDefaultStatus(schema, tag) {
  return updateStatus(
    createStatus(),
    {
      schema,
      tag,
      type: 'collection',
      id: _.uniqueId(),
    }
  );
}

export function getCollectionLink(col, pointer) {
  return _.get(getStatus(col), ['links', pointer]);
}

function handleReferencePayload(action, state = []) {
  const appendMode = _.get(action, ['meta', 'options', APPEND_MODE]);
  const newIds = action.payload.map(item => item.id);
  if (appendMode) {
    return [...state, ...newIds];
  }
  return newIds;
}

/**
 * Collection is generic reducer that enables creating
 * typed & named collection reducers that are handling specific
 * REFERENCE_ type actions with specific collection name. Collection reducer
 * holds array of ids in normalized state. Every collection is defined with
 * schema and tag. Collections keeps order of ids in array.
 * @param schema is name of schema that describes data for which reducer
 * is responsible and will process rio actions with same schema defined.
 * @param tag defines along schema collection reducer responsibility to process
 * rio action. Tag enable to have multiple collections for same schema. It's important
 * if you want to have normalized state and instances in one place, but different collections
 * of data.
 * @param initialState is initial state of reducer, can be array or object.
 * @returns {Function}
 */
export default function collection(schema, tag = '', initialState = []) {
  if (tag === '*') {
    throw new Error('Tag value \'*\' is reserved for redux-api-state and cannot be used.');
  }
  // eslint-disable-next-line no-param-reassign
  setStatus(initialState, createDefaultStatus(schema, tag));
  // TODO-vedran: refactor status into context={status, config}
  return (state = initialState, action) => {
    if (!isValid(action, schema, tag)) {
      return state;
    }

    switch (action.type) {
      case REFERENCE_FETCHED: {
        const newState = handleReferencePayload(action, state);
        setStatus(newState, updateStatus(
          state[STATUS],
          {
            validationStatus: validationStatus.VALID,
            busyStatus: busyStatus.IDLE,
            error: false,
          }
        ));
        return newState;
      }
      case REFERENCE_CLEAR: {
        const newState = [];
        setStatus(newState, updateStatus(
          state[STATUS],
          {
            validationStatus: validationStatus.VALID,
            busyStatus: busyStatus.IDLE,
            error: false,
          }
        ));
        return newState;
      }
      case REFERENCE_STATUS: {
        const newState = [...state];
        setStatus(newState, updateStatus(
          state[STATUS],
          action.payload
        ));
        return newState;
      }
      default: {
        if (state[STATUS]) {
          return state;
        }
        const newState = [...state];
        setStatus(newState, createDefaultStatus(schema, tag));
        return newState;
      }
    }
  };
}
