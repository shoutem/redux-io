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

export const applyStatus = (obj, status) => {
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
}

export const cloneStatus = (sourceObject, destinationObject) => {
  if (!sourceObject[STATUS]) {
    return;
  }
  // eslint-disable-next-line no-param-reassign
  applyStatus(destinationObject, _.merge({}, sourceObject[STATUS]));
};

export const getTransformation = obj => obj[STATUS] && obj[STATUS].transformation;

export const isValid = obj =>
  !!obj[STATUS] && obj[STATUS].validationStatus === validationStatus.VALID;

export const isInitialized = obj =>
  !!obj[STATUS] && obj[STATUS].validationStatus !== validationStatus.NONE;

export const isBusy = obj =>
  !!(obj[STATUS] && obj[STATUS].busyStatus === busyStatus.BUSY);

export const getStatus = obj => !!obj[STATUS] && obj[STATUS];

export const getModificationTime = obj => !!obj[STATUS] && obj[STATUS].modifiedTimestamp;

export const isError = obj =>
  !!(obj[STATUS] && obj[STATUS].error);

export const shouldRefresh = (obj, ignoreError = false) =>
  !isValid(obj) && !isBusy(obj) && (!isError(obj) || ignoreError);

export const getId = obj => obj[STATUS] && obj[STATUS].id;
