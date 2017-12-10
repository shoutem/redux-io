import _ from 'lodash';
import { STATUS, getSchema } from '../status';

// Ignored properties are passed from store so they can not be Set
const DEFAULT_IGNORED_PROPERTIES = { id: true, type: true, [STATUS]: true };

function createNormalizedJsonItemDescription(denormalizedItem, schema) {
  return {
    id: denormalizedItem.id,
    type: denormalizedItem.type || _.get(schema, 'type'),
  };
}

function createRelationshipItemDescriptor(relationshipItem) {
  return { id: relationshipItem.id, type: relationshipItem.type };
}

function normalizeRelationshipArray(relationshipArray) {
  return _.reduce(relationshipArray, (result, relationshipItem) => {
    result.push(createRelationshipItemDescriptor(relationshipItem));
    return result;
  }, []);
}

function normalizeRelationshipObject(relationshipItem) {
  return createRelationshipItemDescriptor(relationshipItem);
}

function isIgnoredProperty(property, ignoredProperties = DEFAULT_IGNORED_PROPERTIES) {
  return !!ignoredProperties[property];
}

function isRelationshipLikeObject(propertyValue) {
  return (
    _.get(propertyValue, 'id') &&
    _.get(propertyValue, 'type')
  );
}

function isRelationship(schema, propertyKey, propertyValue) {
  if (_.get(schema, ['relationships', propertyKey])) {
    return true;
  }

  // TODO: use rio.options to turn off this feature
  if (isRelationshipLikeObject(propertyValue)) {
    return true;
  }

  // TODO: use rio.options to turn off this feature
  if (
    _.isArray(propertyValue) &&
    !_.isEmpty(propertyValue) &&
    _.every(propertyValue, isRelationshipLikeObject)
  ) {
    return true;
  }

  return false;
}

function resolveSchema(item, schema) {
  const itemSchema = schema || getSchema(item);
  if (itemSchema) {
    return itemSchema;
  }
  return null;
}

export function shouldNormalize(item) {
  const dataItem = _.pick(item, 'attributes', 'relationships');
  return _.isEmpty(dataItem);
}

export function normalizeItem(item, schema = null) {
  if (!shouldNormalize(item)) {
    return item;
  }

  const resolvedSchema = resolveSchema(item, schema);

  return _.reduce(item, (normalizedItem, propertyValue, propertyKey) => {
    if (isIgnoredProperty(propertyKey)) {
      return normalizedItem;
    }

    if (isRelationship(resolvedSchema, propertyKey, propertyValue)) {
      if (_.isArray(propertyValue)) {
        const data = normalizeRelationshipArray(propertyValue);
        _.set(normalizedItem, ['relationships', propertyKey], { data });
      } else if (_.isPlainObject(propertyValue)) {
        const data = normalizeRelationshipObject(propertyValue);
        _.set(normalizedItem, ['relationships', propertyKey], { data });
      } else {
        _.set(normalizedItem, ['relationships', propertyKey], { data: null });
      }
    } else {
      _.set(normalizedItem, ['attributes', propertyKey], propertyValue);
    }
    return normalizedItem;
  }, createNormalizedJsonItemDescription(item, resolvedSchema));
}

export function normalizeCollection(collection, schema = null) {
  return collection.map(item => normalizeItem(item, schema));
}

export function normalize(object, schema = null) {
  if (_.isArray(object)) {
    return normalizeCollection(object, schema);
  }

  return normalizeItem(object, schema);
}
