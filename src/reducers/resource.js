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
  applyStatus,
} from './../status';

function createDefaultStatus(schema) {
  return updateStatus(
    createStatus(),
    {
      schema,
      type: 'resource',
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

/**
 * resource ...
 * @param schema
 * @param initialState
 * @returns {Function}
 */
export default function resource(schema, initialState = {}) {
  // eslint-disable-next-line no-param-reassign
  applyStatus(initialState, createDefaultStatus(schema));
  return (state = initialState, action) => {
    if (_.get(action, 'meta.schema') !== schema) {
      return state;
    }

    const payload = action.payload;
    const needsPayload = !actionsWithoutPayload.has(action.type);
    if (needsPayload && !_.isObject(payload)) {
      return state;
    }

    switch (action.type) {
      case CREATE_REQUEST:
      case LOAD_REQUEST: {
        const newState = _.isArray(state) ? [...state] : { ...state };
        applyStatus(newState, updateStatus(
          state[STATUS],
          {
            busyStatus: busyStatus.BUSY,
          }
        ));
        return newState;
      }
      case UPDATE_REQUEST: {
        const newState = _.isArray(payload) ? [...payload] : { ...payload };
        applyStatus(newState, updateStatus(
          state[STATUS],
          {
            validationStatus: validationStatus.INVALID,
            busyStatus: busyStatus.BUSY,
          }
        ));
        return newState;
      }
      case REMOVE_REQUEST: {
        const newState = _.isArray(state) ? [] : {};
        applyStatus(newState, updateStatus(
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
        const newState = _.isArray(payload) ? [...payload] : { ...payload };
        applyStatus(newState, updateStatus(
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
        const newState = _.isArray(state) ? [...state] : { ...state };
        applyStatus(newState, updateStatus(
          state[STATUS],
          {
            validationStatus: validationStatus.INVALID,
            busyStatus: busyStatus.IDLE,
          }
        ));
        return newState;
      }
      case LOAD_ERROR: {
        const newState = _.isArray(state) ? [...state] : { ...state };
        applyStatus(newState, updateStatus(
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
        const newState = _.isArray(state) ? [] : {};
        applyStatus(newState, updateStatus(
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
        const newState = _.isArray(state) ? [...state] : { ...state };
        applyStatus(newState, createDefaultStatus(schema));
        return newState;
      }
    }
  };
}
