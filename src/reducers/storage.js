import _ from 'lodash';
import {
  OBJECT_FETCHED,
  OBJECT_CREATED,
  OBJECT_UPDATING,
  OBJECT_UPDATED,
  OBJECT_REMOVING,
  OBJECT_REMOVED,
} from '../consts';
import {
  STATUS,
  validationStatus,
  busyStatus,
  createStatus,
  updateStatus,
  setStatus,
  cloneStatus,
} from '../status';

export const STORAGE_TYPE = '@@redux-io/storage';

function mergeItemStatus(currentItem, newStatus) {
  const currentStatus = (currentItem && currentItem[STATUS])
    ? currentItem[STATUS] : createStatus();

  return updateStatus(
    currentStatus,
    newStatus
  );
}

function patchItemInState(currentItem, patch) {
  const newItem = {
    id: currentItem.id,
    type: currentItem.type,
    attributes: {
      ...currentItem.attributes,
      ...patch.attributes,
    },
    relationships: {
      ...currentItem.relationships,
      ...patch.relationships,
    },
  };
  cloneStatus(currentItem, newItem);
  return newItem;
}

function createDefaultStatus(schema) {
  return {
    schema,
    type: STORAGE_TYPE,
    id: _.uniqueId(),
  };
}

/**
 * Storage is generic storage reducer that enables creation of typed storage
 * reducers that are handling specific OBJECT_ type actions. Holds instnaces
 * of objects in normalized state.
 * @param schema is name of schema that describes data for which reducer
 * is responsible and will process rio actions with same schema defined.
 * @param initialState is initial state of reducer, can be array or object.
 * @returns {Function}
 */
export default function storage(schema, initialState = {}) {
  // eslint-disable-next-line no-param-reassign
  setStatus(initialState, createDefaultStatus(schema));

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

    const currentItem = state[item.id];
    switch (action.type) {
      case OBJECT_UPDATING: {
        if (!currentItem) {
          return state;
        }
        const patchedItem = patchItemInState(currentItem, item);
        setStatus(patchedItem, mergeItemStatus(
          currentItem,
          {
            validationStatus: validationStatus.INVALID,
            busyStatus: busyStatus.BUSY,
            transformation: action.meta.transformation,
          }
        ));
        const newState = { ...state, [item.id]: patchedItem };
        cloneStatus(state, newState);
        return newState;
      }
      case OBJECT_FETCHED:
      case OBJECT_CREATED:
      case OBJECT_UPDATED: {
        setStatus(item, mergeItemStatus(
          currentItem,
          {
            validationStatus: validationStatus.VALID,
            busyStatus: busyStatus.IDLE,
            transformation: action.meta.transformation,
          }
        ));
        const newState = { ...state, [item.id]: item };
        cloneStatus(state, newState);
        return newState;
      }
      case OBJECT_REMOVING: {
        const newItem = { ...currentItem };
        setStatus(newItem, mergeItemStatus(
          currentItem,
          {
            validationStatus: validationStatus.INVALID,
            busyStatus: busyStatus.BUSY,
          }
        ));
        const newState = { ...state, [newItem.id]: newItem };
        cloneStatus(state, newState);
        return newState;
      }
      case OBJECT_REMOVED: {
        const newState = { ...state };
        delete newState[item.id];
        cloneStatus(state, newState);
        return newState;
      }
      default: {
        if (state[STATUS]) {
          return state;
        }
        const newState = { ...state };
        setStatus(state, createDefaultStatus(schema));
        return newState;
      }
    }
  };
}
