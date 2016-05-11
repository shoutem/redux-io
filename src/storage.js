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
  createStatus,
  updateStatus,
} from './status';

// storage is generic storage reducer that enables creation
// of typed storage reducers that are handling specific
// OBJECT_ type actions.
export default function storage(schema, initialState = {}) {
  return (state = initialState, action) => {
    if (_.get(action, 'meta.schema') !== schema) {
      return state;
    }
    const item = action.payload;
    const status = state[item.id] ? state[item.id][STATUS] : createStatus();
    switch (action.type) {
      case OBJECT_UPDATING: {
        item[STATUS] = updateStatus(
          status,
          { validationStatus: validationStatus.INVALID, busyStatus: busyStatus.BUSY }
        );
        return { ...state, [item.id]: item };
      }
      case OBJECT_FETCHED:
      case OBJECT_CREATED:
      case OBJECT_UPDATED: {
        item[STATUS] = updateStatus(
          status,
          { validationStatus: validationStatus.VALID, busyStatus: busyStatus.IDLE }
        );
        return { ...state, [item.id]: item };
      }
      case OBJECT_REMOVING:
      case OBJECT_REMOVED: {
        const newState = { ...state };
        delete newState[item.id];
        return newState;
      }
      default:
        return state;
    }
  };
}
