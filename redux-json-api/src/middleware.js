export const LOAD_REQUEST = Symbol('LOAD_REQUEST');
export const LOAD_SUCCESS = Symbol('LOAD_SUCCESS');
export const LOAD_ERROR = Symbol('LOAD_ERROR');
export const COLLECTION_FETCHED = Symbol('COLLECTION_FETCHED');
export const OBJECT_FETCHED = Symbol('OBJECT_FETCHED');

export default jsonApiMiddleware = store => next => action => {
  if (action.meta === undefined) {
    return next(action);
  }
  const meta = action.meta;
  if (meta.source === undefined || meta.source !== 'json_api') {
    return next(action);
  }

  const type = meta.type;
  const collection = meta.collection;
  const dispatch = store.dispatch;
  const data = Array.isArray(action.payload.data)
    ? action.payload.data
    : [action.payload.data];

  const makeCollAction = () => ({
    type: COLLECTION_FETCHED,
    payload: data,
    meta: {
      type,
      collection,
    },
  });

  const makeObjectAction = (item) => ({
    type: OBJECT_FETCHED,
    payload: item,
    meta: { type },
  });

  const chainDispatch = () => {
    data.map(item => dispatch(makeObjectAction(item)));
    dispatch(makeCollAction());
  };

  return dispatch(chainDispatch());
};
