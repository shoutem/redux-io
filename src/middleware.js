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

const makeCollectionAction = (type, payload, collection = '') => ({
  type,
  payload,
  meta: {
    type: payload[0].type,
    collection,
  },
});

const makeObjectAction = (type, item) => ({
  type,
  payload: item,
  meta: {
    type: item.type,
  },
});

export default store => next => action => {
  if (action.meta === undefined) {
    return next(action);
  }
  const meta = action.meta;
  if (meta.source === undefined || meta.source !== 'json_api') {
    return next(action);
  }

  const data = [].concat(action.payload.data);
  if (data.length === 0) {
    return next(action);
  }

  const dispatch = store.dispatch;
  if (action.type === LOAD_SUCCESS) {
    data.map(item => dispatch(makeObjectAction(OBJECT_FETCHED, item)));
    const collection = meta.collection;
    dispatch(makeCollectionAction(COLLECTION_FETCHED, data, collection));
  }

  if (action.type === CREATE_SUCCESS) {
    data.map(item => dispatch(makeObjectAction(OBJECT_CREATED, item)));
    dispatch(makeCollectionAction(COLLECTION_INVALIDATE, data));
  }

  return next(action);
};
