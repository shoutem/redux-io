import _ from 'lodash';
import {
  COLLECTION_FETCHED,
  COLLECTION_INVALIDATE,
} from './middleware';


export const COLLECTION_CLEAR = '@@redux_api_state/COLLECTION_CLEAR';
export const COLLECTION_STATUS = Symbol('collection_status');
const status = {
  invalidated: false,
  loading: false,
};

// collection is generic collection reducer that enables creating
// typed & named collection reducers that are handling specific
// COLLECTION_ type actions with specific collection name.
export default (schema, tag, initialState = []) => {
  // eslint-disable-next-line no-param-reassign
  initialState[COLLECTION_STATUS] = status;
  return (state = initialState, action) => {
    if (_.get(action, 'meta.schema') !== schema) {
      return state;
    }

    // Every collection should invalidate state no matter the name
    // of collection and return initial state.
    if (action.type === COLLECTION_INVALIDATE) {
      const newState = [...state];
      newState[COLLECTION_STATUS] = { ...status, invalidated: true };
      return newState;
    }

    // Only if the tag in the action is the same as the one on the collection reducer
    if (_.get(action, 'meta.tag') !== tag) {
      return state;
    }

    switch (action.type) {
      case COLLECTION_FETCHED: {
        const newState = action.payload.map(item => item.id);
        newState[COLLECTION_STATUS] = { ... status };
        return newState;
      }
      case COLLECTION_CLEAR: {
        const newState = [];
        newState[COLLECTION_STATUS] = { ...status };
        return newState;
      }
      default:
        return state;
    }
  };
};
