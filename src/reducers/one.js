import _ from 'lodash';
import {
  REFERENCE_FETCHED,
  REFERENCE_STATUS,
  REFERENCE_CLEAR,
  CHECK_EXPIRATION,
} from './../consts';
import {
  STATUS,
  validationStatus,
  busyStatus,
  createStatus,
  updateStatus,
  setStatus,
  isExpired,
} from './../status';

function isValidAction(action, schema, tag) {
  if (_.get(action, 'type') === CHECK_EXPIRATION) {
    return true;
  }

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

function createDefaultStatus(schema, settings = {}) {
  return updateStatus(
    createStatus(),
    {
      ...settings,
      schema,
      type: 'one',
      id: _.uniqueId(),
    }
  );
}

/**
 * One is generic reducer that enables creating typed & named one reducers that
 * are handling specific REFERENCE_ type actions with specific one name. Collection
 * reducer holds array of id in normalized state. Every one is defined with
 * schema andd tag. One have same purpose as collection reducer, but it holds only one
 * id of any type that references object in state handled by storage reducer. If one
 * reducer receives payload with multiple items, first item will be taken only.
 * @param schema is name of schema that describes data for which reducer
 * is responsible and will process rio actions with same schema defined.
 * @param tag defines along schema one reducer responsibility to process
 * rio action. Tag enable to have multiple collections for same schema. It's important
 * if you want to have normalized state and instances in one place, but different
 * collections of data.
 * @param settings - optional status data, must be object.
 *  RIO settings { expirationTime: seconds }
 * @param initialState is initial state of reducer, can be array or object.
 * @returns {Function}
 */
export default function one(schema, tag = '', settings = {}, initialValue = '') {
  if (tag === '*') {
    throw new Error('Tag value \'*\' is reserved for redux-io and cannot be used.');
  }
  // eslint-disable-next-line no-param-reassign
  const initialState = { value: initialValue };
  setStatus(initialState, createDefaultStatus(schema, settings));
  return (state = initialState, action) => {
    if (!isValidAction(action, schema, tag)) {
      return state;
    }

    switch (action.type) {
      case REFERENCE_FETCHED: {
        const newState = {
          value: action.payload[0] ? action.payload[0].id : initialValue,
        };
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
        const newState = { value: initialValue };
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
        const newState = { value: state.value };
        setStatus(newState, updateStatus(
            state[STATUS],
            action.payload
        ));
        return newState;
      }
      case CHECK_EXPIRATION: {
        if (!isExpired(state)) {
          return state;
        }
        const newState = { value: state.value };
        setStatus(newState, updateStatus(
          state[STATUS],
          {
            validationStatus: validationStatus.INVALID,
          }
        ));
        return newState;
      }
      default: {
        if (state[STATUS]) {
          return state;
        }
        const newState = { ...state };
        setStatus(newState, createDefaultStatus(schema, settings));
        return newState;
      }
    }
  };
}
