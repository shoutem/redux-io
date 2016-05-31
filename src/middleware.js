/* eslint-disable no-unused-expressions */
import _ from 'lodash';
import { transform } from './standardizer';
import {
  validationStatus,
  busyStatus,
} from './status';

export const CREATE_REQUEST = '@@redux_api_state/CREATE_REQUEST';
export const CREATE_SUCCESS = '@@redux_api_state/CREATE_SUCCESS';
export const CREATE_ERROR = '@@redux_api_state/CREATE_ERROR';

export const LOAD_REQUEST = '@@redux_api_state/LOAD_REQUEST';
export const LOAD_SUCCESS = '@@redux_api_state/LOAD_SUCCESS';
export const LOAD_ERROR = '@@redux_api_state/LOAD_ERROR';

export const UPDATE_REQUEST = '@@redux_api_state/UPDATE_REQUEST';
export const UPDATE_SUCCESS = '@@redux_api_state/UPDATE_SUCCESS';
export const UPDATE_ERROR = '@@redux_api_state/UPDATE_ERROR';

export const REMOVE_REQUEST = '@@redux_api_state/REMOVE_REQUEST';
export const REMOVE_SUCCESS = '@@redux_api_state/REMOVE_SUCCESS';
export const REMOVE_ERROR = '@@redux_api_state/REMOVE_ERROR';

export const COLLECTION_FETCHED = '@@redux_api_state/COLLECTION_FETCHED';
export const COLLECTION_STATUS = '@@redux_api_state/COLLECTION_STATUS';

export const OBJECT_FETCHED = '@@redux_api_state/OBJECT_FETCHED';
export const OBJECT_UPDATING = '@@redux_api_state/OBJECT_UPDATING';
export const OBJECT_UPDATED = '@@redux_api_state/OBJECT_UPDATED';
export const OBJECT_CREATED = '@@redux_api_state/OBJECT_CREATED';
export const OBJECT_REMOVING = '@@redux_api_state/OBJECT_REMOVING';
export const OBJECT_REMOVED = '@@redux_api_state/OBJECT_REMOVED';

export const OBJECT_ERROR = '@@redux_api_state/OBJECT_ERROR';
export const COLLECTION_ERROR = '@@redux_api_state/COLLECTION_ERROR';

export const middlewareJsonApiSource = '@@redux_api_state/json_api';

const actionsWithoutPayload = new Set([
  REMOVE_SUCCESS,
  LOAD_REQUEST,
  CREATE_REQUEST,
  LOAD_ERROR,
  CREATE_ERROR,
  UPDATE_ERROR,
  REMOVE_ERROR,
]);

const actionsWithTags = new Set([
  LOAD_REQUEST,
  LOAD_SUCCESS,
  LOAD_ERROR,
]);

function makeErrorAction(actionType, errorPayload) {
  return {
    type: actionType,
    payload: errorPayload,
    error: true,
  };
}

export function makeCollectionAction(sourceAction, actionType, data, schema, tag = '*') {
  if (!actionType) {
    console.error('Action type is not valid.');
    return makeErrorAction(COLLECTION_ERROR, 'Action type is not valid.');
  }
  if (!data) {
    console.error('Data is not valid.');
    return makeErrorAction(COLLECTION_ERROR, 'Data is not valid.');
  }
  if (!schema) {
    console.error('Schema is not valid.');
    return makeErrorAction(COLLECTION_ERROR, 'Schema is not valid.');
  }
  if (tag === undefined || tag === null) {
    console.error('Tag is not valid.');
    return makeErrorAction(COLLECTION_ERROR, 'Tag is not valid.');
  }

  return {
    type: actionType,
    payload: data,
    meta: {
      ...sourceAction.meta,
      schema,
      tag,
    },
  };
}

export function makeObjectAction(sourceAction, actionType, item) {
  if (!actionType) {
    console.error('Action type is not valid.');
    return makeErrorAction(OBJECT_ERROR, 'Action type is not valid.');
  }
  if (!item) {
    console.error('Data is not valid.');
    return makeErrorAction(OBJECT_ERROR, 'Data is not valid.');
  }
  if (!_.get(item, 'type')) {
    console.error('Schema is not valid.');
    return makeErrorAction(OBJECT_ERROR, 'Schema is not valid.');
  }
  if (!_.get(item, 'id')) {
    console.error('Id is not valid.');
    return makeErrorAction(OBJECT_ERROR, 'Id is not valid.');
  }

  // create transformation keys
  const transformation = transform(item);

  return {
    type: actionType,
    payload: transformation.transformedObject,
    meta: {
      ...sourceAction.meta,
      schema: _.get(item, 'type'),
      transformation: transformation.transformationDescription,
    },
  };
}

