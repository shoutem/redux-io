import { expect } from 'chai';
import deepFreeze from 'deep-freeze';
import {
  storage,
  OBJECT_CREATED,
  OBJECT_FETCHED,
  OBJECT_REMOVED,
} from '../src';

describe('Storage reducer', () => {
  it('has a valid initial state', () => {
    const testReducer = storage('test');
    expect(testReducer(undefined, {})).to.deep.equal({});
  });

  it('adds item to state on Fetch', () => {
    const initialState = {};
    const item = { id: 1 };
    const schema = 'schema_test';
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        schema,
      },
      payload: item,
    };
    deepFreeze(initialState);
    const reducer = storage(schema, initialState);

    const nextState = reducer(initialState, action);
    const expectedState = { [item.id]: item };

    expect(nextState).to.deep.equal(expectedState);
  });

  it('adds item to state on Create', () => {
    const initialState = {};
    const item = { id: 1 };
    const schema = 'schema_test';
    const action = {
      type: OBJECT_CREATED,
      meta: {
        schema,
      },
      payload: item,
    };
    deepFreeze(initialState);
    const reducer = storage(schema, initialState);

    const nextState = reducer(initialState, action);
    const expectedState = { [item.id]: item };

    expect(nextState).to.deep.equal(expectedState);
  });

  it('removes item from state on Delete', () => {
    const initialState = {
      '1': { id: 1 },
      '2': { id: 2 },
    };
    const schema = 'schema_test';
    const action = {
      type: OBJECT_REMOVED,
      payload: { id: 1 },
      meta: {
        schema,
      },
    };
    deepFreeze(initialState);
    const reducer = storage(schema, initialState);
    const nextState = reducer(initialState, action);
    const expectedState = {
      '2': { id: 2 },
    };

    expect(nextState).to.deep.equal(expectedState);
  });

  it('ignores action with different schema type', () => {
    const initialState = {};
    const item = { id: 1 };
    const schema = 'schema_test';
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        schema: 'test2',
      },
      payload: item,
    };
    deepFreeze(initialState);
    const reducer = storage(schema, initialState);
    const nextState = reducer(initialState, action);

    expect(nextState).to.equal(initialState);
    expect(nextState).to.deep.equal(initialState);
  });

  it('ignores action with different action type', () => {
    const initialState = {};
    const item = { id: 1 };
    const schema = 'schema_test';
    const action = {
      type: 'OBJECT_FETCHED',
      meta: {
        schema,
      },
      payload: item,
    };
    deepFreeze(initialState);
    const reducer = storage(schema, initialState);
    const nextState = reducer(initialState, action);

    expect(nextState).to.equal(initialState);
    expect(nextState).to.deep.equal(initialState);
  });

  it('replaces object with same id in storage', () => {
    const item = { id: 1, value: 'a' };
    const initialState = { [item.id]: item };
    deepFreeze(initialState);
    const schema = 'schema_test';
    const reducer = storage(schema, initialState);

    const itemNew = { id: 1, value: 'b' };
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        schema,
      },
      payload: itemNew,
    };

    const nextState = reducer(initialState, action);
    const expectedState = { [itemNew.id]: itemNew };
    expect(nextState).to.deep.equal(expectedState);
  });

  it('keeps object with different id in storage', () => {
    const item1 = { id: 1, value: 'a' };
    const initialState = { [item1.id]: item1 };
    deepFreeze(initialState);
    const schema = 'schema_test';
    const reducer = storage(schema, initialState);

    const item2 = { id: 2, value: 'b' };
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        schema,
      },
      payload: item2,
    };

    const nextState = reducer(initialState, action);
    const expectedState = { [item1.id]: item1, [item2.id]: item2 };
    expect(nextState).to.deep.equal(expectedState);
  });
});
