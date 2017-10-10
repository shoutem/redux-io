import _ from 'lodash';
import { STATUS, getSchema } from '../status';

// Ignored properties are passed from store so they can not be Set
const DEFAULT_IGNORED_PROPERTIES = { id: true, type: true, [STATUS]: true };

function getDefaultJsonItemAttributeNames() {
  return [
    'id',
    'type',
  ];
}

function createNormalizedJsonItemDescription(denormalizedItem) {
  return {
    id: denormalizedItem.id,
    type: denormalizedItem.type,
    attributes: {},
    relationships: {},
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

export function normalizeItem(item, picks = null) {
  const itemSchema = getSchema(item);
  if (!_.isNull(picks)) {
    // eslint-disable-next-line no-param-reassign
    item = _.pick(item, _.union(getDefaultJsonItemAttributeNames(), picks));
  }

  return _.reduce(item, (normalizedItem, val, property) => {
    if (!itemSchema || isIgnoredProperty(property)) {
      return normalizedItem;
    }

    const relationshipItem = itemSchema.relationships[property] && val;
    if (relationshipItem) {
      if (_.isArray(relationshipItem)) {
        // eslint-disable-next-line no-param-reassign
        normalizedItem.relationships[property] = {
          data: normalizeRelationshipArray(relationshipItem),
        };
      } else if (_.isPlainObject(relationshipItem)) {
        // eslint-disable-next-line no-param-reassign
        normalizedItem.relationships[property] = {
          data: normalizeRelationshipObject(relationshipItem),
        };
      } else {
        // this should generally be case when relationship does not exists
        // if relationship is not provided (included) it is little bit tricky NOW..
        // eslint-disable-next-line no-param-reassign
        normalizedItem.relationships[property] = { data: null };
      }
    } else {
      // eslint-disable-next-line no-param-reassign
      normalizedItem.attributes[property] = val;
    }
    return normalizedItem;
  }, createNormalizedJsonItemDescription(item));
}

export function normalizeCollection(collection, picks = null) {
  return collection.map(item => normalizeItem(item, picks));
}

