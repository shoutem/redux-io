import _ from 'lodash';
import Immutable from 'immutable';
import { combineReducers } from 'redux-immutable';
import { CALL_API } from 'redux-api-middleware';
import {
  LOAD_REQUEST,
  LOAD_SUCCESS,
  LOAD_ERROR,
  OBJECT_FETCHED,
  COLLECTION_FETCHED,
} from './middleware';

const stateOperations = {
  plain: {
    set: (state, id, item) => ({ ...state, [id]: item }),
    initialState: () => ({}),
  },
  immutable: {
    set: (state, id, item) =>
      state.set(item.id, Immutable.fromJS(item)),
    initialState: () => new Immutable.Map(),
  },
};

// Create storage is responsible for creating plain or
// immutable version of generic storage reducer. Generic storage
// reducer enables creating typed storage reducer that handles
// specific OBJECT type actions.
function createStorage(ops) {
  return (type, initialState = ops.initialState()) =>
    (state = initialState, action) => {
      if (!_.has(action, 'meta.type') || action.meta.type !== type) {
        return state;
      }
      const item = action.payload;
      switch (action.type) {
        case OBJECT_FETCHED:
          return ops.set(state, item.id, item);
        default:
          return state;
      }
    };
}

export const storage = createStorage(stateOperations.plain);
export const storageImmutable = createStorage(stateOperations.immutable);


export function collection(type, name, initialState = new Immutable.List()) {
  return (state = initialState, action) => {
    if (!_.has(action, 'meta.type') || action.meta.type !== type) {
      return state;
    }
    if (!_.has(action, 'meta.collection') || action.meta.collection !== name) {
      return state;
    }

    switch (action.type) {
      case COLLECTION_FETCHED:
        return new Immutable.List(action.payload.map(item => item.id));
      default:
        return state;
    }
  };
}

export function find(endpoint, headers, type, collectionName = '') {
  return {
    [CALL_API]: {
      headers,
      endpoint,
      method: 'GET',
      types: [
        LOAD_REQUEST,
        {
          type: LOAD_SUCCESS,
          meta: {
            source: 'json_api',
            type,
            collection: collectionName,
          },
        },
        LOAD_ERROR,
      ],
    },
  };
}
