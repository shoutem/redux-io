export const CONTEXT = Symbol('context');

export function stateContextPropExists(state, prop) {
  if (!state[CONTEXT]) {
    return false;
  }
  return Boolean(state[CONTEXT][prop]);
}

export class Context {
  constructor(oldState) {
    this.oldState = oldState;
  }
  copyOldContext(newState) {
    newState[CONTEXT] = { ...this.oldState[CONTEXT] };
  }
  createStateContextProp(state, prop, val) {
    if (!state[CONTEXT]) {
      this.copyOldContext(state);
    }
    state[CONTEXT][prop] = val;
    return state;
  }
  updateStateContextProp(state, prop, update) {
    if (!state[CONTEXT]) {
      this.copyOldContext(state);
    }
    state[CONTEXT][prop] = {
      ...state[CONTEXT][prop],
      ...update,
    };
    return state;
  }
}
