import _ from 'lodash';
import { TYPE_KEY, ARRAY_TYPE } from './type';
import { getStatus, STATUS } from '../status';

function arrayToObject(arr, initialAttributes = {}) {
  return {
    ...initialAttributes,
    arr,
  };
}

/**
 * Save RIO STATUS as enumerable property
 * from which can be restored.
 * @param substate
 * @param transformedNewSubstate
 */
function saveStatus(substate, transformedNewSubstate) {
  const status = getStatus(substate);
  if (status) {
    transformedNewSubstate[STATUS] = status;
  }
}

/**
 * Creates deep copy of given substate and saves
 * transformation related data (type).
 * @param substate
 * @returns {*}
 */
function transformSubstate(substate) {
  if (_.isPlainObject(substate)) {
    return toSerializableFormat(substate);
  } else if (_.isArray(substate)) {
    // Transform array into structure that reverse transformation expects
    // JSON.stringify does not know how to stringify array attributes
    return arrayToObject(substate, { [TYPE_KEY]: ARRAY_TYPE });
  }
  return substate;
}

/**
 * Transform state so it can be stringified.
 * Saves STATUS as enumerable property and transforms arrays into "array objects".
 * @param state
 * @returns {*}
 */
export function toSerializableFormat(state) {
  return _.reduce(state, (result, substate, substateKey) => {
    const newSubstate = transformSubstate(substate);

    // Status is not enumerable property so we have take care for it separately
    saveStatus(substate, newSubstate);

    result[substateKey] = newSubstate;
    return result;
  }, {});
}
