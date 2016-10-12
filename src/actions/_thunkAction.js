const thunkAction = actionFn => (...args) => {
  const action = actionFn(...args);
  return dispatch => (
    new Promise((resolve, reject) => (
      dispatch(action).then(resolvedAction => {
        if (resolvedAction.error) {
          reject(resolvedAction);
          return;
        }
        resolve(resolvedAction);
      })
    ))
  )
};

export default thunkAction;
