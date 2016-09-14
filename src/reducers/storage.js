import _ from 'lodash';
import {
  OBJECT_FETCHED,
  OBJECT_CREATED,
  OBJECT_UPDATING,
  OBJECT_UPDATED,
  OBJECT_REMOVING,
  OBJECT_REMOVED,
} from './../middleware';
import {
  STATUS,
  validationStatus,
  busyStatus,
  createStatus,
  updateStatus,
  setStatus,
  cloneStatus,
} from './../status';

function mergeItemStatus(currentItem, newStatus) {
  const currentStatus = (currentItem && currentItem[STATUS])
    ? currentItem[STATUS] : createStatus();

  return updateStatus(
    currentStatus,
    newStatus
  );
}

function patchItemInState(currentItem, patch, actionMeta) {
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
  setStatus(newItem, mergeItemStatus(
    currentItem,
    {
      validationStatus: validationStatus.INVALID,
      busyStatus: busyStatus.BUSY,
      transformation: actionMeta.transformation,
    }
  ));
  return newItem;
}

function createDefaultStatus(schema) {
  return {
    schema,
    type: 'storage',
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
        const patchedItem = patchItemInState(currentItem, item, action.meta);
        const newState = { ...state, [item.id]: patchedItem };
        cloneStatus(newState, state);
        return newState;
      }
      case OBJECT_FETCHED:
      case OBJECT_CREATED:
      case OBJECT_UPDATED: {
        item[STATUS] = mergeItemStatus(
          currentItem,
          {
            validationStatus: validationStatus.VALID,
            busyStatus: busyStatus.IDLE,
            transformation: action.meta.transformation,
          }
        );
        const newState = { ...state, [item.id]: item };
        cloneStatus(newState, state);
        return newState;
      }
      case OBJECT_REMOVING: {
        item[STATUS] = mergeItemStatus(
          currentItem,
          {
            validationStatus: validationStatus.INVALID,
          }
        );
        const newState = { ...state, [item.id]: item };
        cloneStatus(newState, state);
        return newState;
      }
      case OBJECT_REMOVED: {
        const newState = { ...state };
        delete newState[item.id];
        cloneStatus(newState, state);
        return newState;
      }
      default: {
        if (state[STATUS]) {
          return state;
        }
        const newState = { ...state };
        cloneStatus(newState, state);
        return newState;
      }
    }
  };
}
