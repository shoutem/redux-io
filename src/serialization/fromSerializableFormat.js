import _ from 'lodash';
import { STATUS_KEY, TYPE_KEY, ARRAY_TYPE } from './type';
import { setStatus, STATUS } from '../status';

function objectToArray(object) {
  return object.arr;
}

/**
 * Restore RIO STATUS to transformed subState.
 * @param serializableSubState
 * @param originalSubState
 */
function restoreStatus(serializableSubState, originalSubState) {
  const status = _.isPlainObject(serializableSubState) && serializableSubState[STATUS];
  if (status) {
    delete originalSubState[STATUS]; // Delete enumerable status
    setStatus(originalSubState, status); // Set non enumerable status
  }
}

/**
 * Creates deep copy of given substate and restores it to original form.
 * @param serializableSubState
 * @returns {*}
 */
function revertTransformedSubstate(serializableSubState) {
  if (_.isPlainObject(serializableSubState)) {
    if (serializableSubState[TYPE_KEY] === ARRAY_TYPE) {
      // Transform "array object" back to array as it was before serialization
      return objectToArray(serializableSubState);
    }
    return fromSerializableFormat(serializableSubState);
  }
  return serializableSubState;
}

/**
 * Revert trasnformed (serializable) state.
 * Main function is to transform "array objects" to arrays and restore status as it was.
 * @param serializableState
 * @returns {object} Original state
 */
export function fromSerializableFormat(serializableState) {
  return _.reduce(serializableState, (originalState, serializableSubState, subStateKey) => {
    const originalSubState = revertTransformedSubstate(serializableSubState);

    restoreStatus(serializableSubState, originalSubState);

    originalState[subStateKey] = originalSubState;
    return originalState;
  }, {});
}
