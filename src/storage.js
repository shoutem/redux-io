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
    if (!_.isObject(item)) {
      return state;
    }
    if (!_.has(item, 'id')) {
      return state;
    }

    const currentStatus = (state[item.id] && state[item.id][STATUS])
      ? state[item.id][STATUS] : createStatus();
    switch (action.type) {
      case OBJECT_UPDATING: {
        const newItem = _.merge({}, state[item.id], item);
        newItem[STATUS] = updateStatus(
          currentStatus,
          {
            validationStatus: validationStatus.INVALID,
            busyStatus: busyStatus.BUSY,
            transformation: action.meta.transformation,
          }
        );
        return { ...state, [item.id]: newItem};
      }
      case OBJECT_FETCHED:
      case OBJECT_CREATED:
      case OBJECT_UPDATED: {
        item[STATUS] = updateStatus(
          currentStatus,
          {
            validationStatus: validationStatus.VALID,
            busyStatus: busyStatus.IDLE,
            transformation: action.meta.transformation,
          }
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
