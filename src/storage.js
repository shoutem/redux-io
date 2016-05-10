import _ from 'lodash';
import {
  OBJECT_FETCHED,
  OBJECT_CREATED,
  OBJECT_UPDATING,
  OBJECT_UPDATED,
  OBJECT_REMOVING,
  OBJECT_REMOVED,
} from './middleware';
import {
  STATUS,
  validationStatus,
  busyStatus,
  updateStatus,
} from './status';

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
      case OBJECT_UPDATING: {
        item[STATUS] = updateStatus(
          {},
          { validationStatus: validationStatus.INVALID, busyStatus: busyStatus.BUSY }
        );
        const newState = { ...state, [item.id]: item };
        return newState;
      }
      case OBJECT_FETCHED:
      case OBJECT_CREATED:
      case OBJECT_UPDATED: {
        item[STATUS] = updateStatus(
          {},
          { validationStatus: validationStatus.VALID, busyStatus: busyStatus.IDLE }
        );
        const newState = { ...state, [item.id]: item };
        return newState;
      }
      case OBJECT_REMOVING: {
        const newState = { ...state };
        delete newState[item.id];
        return newState;
      }
      case OBJECT_REMOVED: {
        const newState = { ...state };
        delete newState[item.id];
        return newState;
      }
      default:
        return state;
    }
  };
