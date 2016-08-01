import _ from 'lodash';

export const STATUS = '@@redux-api-state/status';

export const validationStatus = Object.freeze({
  NONE: 'none',
  INVALID: 'invalid',
  VALID: 'valid',
});

export const busyStatus = Object.freeze({
  IDLE: 'idle',
  BUSY: 'busy',
});

export const createStatus = (description = {}) => (
  {
    ...description,
    validationStatus: validationStatus.NONE,
    busyStatus: busyStatus.IDLE,
    error: false,
    modifiedTimestamp: Date.now(),
    transformation: {},
  }
);

export const updateStatus = (status, update) => (
  _.merge({}, status, update, { modifiedTimestamp: Date.now() })
);

export const setStatus = (obj, status) => {
  if (_.has(obj, STATUS)) {
    // eslint-disable-next-line no-param-reassign
    obj[STATUS] = status;
  } else {
    Object.defineProperty(obj, STATUS, {
      value: status,
      enumerable: false,
      writable: true,
    });
  }
};

export const cloneStatus = (sourceObject, destinationObject) => {
  if (!sourceObject[STATUS]) {
    return;
  }
  // eslint-disable-next-line no-param-reassign
  setStatus(destinationObject, _.merge({}, sourceObject[STATUS]));
};

function statusProp(obj, prop) {
  return _.get(obj, [STATUS, prop]);
}

export const getStatus = obj => _.get(obj, [STATUS]);

export const getTransformation = obj => statusProp(obj, 'transformation');

export const isValid = obj =>
  !!getStatus(obj) && statusProp(obj, 'validationStatus') === validationStatus.VALID;

export const isInitialized = obj =>
  !!getStatus(obj) && statusProp(obj, 'validationStatus') !== validationStatus.NONE;

export const isBusy = obj => !!(statusProp(obj, 'busyStatus') === busyStatus.BUSY);

export const getModificationTime = obj => statusProp(obj, 'modifiedTimestamp');

export const isError = obj => !!(statusProp(obj, 'error'));

export const shouldRefresh = (obj, ignoreError = false) =>
  !isValid(obj) && !isBusy(obj) && (!isError(obj) || ignoreError);

export const getId = obj => statusProp(obj, 'id');
