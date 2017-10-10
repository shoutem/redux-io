import _ from 'lodash';
import { enableBatching } from 'redux-batched-actions';
import rio from './rio';
import { getStatus } from './status';
import ReduxApiStateDenormalizer from './denormalizer/ReduxApiStateDenormalizer';
import { STORAGE_TYPE } from './reducers/storage';

function discoverSchemaPaths(state, currentPath = [], discoveredPaths = {}) {
  const status = getStatus(state);
  if (status && status.type === STORAGE_TYPE) {
    // TODO: add validation if schema path are repeating to throw warning
    // eslint-disable-next-line no-param-reassign
    discoveredPaths[status.schema] = currentPath;
    return discoveredPaths;
  }

  _.forOwn(state, (substate, prop) => {
    if (!_.isPlainObject(substate)) {
      return;
    }

    discoverSchemaPaths(
      substate,
      [...currentPath, prop],
      discoveredPaths
    );
  });

  return discoveredPaths;
}

export function enableRio(reducer, keepExistingPaths = false) {
  const initialState = reducer(undefined, { type: 'unknown' });
  const paths = discoverSchemaPaths(initialState);

  rio.setResourcePaths(paths, keepExistingPaths);
  rio.setDenormalizer(new ReduxApiStateDenormalizer());

  return enableBatching(reducer);
}

