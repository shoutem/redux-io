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

export const createStatus = () => (
  {
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

export const applyStatus = (sourceObject, destinationObject) => {
  if (!sourceObject[STATUS]) {
    return;
  }
  destinationObject[STATUS] = _.merge({}, sourceObject[STATUS]);
};

export const getTransformation = obj => obj[STATUS] && obj[STATUS].transformation;

export const isValid = obj =>
  !!obj[STATUS] && obj[STATUS].validationStatus === validationStatus.VALID;

export const isInitialized = obj =>
  !!obj[STATUS] && obj[STATUS].validationStatus !== validationStatus.NONE;

export const isBusy = obj =>
  !!(obj[STATUS] && obj[STATUS].busyStatus === busyStatus.BUSY);

export const isError = obj =>
  !!(obj[STATUS] && obj[STATUS].error);

export const shouldRefresh = (obj, ignoreError = false) =>
  !isValid(obj) && !isBusy(obj) && (!isError(obj) || ignoreError);
