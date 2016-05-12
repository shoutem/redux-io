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
import {
  CONTEXT,
  Context,
  stateContextPropExists
} from './context';

export const COLLECTION_CLEAR = '@@redux_api_state/COLLECTION_CLEAR';
export const COLLECTION_EXTENDED = '@@redux_api_state/COLLECTION_EXTENDED';

function isValid(action, schema, tag) {
  if (_.get(action, 'meta.schema') !== schema) {
    return false;
  }

  // Only if the tag in the action is the same as the one on the collection reducer
  if (_.get(action, 'meta.tag') !== tag) {
    // Every collection should change status if action is type of COLLECTION_STATUS
    // and action meta tag is broadcast
    if (action.type === COLLECTION_STATUS && _.get(action, 'meta.tag') === '*') {
      return true;
    }
    return false;
  }

  return true;
}

// collection is generic collection reducer that enables creating
// typed & named collection reducers that are handling specific
// COLLECTION_ type actions with specific collection name.
export default function collection(schema, tag, initialState = []) {
  if (tag === '*') {
    throw new Error('Tag value \'*\' is reserved for redux-api-state and cannot be used.');
  }
  // eslint-disable-next-line no-param-reassign
  initialState[CONTEXT] = {
    [STATUS]: createStatus(),
  };
  return (state = initialState, action) => {
    if (!isValid(action, schema, tag)) {
      return state;
    }
    const context = new Context(state);

    switch (action.type) {
      case COLLECTION_FETCHED: {
        const newState = action.payload.map(item => item.id);
        return context.updateStateContextProp(
          newState,
          STATUS,
          { validationStatus: validationStatus.VALID, busyStatus: busyStatus.IDLE }
        );
      }
      case COLLECTION_EXTENDED: {
        const newState = [...state, ...action.payload];
        newState[STATUS] = updateStatus(
          state[STATUS],
          { validationStatus: validationStatus.VALID, busyStatus: busyStatus.IDLE }
        );
        return newState;
      }
      case COLLECTION_CLEAR: {
        const newState = [];
        return context.updateStateContextProp(
          newState,
          STATUS,
          { validationStatus: validationStatus.VALID, busyStatus: busyStatus.IDLE }
        );
      }
      case COLLECTION_STATUS: {
        const newState = [...state];
        return context.updateStateContextProp(
          newState,
          STATUS,
          action.payload
        );
      }
      default: {
        if (stateContextPropExists(state, STATUS)) {
          return state;
        }
        const newState = [...state];
        return context.createStateContextProp(newState, STATUS, createStatus());
      }
    }
  };
}
