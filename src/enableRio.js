import { enableBatching } from 'redux-batched-actions';

export function enableRio(reducer) {
  return enableBatching(reducer);
}
