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
    // eslint-disable-next-line no-param-reassign
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
  if (_.isArray(originalSubState) && originalSubState[STATUS]) {
    // Transform array into format that reverse transformation expects.
    // JSON.stringify only serialize array items, it does not serialize
    // additional array properties, this is used to save those properties.
    // It is important because RIO adds STATUS property to collections.
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
  if (!_.isObjectLike(state)) {
    return state;
  }

  const transformedState = transformSubstate(state);
  const accumulator = _.isArray(transformedState) ? [] : {};
  saveStatus(state, accumulator);

  return _.reduce(transformedState, (serializableState, substate, subStateKey) => {
    const serializableSubState = toSerializableFormat(substate);

    // eslint-disable-next-line no-param-reassign
    serializableState[subStateKey] = serializableSubState;
    return serializableState;
  }, accumulator);
}
