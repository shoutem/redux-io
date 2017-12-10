import {
  LOAD_SUCCESS,
  UPDATE_SUCCESS,
  CREATE_SUCCESS,
} from '../consts';
import rio from '../rio';

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

  // Source value exists but check if rio support standardization of such source type
  if (!rio.getStandardizer(meta.source)) {
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

export default store => next => action => {
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
  const jsonApiPayload = serializer.deserialize(payload);

  // TODO: transform deserilizae result into json-api payload with included and data
  const jsonApiAction = {
    ...action,
    payload: jsonApiPayload,
  };

  // After middleware handled action pass input action to next
  return next(jsonApiAction);
};
