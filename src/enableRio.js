import _ from 'lodash';
import { enableBatching } from 'redux-batched-actions';
import rio from './rio';
import { getStatus } from './status';
import ReduxApiStateDenormalizer from './denormalizer/ReduxApiStateDenormalizer';

function traverseState(obj, path = [], paths = {}) {
  const status = getStatus(obj);
  if (status) {
    // eslint-disable-next-line no-param-reassign
    // TODO: add validation if schema path are repeating to throw warning
    paths[status.schema] = path;
    return paths;
  }

  _.forOwn(obj, (propValue, prop) => {
    if (_.isPlainObject(propValue)) {
      traverseState(propValue, [...path, prop], paths);
    } else if (_.isArray(propValue)) {
      _.forIn(propValue, (item, index) => {
        traverseState(item, [...path, index], paths);
      });
    }
  });

  return paths;
}

export function enableRio(reducer) {
  const initialState = reducer(undefined, { type: 'unknown' });
  const paths = traverseState(initialState);

  rio.setSchemaPaths(paths);
  rio.setDenormalizer(new ReduxApiStateDenormalizer());

  return enableBatching(reducer);
}

