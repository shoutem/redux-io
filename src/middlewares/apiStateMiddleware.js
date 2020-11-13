/* eslint-disable no-unused-expressions */
/* eslint no-console: ["error", {allow: ["warn", "error"] }] */
import _ from 'lodash';
import { batchActions, BATCH } from 'redux-batched-actions';
import rio from '../rio';
import {
  validationStatus,
  busyStatus,
} from '../status';
import Outdated from '../outdated';
import { JSON_API_SOURCE } from '../standardizers/json-api-standardizer';
import {
  LOAD_REQUEST,
  LOAD_SUCCESS,
  LOAD_ERROR,
  UPDATE_REQUEST,
  UPDATE_SUCCESS,
  UPDATE_ERROR,
  OBJECT_UPDATING,
  OBJECT_UPDATED,
  OBJECT_FETCHED,
  REMOVE_REQUEST,
  REMOVE_SUCCESS,
  REMOVE_ERROR,
  OBJECT_REMOVED,
  OBJECT_REMOVING,
  CREATE_REQUEST,
  CREATE_SUCCESS,
  CREATE_ERROR,
  OBJECT_CREATED,
  REFERENCE_FETCHED,
  REFERENCE_STATUS,
  OBJECT_ERROR,
  COLLECTION_ERROR,
} from '../consts';

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

const internalActions = new Set([
  OBJECT_UPDATING,
  OBJECT_UPDATED,
  OBJECT_FETCHED,
  OBJECT_REMOVED,
  OBJECT_REMOVING,
  OBJECT_CREATED,
  REFERENCE_FETCHED,
  REFERENCE_STATUS,
  OBJECT_ERROR,
  COLLECTION_ERROR,
]);

/**
 * Map used to resolve actions in case action.error = true to appropriate ERROR actions
 * for RIO to be able to dispatch actions for reducers.
 * @type {{}}
 */
const errorActionsMap = {
  [LOAD_REQUEST]: LOAD_ERROR,
  [LOAD_ERROR]: LOAD_ERROR,
  [CREATE_REQUEST]: CREATE_ERROR,
  [CREATE_ERROR]: CREATE_ERROR,
  [UPDATE_REQUEST]: UPDATE_ERROR,
  [UPDATE_ERROR]: UPDATE_ERROR,
  [REMOVE_REQUEST]: REMOVE_ERROR,
  [REMOVE_ERROR]: REMOVE_ERROR,
};

const outdated = new Outdated();

function makeErrorAction(actionType, errorPayload) {
  return {
    type: actionType,
    payload: errorPayload,
    error: true,
  };
}

export function makeIndexAction(sourceAction, actionType, data, schema, tag = '*') {
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

  // finds appropriate standardizer for transformation
  const transform = rio.getStandardizer(sourceAction.meta.source);
  // transforms item into standard model
  const transformation = transform(item);

  return {
    type: actionType,
    payload: transformation.object,
    meta: {
      ...sourceAction.meta,
      schema: _.get(item, 'type'),
      transformation: transformation.schema,
    },
  };
}

const getData = payload => {
  const data = payload && payload.data || [];
  return [].concat(data);
};

const getIncluded = payload => (
  _.get(payload, 'included', [])
);

const getLinks = payload => {
  const links = _.get(payload, 'links');
  if (!links) {
    return null;
  }

  return {
    prev: links.prev || null,
    next: links.next || null,
    self: links.self || null,
    last: links.last || null,
  };
};

function saveLinks(action, dispatch) {
  const { schema, tag } = action.meta;
  const links = getLinks(action.payload);

  if (links) {
    dispatch(makeIndexAction(action, REFERENCE_STATUS, { links }, schema, tag));
  }
}

const getMeta = payload => (
  _.get(payload, 'meta')
);

function saveMeta(action, dispatch) {
  const { schema, tag } = action.meta;
  const meta = getMeta(action.payload);

  if (meta) {
    dispatch(makeIndexAction(action, REFERENCE_STATUS, { meta }, schema, tag));
  }
}

