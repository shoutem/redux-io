import _ from 'lodash';
import { STATUS_KEY, TYPE_KEY, ARRAY_TYPE } from './type';
import { setStatus, STATUS } from '../status';

function objectToArray(object) {
  return object.arr;
}

/**
 * Restore RIO STATUS to transformed subState.
 * @param transformedSubstate Serializable data
 * @param revertedSubstate Originally formatted data
 */
function restoreStatus(transformedSubstate, revertedSubstate) {
  const status = _.isPlainObject(transformedSubstate) && transformedSubstate[STATUS];
  if (status) {
    delete revertedSubstate[STATUS];
    setStatus(revertedSubstate, status);
  }
}

/**
 * Creates deep copy of given substate and restores it to original form.
 * @param substate Serializable data
 * @returns {*}
 */
function revertTransformedSubstate(substate) {
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
 * Revert trasnformed (serializable) state.
 * Main function is to transform "array objects" to arrays and restore status as it was.
 * @param state Stringifiable state
 * @returns {object} Deserialized state
 */
export function fromSerializableFormat(state) {
  return _.reduce(state, (result, substate, substateKey) => {
    let newSubstate = revertTransformedSubstate(substate);

    restoreStatus(substate, newSubstate);

    result[substateKey] = newSubstate;
    return result;
  }, {});
}
