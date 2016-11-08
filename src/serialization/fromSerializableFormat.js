import _ from 'lodash';
import { STATUS_KEY, TYPE_KEY, ARRAY_TYPE } from './type';
import { setStatus, STATUS } from '../status';

function objectToArray(object) {
  return object.arr;
}

/**
 * Restore RIO STATUS to transformed subState.
 * @param serializedSubstate
 * @param transformedSubstate
 */
function restoreStatus(serializedSubstate, transformedSubstate) {
  const status = _.isPlainObject(serializedSubstate) && serializedSubstate[STATUS];
  if (status) {
    delete transformedSubstate[STATUS];
    setStatus(transformedSubstate, status);
  }
}


/**
 * Creates deep copy of given substate and restores
 * serialization related data (serialization type).
 * @param substate
 * @returns {*}
 */
function transformSubstate(substate) {
  if (_.isPlainObject(substate)) {
    if (substate[TYPE_KEY] === ARRAY_TYPE) {
      // Transform "array object" back to array as it was before serialization
      return objectToArray(substate);
    }
    return fromSerializableFormat(substate);
  }
  return substate;
}

/**
 * Deserialize persisted state.
 * Main function is to transform "array objects" to arrays and restore status as it was.
 * @param state Stringifiable state
 * @returns {object} Deserialized state
 */
export function fromSerializableFormat(state) {
  return _.reduce(state, (result, substate, substateKey) => {
    let newSubstate = transformSubstate(substate);

    restoreStatus(substate, newSubstate);

    result[substateKey] = newSubstate;
    return result;
  }, {});
}
