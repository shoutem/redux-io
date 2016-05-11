export const STATUS = Symbol('status');

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
    modifiedTimestamp: Date.now(),
  }
);

export const updateStatus = (status, update) => (
  {
    ...status,
    ...update,
    modifiedTimestamp: Date.now(),
  }
);

export const isValid = obj =>
  obj[STATUS] && obj[STATUS].validationStatus === validationStatus.VALID;

export const isBusy = obj =>
  !!(obj[STATUS] && obj[STATUS].busyStatus === busyStatus.BUSY);
