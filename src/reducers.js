import _ from 'lodash';
import Immutable from 'immutable';
import { CALL_API } from 'redux-api-middleware';
import {
  LOAD_REQUEST,
  LOAD_SUCCESS,
  LOAD_ERROR,
  OBJECT_FETCHED,
  COLLECTION_FETCHED,
  CREATE_REQUEST,
  CREATE_SUCCESS,
  CREATE_ERROR,
  OBJECT_CREATED,
  COLLECTION_INVALIDATE,
} from './middleware';

const stateOperations = {
  plain: {
    set: (state, id, item) => ({ ...state, [id]: item }),
    createMap: () => ({}),
    createList: (list = []) => (list),
  },
  immutable: {
    set: (state, id, item) =>
      state.set(item.id, Immutable.fromJS(item)),
    createMap: () => new Immutable.Map(),
    createList: (list = []) => (Immutable.fromJS(list)),
  },
};

// createStorage is responsible for creating plain or
// immutable version of generic storage reducer. Generic storage
// reducer enables creating typed storage reducers that are
// handling specific OBJECT type actions.
function createStorage(ops) {
  return (type, initialState = ops.createMap()) =>
    (state = initialState, action) => {
      if (_.get(action, 'meta.type') !== type) {
        return state;
      }
      const item = action.payload;
      switch (action.type) {
        case OBJECT_FETCHED:
        case OBJECT_CREATED:
          return ops.set(state, item.id, item);
        default:
          return state;
      }
    };
}

export const storage = createStorage(stateOperations.plain);
export const storageImmutable = createStorage(stateOperations.immutable);

// createCollection is responsible for creating plain or
// immutable version of generic collection reducer. Generic collection
// reducer enables creating typed & named collection reducers that are
// handling specific COLLECTION type actions with specific collection
// name.
function createCollection(ops) {
  return (type, name, initialState = ops.createList()) =>
    (state = initialState, action) => {
      if (_.get(action, 'meta.type') !== type) {
        return state;
      }

      // Every collection should invalidate state no matter the name
      // of collection and return initial state.
      if (action.type === COLLECTION_INVALIDATE) {
        return ops.createList();
      }

      // Only if collection name in action is same as for collection
      if (_.get(action, 'meta.collection') !== name) {
        return state;
      }

      switch (action.type) {
        case COLLECTION_FETCHED:
          return ops.createList(action.payload.map(item => item.id));
        default:
          return state;
      }
    };
}

export const collection = createCollection(stateOperations.plain);
export const collectionImmutable = createCollection(stateOperations.immutable);

export function find(config, collectionName = '') {
  return {
    [CALL_API]: {
      method: 'GET',
      ...config,
      types: [
        LOAD_REQUEST,
        {
          type: LOAD_SUCCESS,
          meta: {
            source: 'json_api',
            collection: collectionName,
          },
        },
        LOAD_ERROR,
      ],
    },
  };
}

export function create(item, config) {
  return {
    [CALL_API]: {
      method: 'POST',
      ...config,
      body: JSON.stringify({
        data: item,
      }),
      types: [
        CREATE_REQUEST,
        {
          type: CREATE_SUCCESS,
          meta: {
            source: 'json_api',
          },
        },
        CREATE_ERROR,
      ],
    },
  };
}