const actionHandlers = {
  [LOAD_REQUEST]: (action, data, dispatch) => {
    // Make collection busy to prevent multiple requests
    const { schema, tag } = action.meta;
    const invalidateReferences = _.get(action.meta, 'options.invalidateReferences');

    if (invalidateReferences !== false) {
      dispatch(makeIndexAction(
        action,
        REFERENCE_STATUS,
        { busyStatus: busyStatus.BUSY },
        schema,
        tag
      ));
    }
  },
  [LOAD_SUCCESS]: (action, data, dispatch) => {
    // Dispatch objects to storages and collection with specific tag
    const { schema, tag } = action.meta;
    const invalidateResources = _.get(action.meta, 'options.invalidateResources');
    const invalidateReferences = _.get(action.meta, 'options.invalidateReferences');

    if (invalidateResources !== false) {
      data.map(item => dispatch(makeObjectAction(action, OBJECT_FETCHED, item)));
    }

    if (invalidateReferences !== false) {
      // TODO: once when we support findOne action and single reducer, REFERENCE_FETCHED
      // should trigger only for collections
      dispatch(makeIndexAction(action, REFERENCE_FETCHED, data, schema, tag));
    }

    saveMeta(action, dispatch);
    saveLinks(action, dispatch);
  },
  [LOAD_ERROR]: (action, data, dispatch) => {
    // Invalidate and idle collection on error
    const { schema, tag } = action.meta;
    const invalidateReferences = _.get(action.meta, 'options.invalidateReferences');

    if (invalidateReferences !== false) {
      dispatch(makeIndexAction(
        action,
        REFERENCE_STATUS,
        {
          busyStatus: busyStatus.IDLE,
          validationStatus: validationStatus.INVALID,
          error: true,
        },
        schema,
        tag
      ));
    }
  },
  [CREATE_REQUEST]: (action, data, dispatch) => {
    // Change collection status to busy and invalid to prevent fetching.
    const schema = action.meta.schema;
    const invalidateReferences = _.get(action.meta, 'options.invalidateReferences');

    if (invalidateReferences !== false) {
      dispatch(makeIndexAction(
        action,
        REFERENCE_STATUS,
        { validationStatus: validationStatus.INVALID, busyStatus: busyStatus.BUSY },
        schema
      ));
    }
  },
  [CREATE_SUCCESS]: (action, data, dispatch) => {
    const schema = action.meta.schema;
    const invalidateResources = _.get(action.meta, 'options.invalidateResources');
    const invalidateReferences = _.get(action.meta, 'options.invalidateReferences');

    if (invalidateResources !== false) {
      // Dispatch created objects to storage and change collection status to invalid, idle
      data.map(item => dispatch(makeObjectAction(action, OBJECT_CREATED, item)));
    }

    if (invalidateReferences !== false) {
      dispatch(makeIndexAction(
        action,
        REFERENCE_STATUS,
        { validationStatus: validationStatus.INVALID, busyStatus: busyStatus.IDLE },
        schema
      ));
    }
  },
  [CREATE_ERROR]: (action, data, dispatch) => {
    // Change collection status to idle and invalid to fetch again.
    const schema = action.meta.schema;
    const invalidateReferences = _.get(action.meta, 'options.invalidateReferences');

    if (invalidateReferences !== false) {
      dispatch(makeIndexAction(
        action,
        REFERENCE_STATUS,
        {
          validationStatus: validationStatus.INVALID,
          busyStatus: busyStatus.IDLE,
        },
        schema
      ));
    }
  },
  [UPDATE_REQUEST]: (action, data, dispatch) => {
    // Change collection status to busy and invalid to prevent fetching and because of
    // local changes in storage state with updated item.
    const schema = action.meta.schema;
    const invalidateResources = _.get(action.meta, 'options.invalidateResources');
    const invalidateReferences = _.get(action.meta, 'options.invalidateReferences');

    if (invalidateReferences !== false) {
      dispatch(makeIndexAction(
        action,
        REFERENCE_STATUS,
        { validationStatus: validationStatus.INVALID, busyStatus: busyStatus.BUSY },
        schema
      ));
    }

    if (invalidateResources !== false) {
      data.map(item => dispatch(makeObjectAction(action, OBJECT_UPDATING, item)));
    }
  },
  [UPDATE_SUCCESS]: (action, data, dispatch) => {
    const schema = action.meta.schema;
    const invalidateResources = _.get(action.meta, 'options.invalidateResources');
    const invalidateReferences = _.get(action.meta, 'options.invalidateReferences');

    if (invalidateResources !== false) {
    // Dispatch updated objects from and change collections status to idle & invalid
      data.map(item => dispatch(makeObjectAction(action, OBJECT_UPDATED, item)));
    }

    if (invalidateReferences !== false) {
      dispatch(makeIndexAction(
        action,
        REFERENCE_STATUS,
        { validationStatus: validationStatus.INVALID, busyStatus: busyStatus.IDLE },
        schema
      ));
    }
  },
  [UPDATE_ERROR]: (action, data, dispatch) => {
    // Change collection status to idle and invalid
    const schema = action.meta.schema;
    const invalidateReferences = _.get(action.meta, 'options.invalidateReferences');

    if (invalidateReferences !== false) {
      dispatch(makeIndexAction(
        action,
        REFERENCE_STATUS,
        { validationStatus: validationStatus.INVALID, busyStatus: busyStatus.IDLE },
        schema
      ));
    }
  },
  [REMOVE_REQUEST]: (action, data, dispatch) => {
    // Change collections status to busy and invalid because of removing item in
    // local storage state
    const schema = action.meta.schema;
    const invalidateResources = _.get(action.meta, 'options.invalidateResources');
    const invalidateReferences = _.get(action.meta, 'options.invalidateReferences');

    if (invalidateReferences !== false) {
      dispatch(makeIndexAction(
        action,
        REFERENCE_STATUS,
        { validationStatus: validationStatus.INVALID, busyStatus: busyStatus.BUSY },
        schema
      ));
    }

    if (invalidateResources !== false) {
      data.map(item => dispatch(makeObjectAction(action, OBJECT_REMOVING, item)));
    }
  },
  [REMOVE_SUCCESS]: (action, data, dispatch) => {
    const schema = action.meta.schema;
    const invalidateResources = _.get(action.meta, 'options.invalidateResources');
    const invalidateReferences = _.get(action.meta, 'options.invalidateReferences');

    if (invalidateResources !== false) {
      // Remove object if already not removed during request
      data.map(item => dispatch(makeObjectAction(action, OBJECT_REMOVED, item)));
    }

    if (invalidateReferences !== false) {
      dispatch(makeIndexAction(
        action,
        REFERENCE_STATUS,
        { validationStatus: validationStatus.INVALID, busyStatus: busyStatus.IDLE },
        schema
      ));
    }
  },
  [REMOVE_ERROR]: (action, data, dispatch) => {
    // Change collections status to idle and invalid
    const schema = action.meta.schema;
    const invalidateReferences = _.get(action.meta, 'options.invalidateReferences');

    if (invalidateReferences !== false) {
      dispatch(makeIndexAction(
        action,
        REFERENCE_STATUS,
        {
          validationStatus: validationStatus.INVALID,
          busyStatus: busyStatus.IDLE,
        },
        schema
      ));
    }
  },
};

