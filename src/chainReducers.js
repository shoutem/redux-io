import _ from 'lodash';

// Reducers are organized in chain where index represent place in chain.
// New state produced by reducers[i] is passed as state to reducer[i+1]
// Next reducer in chain is responsible for correct recreation of state.
export default function chainReducers(reducers) {
  return (state, action) => (
    _.reduce(
      reducers,
      (state, reducer) => reducer(state, action),
      state
    )
  );
}
