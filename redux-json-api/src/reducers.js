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


export function nestedReducer(selectorReducer, reducers) {
  const combination = combineReducers(reducers);
  return (state = new Immutable.Map(), action) => (
    state.withMutations(s => {
      s.set('current', selectorReducer(state.get('current'), action));
      if (s.hasIn(['current', 0])) {
        const id = state.getIn(['current', 0]);
        s.set(id, combination(s.get(id), action));
      }
    })
  );
}

const set = (state, id, item) => ({ ...state, [id]: item });
const setImmutable = (state, id, item) =>
  state.set(item.id, Immutable.fromJS(item));

const config = {
  mutable: {
    set,
    initialState: () => ({}),
  },
  immutable: {
    set: setImmutable,
    initialState: () => new Immutable.Map(),
  },
};


const storageCreator = (cx) =>
  (type, initialState = cx.initialState()) =>
    (state = initialState, action) => {
      if (!_.has(action, 'meta.type') || action.meta.type !== type) {
        return state;
      }
      const item = action.payload;
      switch (action.type) {
        case OBJECT_FETCHED:
          return cx.set(state, item.id, item);
        default:
          return state;
      }
    };

export const storage = storageCreator(config.mutable);
export const storageImmutable = storageCreator(config.immutable);


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
