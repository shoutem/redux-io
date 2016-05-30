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
  newItem[STATUS] = mergeItemStatus(
    currentItem,
    {
      validationStatus: validationStatus.INVALID,
      busyStatus: busyStatus.BUSY,
      transformation: actionMeta.transformation,
    }
  );
  return newItem;
}

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

    const currentItem = state[item.id];
    switch (action.type) {
      case OBJECT_UPDATING: {
        const patchedItem = patchItemInState(currentItem, item, action.meta);
        return { ...state, [item.id]: patchedItem };
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
