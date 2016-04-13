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
  middlewareJsonApiSource,
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
// reducer enables creation of typed storage reducers that are
// handling specific OBJECT type actions.
function createStorage(ops) {
  return (schema, initialState = ops.createMap()) =>
    (state = initialState, action) => {
      if (_.get(action, 'meta.schema') !== schema) {
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
  return (schema, tag, initialState = ops.createList()) =>
    (state = initialState, action) => {
      if (_.get(action, 'meta.schema') !== schema) {
        return state;
      }

      // Every collection should invalidate state no matter the name
      // of collection and return initial state.
      if (action.type === COLLECTION_INVALIDATE) {
        return ops.createList();
      }

      // Only if the tag in the action is the same as the one on the collection reducer
      if (_.get(action, 'meta.tag') !== tag) {
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

// Action creator used to fetch data from api (GET). Config arg is based on CALL_API
// configuration from redux-api-middleware, allowing full customization expect types
// part of configuration. Find function expects schema name of data which correspond
// with storage reducer with same schema value to listen for received data. Tag arg
// is optional, but when used allows your collections with same tag value to respond
// on received data.
export function find(config, schema, tag = '') {
  return {
    [CALL_API]: {
      method: 'GET',
      ...config,
      types: [
        LOAD_REQUEST,
        {
          type: LOAD_SUCCESS,
          meta: {
            source: middlewareJsonApiSource,
            schema,
            tag,
          },
        },
        LOAD_ERROR,
      ],
    },
  };
}

// Action creator used to create item on api (POST). Config arg is based on CALL_API
// configuration from redux-api-middleware, allowing full customization expect types
// part of configuration. Create function expects schema name of data which correspond
// with storage reducer with same schema value to listen for created data. Item arg
// holds object that you want to pass to api. Tag is not needed because all collection
// with configured schema value as in argument of create will be invalidated upon successful
// action of creating item on api.
export function create(config, schema, item) {
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
            source: middlewareJsonApiSource,
            schema,
          },
        },
        CREATE_ERROR,
      ],
    },
  };
}
