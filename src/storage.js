import _ from 'lodash';
import {
  OBJECTS_FETCHED,
  OBJECTS_CREATED,
  OBJECTS_UPDATING,
  OBJECTS_UPDATED,
  OBJECTS_REMOVING,
  OBJECTS_REMOVED,
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
    const items = action.payload;
    if (!_.isArray(items)) {
      console.log('failed2');
      return state;
    }
    if (_.some(items, item => !_.has(item, 'id'))) {
      console.log('failed');
      return state;
    }

    switch (action.type) {
      case OBJECTS_UPDATING: {
        const newItems = _.keyBy(items, 'id');
        _.forEach(newItems, item => {
          // eslint-disable-next-line no-param-reassign
          item[STATUS] = updateStatus(
            state[item.id] ? state[item.id][STATUS] : createStatus(),
            { validationStatus: validationStatus.INVALID, busyStatus: busyStatus.BUSY }
          );
        });
        return { ...state, ...newItems };
      }
      case OBJECTS_FETCHED:
      case OBJECTS_CREATED:
      case OBJECTS_UPDATED: {
        const newItems = _.keyBy(items, 'id');
        _.forEach(newItems, item => {
          // eslint-disable-next-line no-param-reassign
          item[STATUS] = updateStatus(
            state[item.id] ? state[item.id][STATUS] : createStatus(),
            { validationStatus: validationStatus.VALID, busyStatus: busyStatus.IDLE }
          );
        });
        const i = { ...state, ...newItems };
        console.log(i);
        return i;
      }
      case OBJECTS_REMOVING:
      case OBJECTS_REMOVED: {
        const newState = { ...state };
        _.forEach(items, item => delete newState[item.id]);
        return newState;
      }
      default:
        return state;
    }
  };
}
