import _ from 'lodash';
import { TYPE_KEY, ARRAY_TYPE } from './type';
import { setStatus, STATUS } from '../status';
import traverse from 'traverse';

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
* We need to copy redux-io status from original element
* to copied element before element transformation due to
* hideen nature of redux-io status
* @param element - copied element
*/
function applyOriginalElementStatus(element) {
  const { node_: originalElement } = this;
  restoreStatus(originalElement, element);
}

/**
 * Revert transformed (serializable) state.
 * Main function is to transform "array objects" to arrays and restore status as it was.
 * @param serializableState
 * @returns {object} Original state
 */
export function fromSerializableFormat(serializableState, fullTraverse = false) {
  return traverse(serializableState).map(function (element) {
    this.after(applyOriginalElementStatus);

    if (
      _.isPlainObject(element) &&
      element[TYPE_KEY] === ARRAY_TYPE
    ) {
      const transformed = objectToArray(element);
      restoreStatus(element, transformed);
      this.update(transformed, !fullTraverse);
      return transformed;
    }
    return element;
  });
}
