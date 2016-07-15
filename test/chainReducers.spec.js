/* eslint-disable no-unused-expressions */
import _ from 'lodash';
import { expect } from 'chai';
import {
  chainReducers,
} from '../src';
import {
  reducerNormal,
  reducerOther,
  reducerSquare,
  reducerSquareArray,
} from './helpers/reducers';

describe('Chain reducer', () => {
  it('has a valid initial state', () => {
    const testReducer = chainReducers([
      reducerNormal,
      reducerOther,
    ]);
    const state = testReducer(undefined, {});
    expect(state).to.deep.equal({});
  });

  it('extends state', () => {
    const initialState = {};
    const testReducer = chainReducers([
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
    const testReducer = chainReducers([
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
    const testReducer = chainReducers([
      reducerNormal,
      reducerSquareArray,
    ]);

    const action = {
      type: 'test',
      payload: [1, 2],
    };

    const state = testReducer(initialState, action);
    const expectedState = {
      data: [1, 4],
    };
    expect(state).to.deep.equal(expectedState);
  });
});
