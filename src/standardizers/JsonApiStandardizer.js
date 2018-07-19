import _ from 'lodash';

function resolveRelationshipType(relationship) {
  const data = _.get(relationship, 'data');
  const path = _.isArray(data) ? 'data.0.type' : 'data.type';

  return {
    type: _.get(relationship, path),
  };
}

function resolveType(object) {
  return _.get(object, 'type');
}

export default class JsonApiStandardizer {
  transform(object) {
    if (!_.has(object, 'relationships')) {
      return {
        schema: {},
        object: _.cloneDeep(object),
      };
    }

    const relationships = _.mapValues(object.relationships, resolveRelationshipType);

    return {
      schema: {
        relationships,
        type: resolveType(object),
      },
      object: _.cloneDeep(object),
    };
  }

  // eslint-disable-next-line no-unused-vars
  inverse(object, schema) {
    // TODO: support inverse transformations based on transformation description
    return object;
  }
}
