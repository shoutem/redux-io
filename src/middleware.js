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

export const middlewareJsonApiSource = 'json_api';

const makeCollectionAction = (actionType, data, schema, tag = '') => ({
  type: actionType,
  payload: data,
  meta: {
    schema,
    tag,
  },
});

const makeObjectAction = (actionType, item, schema) => ({
  type: actionType,
  payload: item,
  meta: {
    schema,
  },
});

export default store => next => action => {
  // Check for meta object in action
  if (action.meta === undefined) {
    return next(action);
  }

  const meta = action.meta;
  // Check for source, this middleware only understand json_api source
  if (meta.source === undefined || meta.source !== middlewareJsonApiSource) {
    return next(action);
  }
  // Check that schema is defined
  if (meta.schema === undefined) {
    return next(action);
  }

  // Validate payload
  if (!_.has(action, 'payload.data')) {
    return next(action);
  }

  // Always work with arrays
  const data = [].concat(action.payload.data);
  const schema = meta.schema;

  const dispatch = store.dispatch;
  if (action.type === LOAD_SUCCESS) {
    // Validate action meta has tag value
    const tag = meta.tag;
    if (tag === undefined) {
      return next(action);
    }

    data.map(item => dispatch(makeObjectAction(OBJECT_FETCHED, item, schema)));
    dispatch(makeCollectionAction(COLLECTION_FETCHED, data, schema, tag));
  }

  if (action.type === CREATE_SUCCESS) {
    data.map(item => dispatch(makeObjectAction(OBJECT_CREATED, item, schema)));
    dispatch(makeCollectionAction(COLLECTION_INVALIDATE, data, schema));
  }

  return next(action);
};
