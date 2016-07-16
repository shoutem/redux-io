import _ from 'lodash';

/**
 * Chains multiple reducers, each reducer will get the state returned by
 * the previous reducer. The final state will be the state returned by
 * the last reducer in the chain.
 * @param reducers
 * @returns {Function}
 */
export default function chainReducers(reducers) {
  return (state, action) => (
    _.reduce(
      reducers,
      (chainState, reducer) => reducer(chainState, action),
      state
    )
  );
}
