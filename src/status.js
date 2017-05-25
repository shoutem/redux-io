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

export const updateStatus = (status, update, markChange = true) => {
  const timestamp = markChange ? { modifiedTimestamp: Date.now() } : {};
  return _.merge({}, status, update, timestamp);
};

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

export const cloneStatus = (sourceObject, destinationObject, markChange = false) => {
  if (!sourceObject[STATUS]) {
    return;
  }
  setStatus(destinationObject, updateStatus(sourceObject[STATUS], {}, markChange));
};

function statusProp(obj, prop) {
  const propPath = _.isArray(prop) ? prop : [prop];
  return _.get(obj, [STATUS, ...propPath]);
}

export const getStatus = obj => _.get(obj, [STATUS]);

export const hasStatus = obj => _.has(obj, [STATUS]);

export const getTransformation = obj => statusProp(obj, 'transformation');

export const isValid = obj =>
  !!getStatus(obj) && statusProp(obj, 'validationStatus') === validationStatus.VALID;

export const isInitialized = obj =>
  !!getStatus(obj) && statusProp(obj, 'validationStatus') !== validationStatus.NONE;

export const isBusy = obj => !!(statusProp(obj, 'busyStatus') === busyStatus.BUSY);

export const getModificationTime = obj => statusProp(obj, 'modifiedTimestamp');

export const isError = obj => !!(statusProp(obj, 'error'));

export function isExpired(reference) {
  const status = getStatus(reference);
  if (!status) {
    return false;
  }

  const { expirationTime, modifiedTimestamp } = status;
  if (!expirationTime) {
    return false;
  }

  const referenceLifetime = Date.now() - modifiedTimestamp;
  // TODO: When `expiration` becomes rio plugin, save milliseconds in
  // the status to avoid conversation
  return expirationTime * 1000 < referenceLifetime;
}

export const shouldRefresh = (obj, ignoreError = false) => (
  (!isValid(obj) || isExpired(obj)) && !isBusy(obj) && (!isError(obj) || ignoreError)
);

export const getId = obj => statusProp(obj, 'id');

export const hasNext = obj => !!statusProp(obj, ['links', 'next']);

/**
 * Checks whether a load is needed for selected propName on given set of new and current props.
 * @param nextProps New props
 * @param props Current props
 * @param propName Prop to check
 * @param ignoreError flag indicating whether shouldRefresh function returns 'true' for
 * objects in error
 */
export const shouldLoad = (nextProps, props, propName, ignoreError = false) => {
  if (!nextProps || !propName) {
    throw Error('Invalid shouldLoad call. Check provided arguments.');
  }

  const prop = _.get(props, propName);
  const nextProp = _.get(nextProps, propName);

  // if both props point to same object, nothing has changed
  if (nextProp && nextProp === prop) {
    return false;
  }

  // finally check whether refresh is needed
  return shouldRefresh(nextProp, ignoreError);
};
