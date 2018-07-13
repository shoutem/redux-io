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

const DEFAULT_OPTIONS = {
  keepExistingPaths: false,
  useModificationCache: true,
  cacheChildObjects: false,
};

export function enableRio(reducer, options = {}) {
  const resolvedOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const initialState = reducer(undefined, { type: 'unknown' });
  const paths = discoverSchemaPaths(initialState);

  if (resolvedOptions.keepExistingPaths) {
    rio.appendResourcePaths(paths);
  } else {
    rio.setResourcePaths(paths);
  }

  const { useModificationCache, defaultMaxDepth, cacheChildObjects } = resolvedOptions;

  const denormalizerOptions = {
    useModificationCache,
    defaultMaxDepth,
    cacheChildObjects,
  };
  rio.setDenormalizer(new ReduxApiStateDenormalizer(null, null, denormalizerOptions));

  return enableBatching(reducer);
}
