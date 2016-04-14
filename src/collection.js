import _ from 'lodash';
import {
  COLLECTION_FETCHED,
  COLLECTION_INVALIDATE,
} from './middleware';

// collection is generic collection reducer that enables creating
// typed & named collection reducers that are handling specific
// COLLECTION_ type actions with specific collection name.
export default (schema, tag, initialState = []) =>
  (state = initialState, action) => {
    if (_.get(action, 'meta.schema') !== schema) {
      return state;
    }

    // Every collection should invalidate state no matter the name
    // of collection and return initial state.
    if (action.type === COLLECTION_INVALIDATE) {
      return [];
    }

    // Only if the tag in the action is the same as the one on the collection reducer
    if (_.get(action, 'meta.tag') !== tag) {
      return state;
    }

    switch (action.type) {
      case COLLECTION_FETCHED:
        return action.payload.map(item => item.id);
      default:
        return state;
    }
  };
