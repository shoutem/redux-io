import _ from 'lodash';
import {
  REFERENCE_FETCHED,
  REFERENCE_STATUS,
  REFERENCE_CLEAR,
} from './middleware';
import {
  STATUS,
  validationStatus,
  busyStatus,
  createStatus,
  updateStatus,
} from './status';

function isValid(action, schema, tag) {
  if (_.get(action, 'meta.schema') !== schema) {
    return false;
  }

  // Only if the tag in the action is the same as the one on the collection reducer
  if (_.get(action, 'meta.tag') !== tag) {
    // Every collection should change status if action is type of REFERENCE_STATUS
    // and action meta tag is broadcast
    if (action.type === REFERENCE_STATUS && _.get(action, 'meta.tag') === '*') {
      return true;
    }
    return false;
  }

  return true;
}

// single is generic single reducer that enables creating
// typed & named single index reducers that are handling specific
// type actions with specific collection name.
export default function single(schema, tag, initialValue = '') {
  if (tag === '*') {
    throw new Error('Tag value \'*\' is reserved for redux-api-state and cannot be used.');
  }
  // eslint-disable-next-line no-param-reassign
  const initialState = {
    value: initialValue,
    [STATUS]: createStatus(),
  };
  return (state = initialState, action) => {
    if (!isValid(action, schema, tag)) {
      return state;
    }

    switch (action.type) {
      case REFERENCE_FETCHED: {
        return {
          value: action.payload[0] ? action.payload[0].id : initialValue,
          [STATUS]: updateStatus(
            state[STATUS],
            {
              validationStatus: validationStatus.VALID,
              busyStatus: busyStatus.IDLE,
              error: false,
            }
          ),
        };
      }
      case REFERENCE_CLEAR: {
        return {
          value: initialValue,
          [STATUS]: updateStatus(
            state[STATUS],
            {
              validationStatus: validationStatus.VALID,
              busyStatus: busyStatus.IDLE,
              error: false,
            }
          ),
        };
      }
      case REFERENCE_STATUS: {
        return {
          value: state.value,
          [STATUS]: updateStatus(
            state[STATUS],
            action.payload
          ),
        };
      }
      default: {
        if (state[STATUS]) {
          return state;
        }
        return {
          value: state.value ? state.value : initialValue,
          [STATUS]: createStatus(),
        };
      }
    }
  };
}