const actionHandlers = {
  [LOAD_REQUEST]: (action, data, dispatch) => {
    // Make collection busy to prevent multiple requests
    const { schema, tag } = action.meta;
    dispatch(makeCollectionAction(
      action,
      COLLECTION_STATUS,
      { busyStatus: busyStatus.BUSY },
      schema,
      tag
    ));
  },
  [LOAD_SUCCESS]: (action, data, dispatch) => {
    // Dispatch objects to storages and collection with specific tag
    const { schema, tag } = action.meta;
    data.map(item => dispatch(makeObjectAction(action, OBJECT_FETCHED, item)));
    // TODO: once when we support findOne action and single reducer, COLLECTION_FETCHED
    // should trigger only for collections
    dispatch(makeCollectionAction(action, COLLECTION_FETCHED, data, schema, tag));
  },
  [LOAD_ERROR]: (action, data, dispatch) => {
    // Invalidate and idle collection on error
    const { schema, tag } = action.meta;
    dispatch(makeCollectionAction(
      action,
      COLLECTION_STATUS,
      {
        busyStatus: busyStatus.IDLE,
        validationStatus: validationStatus.INVALID,
        error: true,
      },
      schema,
      tag
    ));
  },
  [CREATE_REQUEST]: (action, data, dispatch) => {
    // Change collection status to busy and invalid to prevent fetching.
    const schema = action.meta.schema;
    dispatch(makeCollectionAction(
      action,
      COLLECTION_STATUS,
      { validationStatus: validationStatus.INVALID, busyStatus: busyStatus.BUSY },
      schema
    ));
  },
  [CREATE_SUCCESS]: (action, data, dispatch) => {
    // Dispatch created objects to storage and change collection status to invalid, idle
    data.map(item => dispatch(makeObjectAction(action, OBJECT_CREATED, item)));
    const schema = action.meta.schema;
    dispatch(makeCollectionAction(
      action,
      COLLECTION_STATUS,
      { validationStatus: validationStatus.INVALID, busyStatus: busyStatus.IDLE },
      schema
    ));
  },
  [CREATE_ERROR]: (action, data, dispatch) => {
    // Change collection status to idle and invalid to fetch again.
    const schema = action.meta.schema;
    dispatch(makeCollectionAction(
      action,
      COLLECTION_STATUS,
      {
        validationStatus: validationStatus.INVALID,
        busyStatus: busyStatus.IDLE,
      },
      schema
    ));
  },
  [UPDATE_REQUEST]: (action, data, dispatch) => {
    // Change collection status to busy and invalid to prevent fetching and because of
    // local changes in storage state with updated item.
    const schema = action.meta.schema;
    dispatch(makeCollectionAction(
      action,
      COLLECTION_STATUS,
      { validationStatus: validationStatus.INVALID, busyStatus: busyStatus.BUSY },
      schema
    ));
    data.map(item => dispatch(makeObjectAction(action, OBJECT_UPDATING, item)));
  },
  [UPDATE_SUCCESS]: (action, data, dispatch) => {
    // Dispatch updated objects from and change collections status to idle & invalid
    data.map(item => dispatch(makeObjectAction(action, OBJECT_UPDATED, item)));
    const schema = action.meta.schema;
    dispatch(makeCollectionAction(
      action,
      COLLECTION_STATUS,
      { validationStatus: validationStatus.INVALID, busyStatus: busyStatus.IDLE },
      schema
    ));
  },
  [UPDATE_ERROR]: (action, data, dispatch) => {
    // Change collection status to idle and invalid
    const schema = action.meta.schema;
    dispatch(makeCollectionAction(
      action,
      COLLECTION_STATUS,
      {
        validationStatus: validationStatus.INVALID,
        busyStatus: busyStatus.IDLE,
      },
      schema
    ));
  },
  [REMOVE_REQUEST]: (action, data, dispatch) => {
    // Change collections status to busy and invalid because of removing item in
    // local storage state
    const schema = action.meta.schema;
    dispatch(makeCollectionAction(
      action,
      COLLECTION_STATUS,
      { validationStatus: validationStatus.INVALID, busyStatus: busyStatus.BUSY },
      schema
    ));
    data.map(item => dispatch(makeObjectAction(action, OBJECT_REMOVING, item)));
  },
  [REMOVE_SUCCESS]: (action, data, dispatch) => {
    // Remove object if already not removed during request
    data.map(item => dispatch(makeObjectAction(action, OBJECT_REMOVED, item)));
    const schema = action.meta.schema;
    dispatch(makeCollectionAction(
      action,
      COLLECTION_STATUS,
      { validationStatus: validationStatus.INVALID, busyStatus: busyStatus.IDLE },
      schema
    ));
  },
  [REMOVE_ERROR]: (action, data, dispatch) => {
    // Change collections status to idle and invalid
    const schema = action.meta.schema;
    dispatch(makeCollectionAction(
      action,
      COLLECTION_STATUS,
      {
        validationStatus: validationStatus.INVALID,
        busyStatus: busyStatus.IDLE,
      },
      schema
    ));
  },
};

function isValidAction(action) {
  if (!actionHandlers[action.type]) {
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
  if (meta.source === undefined) {
    console.error('Source is undefined.');
    return false;
  }
  // Source exists but this middleware is not responsible for other source variants
  // only for json_api
  if (meta.source !== middlewareJsonApiSource) {
    console.error('api source is unknown');
    return false;
  }
  // Check that schema is defined
  if (!meta.schema) {
    console.error('Schema is invalid.');
    return false;
  }
  // Validate payload for payload-specific action, ignore others
  if (!actionsWithoutPayload.has(action.type)
    && !_.has(action, 'payload.data')) {
    console.error('Payload Data is invalid, expecting payload.data.');
    return false;
  }
  // Validate tag for tag-specific action, ignore others
  if (actionsWithTags.has(action.type)
    && !_.isString(_.get(action, 'meta.tag'))) {
    console.error('Tag is invalid, expecting meta.tag');
    return false;
  }

  return true;
}

const getData = payload => {
  const data = payload && payload.data || [];
  return [].concat(data);
};
const getIncluded = payload => (
  _.has(payload, 'included') ? payload.included : []
);

export default store => next => action => {
  // Validate action, if not valid pass
  if (!isValidAction(action)) {
    return next(action);
  }

  const dispatch = store.dispatch;

  // First dispatch included objects
  const included = getIncluded(action.payload);
  included.map(item => dispatch(makeObjectAction(action, OBJECT_FETCHED, item)));

  // Find handler for supported action type to make appropriate logic
  const data = getData(action.payload);
  actionHandlers[action.type](action, data, dispatch);

  // After middleware handled action pass input action to next
  return next(action);
};
