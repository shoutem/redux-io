import { expect } from 'chai';
import deepFreeze from 'deep-freeze';
import {
  collection,
  COLLECTION_FETCHED,
  COLLECTION_INVALIDATE,
} from '../src';

describe('Collection reducer', () => {
  it('has a valid initial state', () => {
    const testReducer = collection('test', 'test');
    expect(testReducer(undefined, {})).to.eql([]);
  });

  it('adds collection of indices on Fetch', () => {
    const initialState = [];
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    deepFreeze(initialState);
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, initialState);

    const action = {
      type: COLLECTION_FETCHED,
      meta: {
        schema,
        tag,
      },
      payload: items,
    };

    const nextState = reducer(initialState, action);
    const expectedState = items.map(item => item.id);

    expect(nextState).to.eql(expectedState);
  });

  it('ignores action with different schema', () => {
    const initialState = [];
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    deepFreeze(initialState);
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, initialState);

    const action = {
      type: COLLECTION_FETCHED,
      meta: {
        schema: 'test2',
        tag,
      },
      payload: items,
    };

    const nextState = reducer(initialState, action);
    expect(nextState).to.equal(initialState);
  });

  it('ignores action with different action type', () => {
    const initialState = [];
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    deepFreeze(initialState);
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, initialState);

    const action = {
      type: 'COLLECTION_FETCHED',
      meta: {
        schema,
        tag,
      },
      payload: items,
    };

    const nextState = reducer(initialState, action);
    expect(nextState).to.equal(initialState);
  });

  it('ignores action with different collection type', () => {
    const initialState = [];
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    deepFreeze(initialState);
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, initialState);

    const action = {
      type: COLLECTION_FETCHED,
      meta: {
        schema,
        tag: 'collection2',
      },
      payload: items,
    };

    const nextState = reducer(initialState, action);
    expect(nextState).to.equal(initialState);
  });

  it('re-populates list of indicies on fetch', () => {
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const initialState = items;
    deepFreeze(initialState);
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, initialState);

    const itemsNew = [
      { id: 3 },
      { id: 4 },
    ];
    const action = {
      type: COLLECTION_FETCHED,
      meta: {
        schema,
        tag,
      },
      payload: itemsNew,
    };

    const nextState = reducer(initialState, action);
    const expectedState = itemsNew.map(item => item.id);
    expect(nextState).to.eql(expectedState);
  });

  it('clears list of ids on create', () => {
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const initialState = items;
    deepFreeze(initialState);
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, initialState);

    const action = {
      type: COLLECTION_INVALIDATE,
      meta: {
        schema,
        tag: '',
      },
    };

    const nextState = reducer(initialState, action);
    const expectedState = [];
    expect(nextState).to.eql(expectedState);
  });
});
