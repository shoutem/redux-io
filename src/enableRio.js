import _ from 'lodash';
import { enableBatching } from 'redux-batched-actions';
import rio from './rio';
import { getStatus } from './status';
import ReduxApiStateDenormalizer from './denormalizer/ReduxApiStateDenormalizer';
import { STORAGE_TYPE } from './reducers/storage';

function discoverSchemaPaths(obj, currentPath = [], discoveredPaths = {}) {
  const status = getStatus(obj);
  if (status && status.type === STORAGE_TYPE) {
    // TODO: add validation if schema path are repeating to throw warning
    // eslint-disable-next-line no-param-reassign
    discoveredPaths[status.schema] = currentPath;
    return discoveredPaths;
  }

  _.forOwn(obj, (propValue, prop) => {
    if (_.isPlainObject(propValue)) {
      discoverSchemaPaths(propValue, [...currentPath, prop], discoveredPaths);
    }
  });

  return discoveredPaths;
}

export function enableRio(reducer) {
  const initialState = reducer(undefined, { type: 'unknown' });
  const paths = discoverSchemaPaths(initialState);

  rio.setSchemaPaths(paths);
  rio.setDenormalizer(new ReduxApiStateDenormalizer());

  return enableBatching(reducer);
}

