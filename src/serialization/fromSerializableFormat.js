import _ from 'lodash';
import { TYPE_KEY, ARRAY_TYPE } from './type';
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
  if (!status) {
    return;
  }

  // eslint-disable-next-line no-param-reassign
  delete originalSubState[STATUS]; // Delete enumerable status
  setStatus(originalSubState, status); // Set non enumerable status
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
    // eslint-disable-next-line no-use-before-define
    return fromSerializableFormat(serializableSubState);
  } else if (_.isArray(serializableSubState)) {
    // eslint-disable-next-line no-use-before-define
    return fromSerializableFormat(serializableSubState);
  }
  return serializableSubState;
}

/**
 * Revert transformed (serializable) state.
 * Main function is to transform "array objects" to arrays and restore status as it was.
 * @param serializableState
 * @returns {object} Original state
 */
export function fromSerializableFormat(serializableState) {
  let serializableState2 = serializableState;
  if (_.isPlainObject(serializableState)) {
    if (serializableState[TYPE_KEY] === ARRAY_TYPE) {
      // Transform "array object" back to array as it was before serialization
      serializableState2 = objectToArray(serializableState);
      restoreStatus(serializableState, serializableState2);
    }
  }

  const accumulator = _.isArray(serializableState2) ? [] : {};
  restoreStatus(serializableState, accumulator);

  return _.reduce(serializableState2, (originalState, serializableSubState, subStateKey) => {
    const originalSubState = revertTransformedSubstate(serializableSubState);

    restoreStatus(serializableSubState, originalSubState);

    // eslint-disable-next-line no-param-reassign
    originalState[subStateKey] = originalSubState;
    return originalState;
  }, accumulator);
}
