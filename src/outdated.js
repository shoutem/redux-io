import {
  LOAD_SUCCESS,
  UPDATE_SUCCESS,
  REMOVE_SUCCESS,
  CREATE_SUCCESS,
  CREATE_REQUEST,
  UPDATE_REQUEST,
  REMOVE_REQUEST,
} from './middleware';

const outDateableActions = {
  [LOAD_SUCCESS]: LOAD_SUCCESS,
  [CREATE_SUCCESS]: CREATE_SUCCESS,
  [UPDATE_SUCCESS]: UPDATE_SUCCESS,
  [REMOVE_SUCCESS]: REMOVE_SUCCESS,
};

const modifierActions = {
  [CREATE_REQUEST]: CREATE_REQUEST,
  [UPDATE_REQUEST]: UPDATE_REQUEST,
  [REMOVE_REQUEST]: REMOVE_REQUEST,
};

export default class Outdated {
  constructor() {
    this.timestamps = {};
  }

  reportChange(action) {
    if (!modifierActions[action.type]) {
      return;
    }

    const { schema, timestamp } = action.meta;
    this.timestamps[schema] = timestamp;
  }

  isOutdated(action) {
    const { schema, timestamp } = action.meta;

    if (!outDateableActions[action.type]) {
      return false;
    }
    if (!this.timestamps[schema]) {
      return false;
    }

    return this.timestamps[schema] > timestamp;
  }
}
