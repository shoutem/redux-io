import { expect } from 'chai';
import deepFreeze from 'deep-freeze';
import {
  single,
  REFERENCE_FETCHED,
  REFERENCE_CLEAR,
  REFERENCE_STATUS,
} from '../src';
import {
  STATUS,
  validationStatus,
  busyStatus,
  createStatus,
} from '../src/status';

describe('Single reducer', () => {
  it('has a valid initial state', () => {
    const testReducer = single('test', 'test');
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
    const reducer = single(schema, tag, initialValue);
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

  it('ignores action with different schema', () => {
    const initialValue = '';
    const items = [
      { id: 1 },
    ];
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = single(schema, tag, initialValue);
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
    const reducer = single(schema, tag, initialValue);
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
    const reducer = single(schema, tag, initialValue);
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

  it('overwrites value of single on fetch', () => {
    const initialValue = 1;
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = single(schema, tag, initialValue);
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
    const reducer = single(schema, tag, initialValue);
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

  it('change single status to busy with non-broadcast status', () => {
    const initialValue = 1;
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = single(schema, tag, initialValue);
    const otherTag = 'other_tag';
    const otherReducer = single(schema, otherTag, initialValue);
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
    expect(() => single(schema, tag, initialValue))
      .to.throw('Tag value \'*\' is reserved for redux-api-state and cannot be used.');
  });

  it('clears single', () => {
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

    const reducer = single(schema, tag, initialValue);
    deepFreeze(initialValue);
    const nextState = reducer(undefined, action);

    expect(nextState.value).to.deep.equal(initialValue);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.VALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
  });

  it('adds status to single state without status', () => {
    const initialValue = -1;
    const items = [
      { id: 1 },
    ];
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = single(schema, tag, initialValue);
    deepFreeze(initialValue);

    const action = {
      type: 'unknown action',
      meta: {
        schema,
        tag,
      },
      payload: items,
    };

    const customState = {};
    const nextState = reducer(customState, action);
    expect(nextState.value).to.deep.equal(initialValue);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.NONE);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
  });
});
