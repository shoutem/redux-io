import { expect } from 'chai';
import deepFreeze from 'deep-freeze';
import {
  collection,
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

describe('Collection reducer', () => {
  it('has a valid initial state', () => {
    const testReducer = collection('test', 'test');
    const state = testReducer(undefined, {});
    const expectedStatus = createStatus();

    expect(state[STATUS].validationStatus).to.eql(expectedStatus.validationStatus);
    expect(state[STATUS].busyStatus).to.eql(expectedStatus.busyStatus);
    delete state[STATUS];
    expect(state).to.eql([]);
  });

  it('adds collection of indices on Fetch', () => {
    const initialState = [];
    const items = [
      { id: 1 },
      { id: 2 },
    ];

    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, initialState);
    deepFreeze(initialState);

    const action = {
      type: REFERENCE_FETCHED,
      meta: {
        schema,
        tag,
      },
      payload: items,
    };

    const nextState = reducer(undefined, action);
    const expectedState = items.map(item => item.id);

    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.VALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
    delete nextState[STATUS];
    expect(nextState).to.eql(expectedState);
  });

  it('ignores action with different schema', () => {
    const initialState = [];
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, initialState);
    deepFreeze(initialState);

    const action = {
      type: REFERENCE_FETCHED,
      meta: {
        schema: 'test2',
        tag,
      },
      payload: items,
    };

    const nextState = reducer(undefined, action);
    expect(nextState).to.equal(initialState);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.NONE);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
  });

  it('ignores action with different action type', () => {
    const initialState = [];
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, initialState);
    deepFreeze(initialState);

    const action = {
      type: 'REFERENCE_FETCHED',
      meta: {
        schema,
        tag,
      },
      payload: items,
    };

    const nextState = reducer(undefined, action);
    expect(nextState).to.equal(initialState);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.NONE);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
  });

  it('ignores action with different collection type', () => {
    const initialState = [];
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, initialState);
    deepFreeze(initialState);

    const action = {
      type: REFERENCE_FETCHED,
      meta: {
        schema,
        tag: 'collection2',
      },
      payload: items,
    };

    const nextState = reducer(undefined, action);
    expect(nextState).to.equal(initialState);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.NONE);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
  });

  it('re-populates list of indicies on fetch', () => {
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const initialState = items;
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, initialState);
    deepFreeze(initialState);

    const itemsNew = [
      { id: 3 },
      { id: 4 },
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
    const expectedState = itemsNew.map(item => item.id);

    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.VALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
    delete nextState[STATUS];
    expect(nextState).to.eql(expectedState);
  });

  it('invalidates collection with broadcast status', () => {
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const initialState = items;
    const schema = 'schema_test';
    const tag = 'tag_value';
    const reducer = collection(schema, tag, initialState);
    deepFreeze(initialState);

    const action = {
      type: REFERENCE_STATUS,
      payload: { validationStatus: validationStatus.INVALID, busyStatus: busyStatus.IDLE },
      meta: {
        schema,
        tag: '*',
      },
    };

    const nextState = reducer(undefined, action);

    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.INVALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);

    nextState[STATUS] = initialState[STATUS];
    expect(nextState).to.deep.eql(initialState);
  });

  it('change collection status to busy with non-broadcast status', () => {
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const initialState = items;
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, initialState);
    const otherTag = 'other_tag';
    const otherReducer = collection(schema, otherTag, initialState);
    deepFreeze(initialState);

    const action = {
      type: REFERENCE_STATUS,
      payload: { busyStatus: busyStatus.BUSY },
      meta: {
        schema,
        tag,
      },
    };

    const nextState = reducer(undefined, action);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.NONE);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.BUSY);

    const nextOtherState = otherReducer(undefined, action);
    expect(nextOtherState[STATUS].validationStatus).to.eql(validationStatus.NONE);
    expect(nextOtherState[STATUS].busyStatus).to.eql(busyStatus.IDLE);

    expect(nextOtherState).to.deep.eql(initialState);
  });

  it('throws exception on reserved tag value', () => {
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const initialState = items;
    const schema = 'schema_test';
    const tag = '*';
    expect(() => collection(schema, tag, initialState))
      .to.throw('Tag value \'*\' is reserved for redux-api-state and cannot be used.');
  });

  it('clears collection', () => {
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const initialState = items;
    const schema = 'schema_test';
    const tag = 'tag_test';

    const action = {
      type: REFERENCE_CLEAR,
      meta: {
        schema,
        tag,
      },
    };

    const reducer = collection(schema, tag, initialState);
    deepFreeze(initialState);
    const nextState = reducer(undefined, action);

    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.VALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
    delete nextState[STATUS];
    expect(nextState).to.deep.equal([]);
  });

  it('adds status to collection state without status', () => {
    const initialState = [];
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, initialState);
    deepFreeze(initialState);

    const action = {
      type: 'unknown action',
      meta: {
        schema,
        tag,
      },
      payload: items,
    };

    const customState = [];
    const nextState = reducer(customState, action);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.NONE);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
    delete nextState[STATUS];
    expect(nextState).to.deep.equal(customState);
  });
});
