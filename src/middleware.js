import _ from 'lodash';

export const LOAD_REQUEST = Symbol('LOAD_REQUEST');
export const LOAD_SUCCESS = Symbol('LOAD_SUCCESS');
export const LOAD_ERROR = Symbol('LOAD_ERROR');
export const COLLECTION_FETCHED = Symbol('COLLECTION_FETCHED');
export const OBJECT_FETCHED = Symbol('OBJECT_FETCHED');

export const CREATE_REQUEST = Symbol('CREATE_REQUEST');
export const CREATE_SUCCESS = Symbol('CREATE_SUCCESS');
export const CREATE_ERROR = Symbol('CREATE_ERROR');
export const COLLECTION_INVALIDATE = Symbol('COLLECTION_INVALIDATE');
export const OBJECT_CREATED = Symbol('OBJECT_CREATED');

export const middlewareJsonApiSource = Symbol('json_api');

const makeCollectionAction = (actionType, data, schema, tag = '') => {
  if (!actionType) {
    throw new Error('Action type is not valid.');
  }
  if (!data) {
    throw new Error('Data is not valid.');
  }
  if (!schema) {
    throw new Error('Schema is not valid.');
  }
  if (tag === undefined || tag === null) {
    throw new Error('Tag is not valid.');
  }

  return {
    type: actionType,
    payload: data,
    meta: {
      schema,
      tag,
    },
  };
};

const makeObjectAction = (actionType, item, schema = '') => {
  if (!actionType) {
    throw new Error('Action type is not valid.');
  }
  if (!item) {
    throw new Error('Data is not valid.');
  }
  if (_.isEmpty(schema) && !_.get(item, 'type')) {
    throw new Error('Schema is not valid.');
  }

  return {
    type: actionType,
    payload: item,
    meta: {
      schema: _.isEmpty(schema) ? _.get(item, 'type') : schema,
    },
  };
};

const actionHandlers = {
  [LOAD_SUCCESS]: (action, data, included, dispatch) => {
    const { schema, tag } = action.meta;
    // Validate action meta has a tag value
    if (tag === undefined || tag === null) {
      return;
    }
    data.map(item => dispatch(makeObjectAction(OBJECT_FETCHED, item, schema)));
    dispatch(makeCollectionAction(COLLECTION_FETCHED, data, schema, tag));
  },
  [CREATE_SUCCESS]: (action, data, included, dispatch) => {
    const schema = action.meta.schema;
    data.map(item => dispatch(makeObjectAction(OBJECT_CREATED, item, schema)));
    dispatch(makeCollectionAction(COLLECTION_INVALIDATE, data, schema));
  },
};

const isValidAction = action => {
  if (!actionHandlers[action.type]) {
    return false;
  }
  // Check for meta object in action
  if (action.meta === undefined) {
    throw new Error('Meta is undefined.');
  }
  const meta = action.meta;
  // Check if source exists
  if (meta.source === undefined) {
    throw new Error('Source is undefined.');
  }
  // Source exists but this middleware is not responsible for other source variants
  // only for json_api
  if (meta.source !== middlewareJsonApiSource) {
    return false;
  }
  // Check that schema is defined
  if (!meta.schema) {
    throw new Error('Schema is invalid.');
  }
  // Validate payload
  if (!_.has(action, 'payload.data')) {
    throw new Error('Payload Data is invalid, expecting payload.data.');
  }

  return true;
};

const getData = payload => [].concat(payload.data);
const getIncluded = payload => { _.has(payload, 'included') ? payload.included : []; };

export default store => next => action => {
  // Validate action, if not valid pass
  if (!isValidAction(action)) {
    return next(action);
  }

  const dispatch = store.dispatch;

  // First dispatch included objects
  const included = getIncluded(action.payload);
  included.map(item => dispatch(makeObjectAction(OBJECT_FETCHED, item)));

  // Find handler for supported action type to make appropriate logic
  const data = getData(action.payload);
  actionHandlers[action.type](action, data, included, dispatch);

  // After middleware handled action pass input action to next
  return next(action);
};