function shouldContainPayload(action) {
  return !(actionsWithoutPayload.has(action.type) || _.get(action, 'meta.response.status') === 204);
}

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
  // Source value exists but check if rio support standardization of such source type
  if (!rio.getStandardizer(meta.source)) {
    return false;
  }
  // Check that schema is defined
  if (!meta.schema) {
    console.error('Action.meta.schema is undefined.');
    return false;
  }
  // Validate payload for payload-specific action, ignore others
  if (shouldContainPayload(action)) {
    // TODO: move this into standardizer specific area once json standardization is supported
    if (!_.has(action, 'payload')) {
      console.error('Response should contain payload.');
      return false;
    }
    if (meta.source === JSON_API_SOURCE && !_.has(action, 'payload.data')) {
      console.error(`${JSON_API_SOURCE} response should contain payload.data.`);
      return false;
    }
  }
  // Validate tag for tag-specific action, ignore others
  if (actionsWithTags.has(action.type)
    && !_.isString(_.get(action, 'meta.tag'))) {
    console.error('Tag is invalid, expecting meta.tag');
    return false;
  }

  return true;
}

/**
 * Handled failed redux-api-middleware request.
 *
 * @param action
 * @param dispatch
 * @returns {*}
 */
function handleFailedRequest(action, dispatch) {
  const errorAction = errorActionsMap[action.type];

  if (!errorAction) {
    console.warn(`Can not handle failed request for action type ${action.type}.`);
    return;
  }

  // Update reference status for corresponding error action
  actionHandlers[errorAction](action, undefined, dispatch);
}

/**
 * Handle any request related action and dispatch corresponding state updating actions.
 * Add batched actions to update state data and/or status.
 * @param action
 * @param dispatch
 */
function handleNetworkAction(action, dispatch) {
  // First dispatch included objects
  const included = getIncluded(action.payload);
  included.map(item => dispatch(makeObjectAction(action, OBJECT_FETCHED, item)));

  const data = getData(action.payload);
  // Find handler for supported action type to make appropriate logic
  actionHandlers[action.type](action, data, dispatch);
}

function isInternalAction(action) {
  const type = _.get(action, 'type');

  if (type === BATCH) {
    return _.some(action.payload, isInternalAction);
  }

  return internalActions.has(type);
}

export default store => next => action => {
  if (isInternalAction(action)) {
    rio.denormalizer.invalidateModificationCache();
  }

  // Validate action, if not valid pass
  if (!isValidAction(action)) {
    return next(action);
  }

  if (outdated.isOutdated(action)) {
    return next(action);
  }
  outdated.reportChange(action);

  // TODO: add standardization of whole payload once we support json standardization

  const actions = [];
  const dispatch = dispatchAction => actions.push(dispatchAction);

  if (action.error) {
    // Request which thrown an error
    handleFailedRequest(action, dispatch);
  } else {
    handleNetworkAction(action, dispatch);
  }

  if (!_.isEmpty(actions)) {
    store.dispatch(batchActions(actions));
  }

  // After middleware handled action pass input action to next
  return next(action);
};
