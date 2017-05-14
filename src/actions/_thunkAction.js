const thunkAction = actionFn => (...args) => {
  const action = actionFn(...args);
  return dispatch => {
    const promise = new Promise((resolve, reject) => (
      dispatch(action).then(resolvedAction => {
        if (resolvedAction.error) {
          reject(resolvedAction);
          return;
        }
        resolve(resolvedAction);
      }, reject)
    ));

    promise.catch(console.log);
    return promise;
  };
};

export default thunkAction;
