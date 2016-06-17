/* eslint-disable no-unused-expressions */
import _ from 'lodash';
import { expect } from 'chai';
import { batchActions } from 'redux-batched-actions';
import {
  rioReducer,
  storage,
} from '../src';

describe('Rio reducer', () => {
  it('has a valid initial state', () => {
    const testReducer = rioReducer(storage('test'));
    const state = testReducer(undefined, {});
    expect(state).to.deep.equal({});
  });

  it('has a valid initial state on batched action', () => {
    const testReducer = rioReducer(storage('test'));
    const state = testReducer(undefined, batchActions([{}]));
    expect(state).to.deep.equal({});
  });
});
