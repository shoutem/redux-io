import _ from 'lodash';
import { TYPE_KEY, ARRAY_TYPE } from './type';
import { getStatus, STATUS } from '../status';

function arrayToObject(arr, initialAttributes = {}) {
  return {
    ...initialAttributes,
    // Destructed to lose non enumerable properties
    // Non enumerable properties should be copied elsewhere
    arr: [...arr],
  };
}

/**
 * Save RIO STATUS as enumerable property
 * from which can be restored.
 * @param substate
 * @param serializableState
 */
function saveStatus(originalState, serializableState) {
  const status = getStatus(originalState);
  if (status) {
    serializableState[STATUS] = status;
  }
}

/**
 * Creates deep copy of given substate and saves
 * transformation related data (type).
 * @param originalSubState
 * @returns {*}
 */
function transformSubstate(originalSubState) {
  if (_.isPlainObject(originalSubState)) {
    return toSerializableFormat(originalSubState);
  } else if (_.isArray(originalSubState) && originalSubState[STATUS]) {
    // Used for collections
    // Transform array into structure that reverse transformation expects
    // JSON.stringify does not know how to stringify array attributes
    return arrayToObject(originalSubState, { [TYPE_KEY]: ARRAY_TYPE });
  }
  return originalSubState;
}

/**
 * Transform state so it can be stringified.
 * Saves STATUS as enumerable property and transforms arrays into "array objects".
 * @param state
 * @returns {*}
 */
export function toSerializableFormat(state) {
  return _.reduce(state, (serializableState, substate, subStateKey) => {
    const serializableSubState = transformSubstate(substate);

    // Status is not enumerable property so we have take care for it separately
    saveStatus(substate, serializableSubState);

    serializableState[subStateKey] = serializableSubState;
    return serializableState;
  }, {});
}
