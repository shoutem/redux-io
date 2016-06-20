/* eslint-disable no-unused-expressions */
import _ from 'lodash';
import { expect } from 'chai';
import {
  mergeReducers,
} from '../src';

function reducerNormal(state = {}, action){
  switch (action.type) {
    case 'test':
      return { ...state, data: action.payload };
    default:
      return state;
  }
}

function reducerOther(state = {}, action){
  switch (action.type) {
    case 'test':
      return { ...state, dataOther: action.payload };
    default:
      return state;
  }
}

function reducerSquare(state = {}, action){
  switch (action.type) {
    case 'test':
      return { ...state, data: action.payload * action.payload };
    default:
      return state;
  }
}

function reducerSquareArray(state = {}, action){
  switch (action.type) {
    case 'test':
      return { ...state, data: action.payload.map(x => x * x) };
    default:
      return state;
  }
}

describe('Merge reducer', () => {
  it('has a valid initial state', () => {
    const testReducer = mergeReducers([
      reducerNormal,
      reducerOther,
    ]);
    const state = testReducer(undefined, {});
    expect(state).to.deep.equal({});
  });

  it('extends state', () => {
    const initialState = {};
    const testReducer = mergeReducers([
      reducerNormal,
      reducerOther,
    ]);

    const action = {
      type: 'test',
      payload: 2,
    };

    const state = testReducer(initialState, action);
    const expectedState = {
      data: 2,
      dataOther: 2,
    };
    expect(state).to.deep.equal(expectedState);
  });

  it('overrides state', () => {
    const initialState = {};
    const testReducer = mergeReducers([
      reducerNormal,
      reducerSquare,
    ]);

    const action = {
      type: 'test',
      payload: 2,
    };

    const state = testReducer(initialState, action);
    const expectedState = {
      data: 4,
    };
    expect(state).to.deep.equal(expectedState);
  });

  it('merge arrays', () => {
    const initialState = {};
    const testReducer = mergeReducers([
      reducerNormal,
      reducerSquareArray,
    ]);

    const action = {
      type: 'test',
      payload: [1, 2],
    };

    const state = testReducer(initialState, action);
    const expectedState = {
      data: [1,4],
    };
    expect(state).to.deep.equal(expectedState);
  });
});
