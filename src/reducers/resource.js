import _ from 'lodash';
import {
  CREATE_REQUEST,
  CREATE_SUCCESS,
  CREATE_ERROR,
  LOAD_REQUEST,
  LOAD_SUCCESS,
  LOAD_ERROR,
  UPDATE_REQUEST,
  UPDATE_SUCCESS,
  UPDATE_ERROR,
  REMOVE_REQUEST,
  REMOVE_SUCCESS,
  REMOVE_ERROR,
  REFERENCE_CLEAR,
} from './../middleware';
import {
  STATUS,
  validationStatus,
  busyStatus,
  createStatus,
  updateStatus,
  setStatus,
} from './../status';
import Outdated from './../outdated';

function createDefaultStatus(schema) {
  return updateStatus(
    createStatus(),
    {
      schema,
      type: 'resource',
      id: _.uniqueId(),
    }
  );
}

const actionsWithoutPayload = new Set([
  LOAD_REQUEST,
  CREATE_REQUEST,
  REMOVE_SUCCESS,
  LOAD_ERROR,
  CREATE_ERROR,
  UPDATE_ERROR,
  REMOVE_ERROR,
  REFERENCE_CLEAR,
]);

function createNewState(state) {
  return _.isArray(state) ? [...state] : { ...state };
}

function createEmptyState(state) {
  return _.isArray(state) ? [] : {};
}

function canHandleAction(action, schema) {
  if (_.get(action, 'meta.schema') !== schema) {
    return false;
  }
  return true;
}

/**
 * Resource reducer saves any payload received with action into state, overwriting
 * previous state. This reducer doesn't require rio middleware, and only depends on
 * rio action and redux-api-middleware.
 * @param schema is name of schema that describes data for which resource reducer
 * is responsible and will process rio actions with same schema defined.
 * @param initialState is initial state of reducer, can be array or object.
 * @returns {Function}
 */
export default function resource(schema, initialState = {}) {
  // eslint-disable-next-line no-param-reassign
  setStatus(initialState, createDefaultStatus(schema));
  const outdated = new Outdated();

  return (state = initialState, action) => {
    if (!canHandleAction(action, schema)) {
      return state;
    }
    if (outdated.isOutdated(action)) {
      return state;
    }
    outdated.reportChange(action);

    const payload = action.payload;
    const needsPayload = !actionsWithoutPayload.has(action.type);
    if (needsPayload && !_.isObject(payload)) {
      return state;
    }

    switch (action.type) {
      case CREATE_REQUEST:
      case LOAD_REQUEST: {
        const newState = createNewState(state);
        setStatus(newState, updateStatus(
          state[STATUS],
          {
            busyStatus: busyStatus.BUSY,
          }
        ));
        return newState;
      }
      case UPDATE_REQUEST: {
        const newState = createNewState(payload);
        setStatus(newState, updateStatus(
          state[STATUS],
          {
            validationStatus: validationStatus.INVALID,
            busyStatus: busyStatus.BUSY,
          }
        ));
        return newState;
      }
      case REMOVE_REQUEST: {
        const newState = createEmptyState(state);
        setStatus(newState, updateStatus(
          state[STATUS],
          {
            validationStatus: validationStatus.INVALID,
            busyStatus: busyStatus.BUSY,
          }
        ));
        return newState;
      }
      case CREATE_SUCCESS:
      case LOAD_SUCCESS:
      case UPDATE_SUCCESS: {
        const newState = createNewState(payload);
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
      case CREATE_ERROR:
      case UPDATE_ERROR:
      case REMOVE_ERROR: {
        const newState = createNewState(state);
        setStatus(newState, updateStatus(
          state[STATUS],
          {
            validationStatus: validationStatus.INVALID,
            busyStatus: busyStatus.IDLE,
          }
        ));
        return newState;
      }
      case LOAD_ERROR: {
        const newState = createNewState(state);
        setStatus(newState, updateStatus(
          state[STATUS],
          {
            validationStatus: validationStatus.INVALID,
            busyStatus: busyStatus.IDLE,
            error: true,
          }
        ));
        return newState;
      }
      case REMOVE_SUCCESS:
      case REFERENCE_CLEAR: {
        const newState = createEmptyState(state);
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
      default: {
        if (state[STATUS]) {
          return state;
        }
        const newState = createNewState(state);
        setStatus(newState, createDefaultStatus(schema));
        return newState;
      }
    }
  };
}
