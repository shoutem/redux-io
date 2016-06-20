import _ from 'lodash';

// Each reducer produces new instance of state. These new states
// are then merged into single instance of new state. Merging is deep
// and will cause merging of produced reducers states on each depth.
export default function mergeReducers(reducers) {
  return (state, action) => {
    const nextStates = reducers.map(reducer => reducer(state, action));
    //nextStates.map(s => console.log(s));
    return _.merge(...nextStates);
  };
}
