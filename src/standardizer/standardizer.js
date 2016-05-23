import _ from 'lodash';

export function transform(object) {
  if (!_.has(object, 'relationships')) {
    return {
      transformation: {},
      object,
    };
  }

  const keys = _.keys(object.relationships);
  return {
    transformation: _.keyBy(keys),
    object,
  };
}

export function inverse(object) {
  return object;
}
