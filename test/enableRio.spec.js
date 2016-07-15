/* eslint-disable no-unused-expressions */
import _ from 'lodash';
import { combineReducers } from 'redux';
import chai, { expect } from 'chai';
import shallowDeepEqual from 'chai-shallow-deep-equal';
import { batchActions } from 'redux-batched-actions';
import rio, {
  enableRio,
  storage,
  collection,
  chainReducers,
  ReduxApiStateDenormalizer,
} from '../src';

chai.use(shallowDeepEqual);

describe('EnableRio reducer', () => {
  afterEach(() => {
    rio.clear();
  });

  it('has a valid initial state', () => {
    const testReducer = enableRio(storage('test'));
    const state = testReducer(undefined, {});

    expect(state).to.shallowDeepEqual({});
    expect(rio.denormalizer).to.be.an.instanceof(ReduxApiStateDenormalizer);
    expect(rio.schemaPaths).to.be.deep.equal({ 'test': [] });
  });

  it('has a valid initial state on batched action', () => {
    const testReducer = enableRio(storage('test'));
    const state = testReducer(undefined, batchActions([{}]));

    expect(state).to.shallowDeepEqual({});
    expect(rio.denormalizer).to.be.an.instanceof(ReduxApiStateDenormalizer);
    expect(rio.schemaPaths).to.be.deep.equal({ 'test': [] });
  });

  it('has a valid discovery of storage map', () => {
    const userReducer = combineReducers({
      locationsStorage: storage('locations'),
      interestsStorage: storage('interests'),
    });

    const testReducer = combineReducers({
      users: userReducer,
      carsStorage: storage('cars'),
    });

    const expectedSchemaPaths = {
      'locations': ['users', 'locationsStorage'],
      'interests': ['users', 'interestsStorage'],
      'cars': ['carsStorage']
    };

    const testBatchedReducer = enableRio(testReducer);
    const state = testBatchedReducer(undefined, batchActions([{}]));

    expect(state).to.shallowDeepEqual({});
    expect(rio.denormalizer).to.be.an.instanceof(ReduxApiStateDenormalizer);
    expect(rio.schemaPaths).to.deep.equal(expectedSchemaPaths);
  });

  it('has a valid discovery of storage map with collections', () => {
    const userReducer = combineReducers({
      locationsStorage: storage('locations'),
      interestsStorage: storage('interests'),
      favouriteCarsCollection: collection('cars', 'favouriteCars'),
    });

    const testReducer = combineReducers({
      users: userReducer,
      carsStorage: storage('cars'),
      bestLocations: collection('locations', 'best'),
    });

    const expectedSchemaPaths = {
      'locations': ['users', 'locationsStorage'],
      'interests': ['users', 'interestsStorage'],
      'cars': ['carsStorage']
    };

    const testBatchedReducer = enableRio(testReducer);
    const state = testBatchedReducer(undefined, batchActions([{}]));

    expect(state).to.shallowDeepEqual({});
    expect(rio.denormalizer).to.be.an.instanceof(ReduxApiStateDenormalizer);
    expect(rio.schemaPaths).to.deep.equal(expectedSchemaPaths);
  });

  it('has a valid discovery of storage map with chainReducers', () => {
    const userReducer = combineReducers({
      locationsStorage: storage('locations'),
      interestsStorage: storage('interests'),
    });

    const testReducer = combineReducers({
      users: userReducer,
      carsStorage: chainReducers([
        storage('cars'),
        (state, action) => state,
      ]),
    });

    const expectedSchemaPaths = {
      'locations': ['users', 'locationsStorage'],
      'interests': ['users', 'interestsStorage'],
      'cars': ['carsStorage']
    };

    const testBatchedReducer = enableRio(testReducer);
    const state = testBatchedReducer(undefined, batchActions([{}]));

    expect(state).to.shallowDeepEqual({});
    expect(rio.denormalizer).to.be.an.instanceof(ReduxApiStateDenormalizer);
    expect(rio.schemaPaths).to.deep.equal(expectedSchemaPaths);
  });
});
