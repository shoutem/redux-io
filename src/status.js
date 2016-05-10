export const STATUS = Symbol('status');

export const validationStatus = {
  NONE: 0,
  INVALID: 1,
  VALID: 2,
};

export const busyStatus = {
  IDLE: 0,
  BUSY: 1,
};

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

export const isValid = obj => {
  if (obj[STATUS] && obj[STATUS].validationStatus === validationStatus.VALID) {
    return true;
  }
  return false;
};

export const isBusy = obj => {
  if (obj[STATUS] && obj[STATUS].busyStatus === busyStatus.BUSY) {
    return true;
  }
  return false;
};
