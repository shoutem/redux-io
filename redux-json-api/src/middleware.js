export const LOAD_REQUEST = Symbol('LOAD_REQUEST');
export const LOAD_SUCCESS = Symbol('LOAD_SUCCESS');
export const LOAD_ERROR = Symbol('LOAD_ERROR');
export const COLLECTION_FETCHED = Symbol('COLLECTION_FETCHED');
export const OBJECT_FETCHED = Symbol('OBJECT_FETCHED');

export default store => next => action => {
  if (action.meta === undefined) {
    return next(action);
  }
  const meta = action.meta;
  if (meta.source === undefined || meta.source !== 'json_api') {
    return next(action);
  }

  const dispatch = store.dispatch;

  if (action.type === LOAD_SUCCESS) {
    const type = meta.type;
    const collection = meta.collection;
    const data = Array.isArray(action.payload.data)
      ? action.payload.data
      : [action.payload.data];

    const makeCollectionAction = () => ({
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
      meta: {type},
    });

    data.map(item => dispatch(makeObjectAction(item)));
    dispatch(makeCollectionAction());
  }

  return next(action);
};
