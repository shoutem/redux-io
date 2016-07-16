import chai, { expect } from 'chai';
import shallowDeepEqual from 'chai-shallow-deep-equal';
import deepFreeze from 'deep-freeze';
import {
  resource,
  LOAD_REQUEST,
  LOAD_SUCCESS,
  LOAD_ERROR,
  CREATE_REQUEST,
  CREATE_SUCCESS,
  CREATE_ERROR,
  UPDATE_REQUEST,
  UPDATE_SUCCESS,
  UPDATE_ERROR,
  REMOVE_REQUEST,
  REMOVE_SUCCESS,
  REMOVE_ERROR,
  REFERENCE_CLEAR,
} from '../../src';
import {
  STATUS,
  validationStatus,
  busyStatus,
  createStatus,
} from '../../src/status';

chai.use(shallowDeepEqual);

describe('Resource reducer', () => {
  it('has a valid initial state', () => {
    const testReducer = resource('test');
    const state = testReducer(undefined, {});
    const expectedStatus = createStatus();

    expect(state[STATUS].validationStatus).to.eql(expectedStatus.validationStatus);
    expect(state[STATUS].busyStatus).to.eql(expectedStatus.busyStatus);
    expect(state[STATUS].schema).to.eql('test');
    expect(state).to.shallowDeepEqual({});
  });

  it('sets busy status on load_request action', () => {
    const initialState = {};

    const schema = 'schema_test';
    const reducer = resource(schema, initialState);
    deepFreeze(initialState);

    const action = {
      type: LOAD_REQUEST,
      meta: {
        schema,
        tag: '',
      },
    };

    const nextState = reducer(initialState, action);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.NONE);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.BUSY);
    expect(nextState).to.shallowDeepEqual(initialState);
  });

  it('adds payload on load_success action', () => {
    const initialState = {};
    const payload = {
      id: 1,
      description: 'today'
    };

    const schema = 'schema_test';
    const reducer = resource(schema, initialState);
    deepFreeze(initialState);

    const action = {
      type: LOAD_SUCCESS,
      meta: {
        schema,
      },
      payload,
    };

    const nextState = reducer(undefined, action);

    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.VALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
    expect(nextState).to.shallowDeepEqual(payload);
  });

  it('overwrites payload on load_success action', () => {
    const initialState = {
      id: 2,
      description: 'yesterday',
    };
    const schema = 'schema_test';
    const reducer = resource(schema, initialState);
    deepFreeze(initialState);

    const payload = {
      id: 1,
      description: 'today',
    };

    const action = {
      type: LOAD_SUCCESS,
      meta: {
        schema,
      },
      payload,
    };

    const nextState = reducer(initialState, action);

    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.VALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
    expect(nextState).to.shallowDeepEqual(payload);
  });

  it('correct state on load_error action', () => {
    const initialState =  {
      id: 1,
      description: 'today'
    };

    const schema = 'schema_test';
    const reducer = resource(schema, initialState);
    deepFreeze(initialState);

    const action = {
      type: LOAD_ERROR,
      meta: {
        schema,
        tag: '',
      },
    };

    const nextState = reducer(initialState, action);

    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.INVALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
    expect(nextState[STATUS].error).to.be.true;
    expect(nextState).to.shallowDeepEqual(initialState);
  });

  it('correct state on create_request action', () => {
    const initialState = {};

    const schema = 'schema_test';
    const reducer = resource(schema, initialState);
    deepFreeze(initialState);

    const action = {
      type: CREATE_REQUEST,
      meta: {
        schema,
        tag: '',
      },
    };

    const nextState = reducer(initialState, action);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.NONE);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.BUSY);
    expect(nextState).to.shallowDeepEqual(initialState);
  });

  it('adds payload on create_success action', () => {
    const initialState = {};
    const payload = {
      id: 1,
      description: 'today'
    };

    const schema = 'schema_test';
    const reducer = resource(schema, initialState);
    deepFreeze(initialState);

    const action = {
      type: CREATE_SUCCESS,
      meta: {
        schema,
      },
      payload,
    };

    const nextState = reducer(undefined, action);

    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.VALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
    expect(nextState).to.shallowDeepEqual(payload);
  });

  it('correct state on create_error action', () => {
    const initialState =  {
      id: 1,
      description: 'today'
    };

    const schema = 'schema_test';
    const reducer = resource(schema, initialState);
    deepFreeze(initialState);

    const action = {
      type: CREATE_ERROR,
      meta: {
        schema,
        tag: '',
      },
    };

    const nextState = reducer(initialState, action);

    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.INVALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
    expect(nextState).to.shallowDeepEqual(initialState);
  });

  it('correct state on update_request action', () => {
    const initialState = {
      id: 2,
      description: 'yesterday',
    };
    const payload = {
      id: 1,
      description: 'today',
    };

    const schema = 'schema_test';
    const reducer = resource(schema, initialState);
    deepFreeze(initialState);

    const action = {
      type: UPDATE_REQUEST,
      meta: {
        schema,
        tag: '',
      },
      payload,
    };

    const nextState = reducer(initialState, action);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.INVALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.BUSY);
    expect(nextState).to.shallowDeepEqual(payload);
  });

  it('adds payload on update_success action', () => {
    const initialState = {};
    const payload = {
      id: 1,
      description: 'today'
    };

    const schema = 'schema_test';
    const reducer = resource(schema, initialState);
    deepFreeze(initialState);

    const action = {
      type: UPDATE_SUCCESS,
      meta: {
        schema,
      },
      payload,
    };

    const nextState = reducer(undefined, action);

    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.VALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
    expect(nextState).to.shallowDeepEqual(payload);
  });

  it('correct state on update_error action', () => {
    const initialState =  {
      id: 1,
      description: 'today'
    };

    const schema = 'schema_test';
    const reducer = resource(schema, initialState);
    deepFreeze(initialState);

    const action = {
      type: UPDATE_ERROR,
      meta: {
        schema,
        tag: '',
      },
    };

    const nextState = reducer(initialState, action);

    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.INVALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
    expect(nextState).to.shallowDeepEqual(initialState);
  });

  it('correct state on remove_request action', () => {
    const payload = {
      id: 1,
      description: 'today'
    };
    const initialState = payload;

    const schema = 'schema_test';
    const reducer = resource(schema, initialState);
    deepFreeze(initialState);

    const action = {
      type: REMOVE_REQUEST,
      meta: {
        schema,
        tag: '',
      },
      payload,
    };

    const nextState = reducer(initialState, action);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.INVALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.BUSY);
    expect(nextState).to.shallowDeepEqual({});
  });

  it('correct state on remove_success action', () => {
    const payload = {
      id: 1,
      description: 'today',
    };
    const initialState = payload;
    const schema = 'schema_test';

    const action = {
      type: REFERENCE_CLEAR,
      meta: {
        schema,
        tag: '',
      },
    };

    const reducer = resource(schema, initialState);
    deepFreeze(initialState);
    const nextState = reducer(initialState, action);

    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.VALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
    expect(nextState).to.shallowDeepEqual({});
  });

  it('correct state on remove_error action', () => {
    const initialState =  {
      id: 1,
      description: 'today'
    };

    const schema = 'schema_test';
    const reducer = resource(schema, initialState);
    deepFreeze(initialState);

    const action = {
      type: REMOVE_ERROR,
      meta: {
        schema,
        tag: '',
      },
    };

    const nextState = reducer(initialState, action);

    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.INVALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
    expect(nextState).to.shallowDeepEqual(initialState);
  });

  it('ignores action with different schema', () => {
    const initialState = {};
    const payload = {
      id: 1,
      description: 'today'
    };

    const schema = 'schema_test';
    const reducer = resource(schema, initialState);
    deepFreeze(initialState);

    const action = {
      type: LOAD_SUCCESS,
      meta: {
        schema: 'other_schema',
      },
      payload,
    };

    const nextState = reducer(undefined, action);

    expect(nextState).to.equal(initialState);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.NONE);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
  });

  it('clears resource', () => {
    const payload = {
      id: 1,
      description: 'today',
    };
    const initialState = payload;
    const schema = 'schema_test';

    const action = {
      type: REFERENCE_CLEAR,
      meta: {
        schema,
        tag: '',
      },
    };

    const reducer = resource(schema, initialState);
    deepFreeze(initialState);
    const nextState = reducer(initialState, action);

    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.VALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
    expect(nextState).to.shallowDeepEqual({});
  });

  it('adds status to resource state without status', () => {
    const initialState = {};
    const payload = {
      id: 1,
      description: 'today',
    };
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = resource(schema, initialState);
    deepFreeze(initialState);

    const action = {
      type: 'unknown action',
      meta: {
        schema,
        tag,
      },
      payload,
    };

    const customState = {};
    deepFreeze(customState);
    const nextState = reducer(customState, action);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.NONE);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
    expect(nextState[STATUS].schema).to.eql(schema);
    expect(nextState[STATUS].type).to.eql('resource');
    expect(nextState).to.shallowDeepEqual(customState);
  });
});
