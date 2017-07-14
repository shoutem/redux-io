import { expect } from 'chai';
import deepFreeze from 'deep-freeze';
import {
  one,
  checkExpiration,
  REFERENCE_FETCHED,
  REFERENCE_CLEAR,
  REFERENCE_STATUS,
} from '../../src';
import {
  STATUS,
  validationStatus,
  busyStatus,
  createStatus,
  setStatus,
} from '../../src/status';

describe('One reducer', () => {
  it('has a valid initial state', () => {
    const testReducer = one('test', 'test');
    const state = testReducer(undefined, {});
    const expectedStatus = createStatus();
    expect(state.value).to.eql('');
    expect(state[STATUS].validationStatus).to.eql(expectedStatus.validationStatus);
    expect(state[STATUS].busyStatus).to.eql(expectedStatus.busyStatus);
  });

  it('sets value on fetch', () => {
    const initialValue = '';
    const items = [
      { id: 1 },
    ];

    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = one(schema, tag, undefined, initialValue);
    deepFreeze(initialValue);

    const action = {
      type: REFERENCE_FETCHED,
      meta: {
        schema,
        tag,
      },
      payload: items,
    };

    const nextState = reducer(undefined, action);
    const expectedValue = items[0].id;

    expect(nextState.value).to.eql(expectedValue);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.VALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
  });

  it('sets value on fetch event with default tag', () => {
    const items = [
      { id: 1 },
    ];

    const schema = 'schema_test';
    const reducer = one(schema);

    const action = {
      type: REFERENCE_FETCHED,
      meta: {
        schema,
        tag: '',
      },
      payload: items,
    };

    const nextState = reducer(undefined, action);
    const expectedValue = items[0].id;

    expect(nextState.value).to.eql(expectedValue);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.VALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
  });

  it('ignores action with different schema', () => {
    const initialValue = '';
    const items = [
      { id: 1 },
    ];
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = one(schema, tag, undefined, initialValue);
    deepFreeze(initialValue);

    const action = {
      type: REFERENCE_FETCHED,
      meta: {
        schema: 'test2',
        tag,
      },
      payload: items,
    };

    const nextState = reducer(undefined, action);
    expect(nextState.value).to.equal(initialValue);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.NONE);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
  });

  it('ignores action with different action type', () => {
    const initialValue = [];
    const items = [
      { id: 1 },
    ];
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = one(schema, tag, undefined, initialValue);
    deepFreeze(initialValue);

    const action = {
      type: 'REFERENCE_FETCHED',
      meta: {
        schema,
        tag,
      },
      payload: items,
    };

    const nextState = reducer(undefined, action);
    expect(nextState.value).to.equal(initialValue);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.NONE);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
  });

  it('ignores action with different collection type', () => {
    const initialValue = [];
    const items = [
      { id: 1 },
    ];
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = one(schema, tag, undefined, initialValue);
    deepFreeze(initialValue);

    const action = {
      type: REFERENCE_FETCHED,
      meta: {
        schema,
        tag: 'collection2',
      },
      payload: items,
    };

    const nextState = reducer(undefined, action);
    expect(nextState.value).to.equal(initialValue);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.NONE);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
  });

  it('overwrites value of one on fetch', () => {
    const initialValue = 1;
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = one(schema, tag, undefined, initialValue);
    deepFreeze(initialValue);

    const itemsNew = [
      { id: 3 },
    ];
    const action = {
      type: REFERENCE_FETCHED,
      meta: {
        schema,
        tag,
      },
      payload: itemsNew,
    };

    const nextState = reducer(undefined, action);
    expect(nextState.value).to.eql(itemsNew[0].id);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.VALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
  });

  it('invalidates value with broadcast status', () => {
    const initialValue = 1;
    const schema = 'schema_test';
    const tag = 'tag_value';
    const reducer = one(schema, tag, undefined, initialValue);
    deepFreeze(initialValue);

    const action = {
      type: REFERENCE_STATUS,
      payload: { validationStatus: validationStatus.INVALID, busyStatus: busyStatus.IDLE },
      meta: {
        schema,
        tag: '*',
      },
    };

    const nextState = reducer(undefined, action);
    expect(nextState.value).to.eql(initialValue);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.INVALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
  });

  it('change one status to busy with non-broadcast status', () => {
    const initialValue = 1;
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = one(schema, tag, undefined, initialValue);
    const otherTag = 'other_tag';
    const otherReducer = one(schema, otherTag, undefined, initialValue);
    deepFreeze(initialValue);

    const action = {
      type: REFERENCE_STATUS,
      payload: { busyStatus: busyStatus.BUSY },
      meta: {
        schema,
        tag,
      },
    };

    const nextState = reducer(undefined, action);
    expect(nextState.value).to.eql(initialValue);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.NONE);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.BUSY);

    const nextOtherState = otherReducer(undefined, action);
    expect(nextOtherState.value).to.eql(initialValue);
    expect(nextOtherState[STATUS].validationStatus).to.eql(validationStatus.NONE);
    expect(nextOtherState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
  });

  it('throws exception on reserved tag value', () => {
    const initialValue = 1;
    const schema = 'schema_test';
    const tag = '*';
    expect(() => one(schema, tag, undefined, initialValue))
      .to.throw('Tag value \'*\' is reserved for redux-io and cannot be used.');
  });

  it('clears one', () => {
    const initialValue = 1;
    const schema = 'schema_test';
    const tag = 'tag_test';

    const action = {
      type: REFERENCE_CLEAR,
      meta: {
        schema,
        tag,
      },
    };

    const reducer = one(schema, tag, undefined, initialValue);
    deepFreeze(initialValue);
    const nextState = reducer(undefined, action);

    expect(nextState.value).to.deep.equal(initialValue);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.VALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
  });

  it('adds status to one state without status', () => {
    const initialValue = -1;
    const items = [
      { id: 1 },
    ];
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = one(schema, tag, undefined, initialValue);
    const state = reducer(undefined, {});
    deepFreeze(initialValue);

    const action = {
      type: 'unknown action',
      meta: {
        schema,
        tag,
      },
      payload: items,
    };

    const nextState = reducer(state, action);
    expect(nextState.value).to.deep.equal(initialValue);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.NONE);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
    expect(nextState[STATUS].schema).to.eql(schema);
    expect(nextState[STATUS].type).to.eql('one');
  });

  it('sets additional settings to status', () => {
    const settingValue = 1000;
    const reducer = one('schema', undefined, { setting: settingValue });
    const state = reducer(undefined, {});
    const oneStatus = state[STATUS];
    expect(oneStatus.setting).to.equal(settingValue);
    expect(oneStatus.id).to.be.ok;
    expect(oneStatus.schema).to.be.ok;
    expect(oneStatus.type).to.be.ok;
  });

  describe('CHECK_EXPIRATION', () => {
    it('change one validationStatus to invalid if expired', () => {
      const expirationTime = 1;
      const schema = 'schema_test';
      const tag = 'tag_test';
      const reducer = one(schema, tag, { expirationTime }, 1);

      const state = reducer(undefined, undefined);
      // Fake modification
      state[STATUS].modifiedTimestamp = Date.now() - (expirationTime * 1000 + 1);

      const action = checkExpiration();
      const nextState = reducer(state, action);

      expect(nextState[STATUS].validationStatus).to.eql(validationStatus.INVALID);
      expect(nextState === state).to.be.not.ok;
    });

    it('does not change anything beside validationStatus if invalid', () => {
      const expirationTime = 1;
      const schema = 'schema_test';
      const tag = 'tag_test';
      const reducer = one(schema, tag, { expirationTime }, 1);

      const state = reducer(undefined, undefined);
      // Fake modification
      state[STATUS].modifiedTimestamp = Date.now() - (expirationTime * 1000 + 1);

      const action = checkExpiration();
      const nextState = reducer(state, action);

      const expectedState = { ...state };
      setStatus(expectedState, {
        ...state[STATUS],
        // Validation status gets updated
        validationStatus: validationStatus.INVALID
      });

      expect(nextState).to.eql(expectedState);
    });

    it('does not create new reference if not expired', () => {
      const expirationTime = 10;
      const schema = 'schema_test';
      const tag = 'tag_test';
      const reducer = one(schema, tag, { expirationTime }, 1);

      const state = reducer(undefined, undefined);

      const action = checkExpiration();
      const nextState = reducer(state, action);

      expect(state === nextState).to.be.ok;
    });
  });
});
