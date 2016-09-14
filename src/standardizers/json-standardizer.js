import _ from 'lodash';
import { normalize } from 'normalizr';
import EntitySchema from './../../node_modules/normalizr/lib/EntitySchema';
import IterableSchema from './../../node_modules/normalizr/lib/IterableSchema';
import UnionSchema from './../../node_modules/normalizr/lib/UnionSchema';

export const JSON_SOURCE = 'json';

export function transform(object, schemaDefinition) {

  // info about relationships
  // use it to define transformationDescription.relationshipProperties
  // and to add into normalized data correct type
  const relationships = _.pickBy(schemaDefinition, prop => {
    if (prop instanceof EntitySchema) {
      return true;
    }
    if (prop instanceof IterableSchema) {
      return true;
    }
    if (prop instanceof UnionSchema) {
      return true;
    }
    return false;
  });

  const normalizedData = normalize(object, schemaDefinition);

  // from normalized data
  // extract root object as single or array --> add to data
  const schema = schemaDefinition['_key'];
  const index = _.isObject(normalizedData.result) ?
    normalizedData.result[schema] :
    [normalizedData.result];
  const data = index.map(id => {
    const item = normalizedData.entities[schema][id];
    return { ...item, type: schema };
  });

  // extract other objects --> included
  const included = _.reduce(normalizedData.entities, (items, value, key) => {
    if (key === schema) {
      return items;
    }

    const values = _.values(value);
    const newItems = _.map(values, item => ({ ...item, type: key }));
    return [...items, ...newItems];
  }, []);

  if (!_.has(object, 'relationships')) {
    return {
      transformationDescription: {},
      transformedObject: {
        data,
        included,
      },
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
