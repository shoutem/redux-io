import _ from 'lodash';
import {
  OBJECT_FETCHED,
  OBJECT_CREATED,
  OBJECT_UPDATED,
  OBJECT_REMOVED,
} from './middleware';

// storage is generic storage reducer that enables creation
// of typed storage reducers that are handling specific
// OBJECT_ type actions.
export default (schema, initialState = {}) =>
  (state = initialState, action) => {
    if (_.get(action, 'meta.schema') !== schema) {
      return state;
    }
    const item = action.payload;
    switch (action.type) {
      case OBJECT_FETCHED:
      case OBJECT_CREATED:
      case OBJECT_UPDATED:
        return { ...state, [item.id]: item };
      case OBJECT_REMOVED: {
        const newState = { ...state };
        delete newState[item.id];
        return newState;
      }
      default:
        return state;
    }
  };
