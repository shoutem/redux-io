import _ from 'lodash';

export function transform(object) {
  if (!_.has(object, 'relationships')) {
    return {
      transformationDescription: {},
      transformedObject: _.cloneDeep(object),
    };
  }

  const keys = _.keys(object.relationships);
  return {
    transformationDescription: {
      relationshipProperties: _.keyBy(keys),
    },
    transformedObject: _.cloneDeep(object),
  };
}

export function inverse(transformedObject, transformationDescription) {
  // TODO: support inverse transformations based on transformation description
  return transformedObject;
}
