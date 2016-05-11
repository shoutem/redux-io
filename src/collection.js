import _ from 'lodash';
import {
  COLLECTION_FETCHED,
  COLLECTION_STATUS,
} from './middleware';
import {
  STATUS,
  validationStatus,
  busyStatus,
  createStatus,
  updateStatus,
} from './status';

export const COLLECTION_CLEAR = '@@redux_api_state/COLLECTION_CLEAR';

// collection is generic collection reducer that enables creating
// typed & named collection reducers that are handling specific
// COLLECTION_ type actions with specific collection name.
export default function collection(schema, tag, initialState = []) {
  // eslint-disable-next-line no-param-reassign
  initialState[STATUS] = createStatus();
  return (state = initialState, action) => {
    if (_.get(action, 'meta.schema') !== schema) {
      return state;
    }

    // Every collection should change status if action is type of COLLECTION_STATUS
    // and action meta is broadcast
    if (action.type === COLLECTION_STATUS && _.get(action, 'meta.broadcast')) {
      const newState = [...state];
      newState[STATUS] = updateStatus(
        state[STATUS],
        action.payload
      );
      return newState;
    }

    // Only if the tag in the action is the same as the one on the collection reducer
    if (_.get(action, 'meta.tag') !== tag) {
      return state;
    }

    switch (action.type) {
      case COLLECTION_FETCHED: {
        const newState = action.payload.map(item => item.id);
        newState[STATUS] = updateStatus(
          state[STATUS],
          { validationStatus: validationStatus.VALID, busyStatus: busyStatus.IDLE }
        );
        return newState;
      }
      case COLLECTION_CLEAR: {
        const newState = [];
        newState[STATUS] = updateStatus(
          state[STATUS],
          { validationStatus: validationStatus.VALID, busyStatus: busyStatus.IDLE }
        );
        return newState;
      }
      case COLLECTION_STATUS: {
        const newState = [...state];
        newState[STATUS] = updateStatus(
          state[STATUS],
          action.payload
        );
        return newState;
      }
      default: {
        if (state[STATUS]) {
          return state;
        }
        const newState = [...state];
        newState[STATUS] = createStatus();
        return newState;
      }
    }
  };
}
