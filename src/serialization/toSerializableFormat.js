import _ from 'lodash';
import { TYPE_KEY, ARRAY_TYPE } from './type';
import { getStatus, hasStatus, STATUS } from '../status';
import traverse from 'traverse';

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
    // eslint-disable-next-line no-param-reassign
    serializableState[STATUS] = status;
  }
}

/**
 * Transform state so it can be stringified.
 * Saves STATUS as enumerable property and transforms arrays into "array objects".
 * @param state
 * @returns {*}
 */
export function toSerializableFormat(state, fullTraverse = false) {
  return traverse(state).map(function (element) {
    // We need to copy redux-io status from original element
    // to copied element before element transformation due to
    // hideen nature of redux-io status
    const { node_: originalElement } = this;
    saveStatus(originalElement, element);

    if (_.isArray(element) && hasStatus(element)) {
      const transformed = arrayToObject(element, { [TYPE_KEY]: ARRAY_TYPE });
      saveStatus(element, transformed);
      this.update(transformed, !fullTraverse);
      return transformed;
    }

    return element;
  });
}
