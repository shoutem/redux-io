import sinon from 'sinon';

export function extractThunk(actionThunk) {
  const dispatch = (action) => {
    return Promise.resolve(action);
  };
  const spiedDispatch = sinon.spy(dispatch);
  actionThunk(spiedDispatch);

  return spiedDispatch.args[0][0];
}
