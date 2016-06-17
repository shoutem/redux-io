import { enableBatching } from 'redux-batched-actions';

export function rioReducer(reducer) {
  return enableBatching(reducer);
}
