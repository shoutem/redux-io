import _ from 'lodash';
import { LOAD_SUCCESS, UPDATE_SUCCESS, CREATE_SUCCESS } from '../consts';
import rio from '../rio';
import { JSON_API_SOURCE } from '../standardizers/json-api-standardizer';

function isValidAction(action) {
  if (
    action.type !== LOAD_SUCCESS &&
    action.type !== UPDATE_SUCCESS &&
    action.type !== CREATE_SUCCESS
  ) {
    // we are not responsible for handling action
    return false;
  }

  // Check for meta object in action
  if (action.meta === undefined) {
    console.error('Meta is undefined.');
    return false;
  }

  const meta = action.meta;
  // Check if source exists
  if (meta.source !== 'json') {
    return false;
  }

  // Check that schema is defined
  const { schema } = meta;
  if (!schema) {
    console.error('Action.meta.schema is undefined.');
    return false;
  }

  // Check if resource is defined with serializer schema
  const resource = rio.getResource(schema);
  if (!resource || !resource.serializer) {
    console.error('Serializer for schema is not defined.');
    return false;
  }

  return true;
}

function getItem(reference, entities) {
  const { id, type } = reference;
  return _.get(entities, [type, id]);
}

export default () => next => action => {
  // Validate action, if not valid pass
  if (!isValidAction(action)) {
    return next(action);
  }

  const { meta, payload } = action;

  if (!payload) {
    return next(action);
  }

  const { schema } = meta;
  const resource = rio.getResource(schema);

  const { serializer } = resource;
  const deserializedPayload = serializer.deserialize(payload);

  // transform deserializedData result into json-api payload with
  // data and included properties
  const { result, entities } = deserializedPayload;
  const isArray = _.isArray(result);
  const data = !isArray
    ? getItem(result, entities)
    : _.map(result, resultItem => getItem(resultItem, entities));

  const dataEntityReferences = [].concat(result);
  const included = _.reduce(
    entities,
    (acc, schemaEntities) => {
      const nonDataEntities = _.differenceWith(
        _.toArray(schemaEntities),
        dataEntityReferences,
        (a, b) => a.id === b.id && a.type === b.type,
      );
      acc.push(...nonDataEntities);
      return acc;
    },
    [],
  );

  const jsonApiPayload = {
    data,
    included,
  };

  const jsonApiAction = {
    ...action,
    meta: {
      ...action.meta,
      source: JSON_API_SOURCE,
    },
    payload: jsonApiPayload,
  };

  // After middleware handled action pass input action to next
  return next(jsonApiAction);
};
