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
    expect(rio.resourcePaths).to.be.deep.equal({ 'test': [] });
  });

  it('has a valid initial state on batched action', () => {
    const testReducer = enableRio(storage('test'));
    const state = testReducer(undefined, batchActions([{}]));

    expect(state).to.shallowDeepEqual({});
    expect(rio.denormalizer).to.be.an.instanceof(ReduxApiStateDenormalizer);
    expect(rio.resourcePaths).to.be.deep.equal({ 'test': [] });
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
    expect(rio.resourcePaths).to.deep.equal(expectedSchemaPaths);
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
    expect(rio.resourcePaths).to.deep.equal(expectedSchemaPaths);
  });

  it('keeps existing paths of storage map during repeated discovery', () => {
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
    expect(rio.resourcePaths).to.deep.equal(expectedSchemaPaths);

    const userReducerRepeated = combineReducers({
      locationsStorageRepeated: storage('locations'),
      interestsStorageRepeated: storage('interests'),
      weather: storage('weather'),
    });

    const testReducerRepeated = combineReducers({
      usersRepeated: userReducerRepeated,
      carsStorageRepeated: storage('cars'),
    });

    const expectedSchemaPathsRepeated = {
      'locations': ['users', 'locationsStorage'],
      'interests': ['users', 'interestsStorage'],
      'weather': ['usersRepeated', 'weather'],
      'cars': ['carsStorage']
    };

    const testBatchedReducerRepeated = enableRio(testReducerRepeated, true);
    const stateRepeated = testBatchedReducerRepeated(undefined, batchActions([{}]));

    expect(stateRepeated).to.shallowDeepEqual({});
    expect(rio.denormalizer).to.be.an.instanceof(ReduxApiStateDenormalizer);
    expect(rio.resourcePaths).to.deep.equal(expectedSchemaPathsRepeated);
  });

  it('clears existing paths of storage map during repeated discovery', () => {
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
    expect(rio.resourcePaths).to.deep.equal(expectedSchemaPaths);

    const userReducerRepeated = combineReducers({
      locationsStorageRepeated: storage('locations'),
      interestsStorageRepeated: storage('interests'),
      weather: storage('weather'),
    });

    const testReducerRepeated = combineReducers({
      usersRepeated: userReducerRepeated,
      carsStorageRepeated: storage('cars'),
    });

    const expectedSchemaPathsRepeated = {
      'locations': ['usersRepeated', 'locationsStorageRepeated'],
      'interests': ['usersRepeated', 'interestsStorageRepeated'],
      'weather': ['usersRepeated', 'weather'],
      'cars': ['carsStorageRepeated']
    };

    const testBatchedReducerRepeated = enableRio(testReducerRepeated, false);
    const stateRepeated = testBatchedReducerRepeated(undefined, batchActions([{}]));

    expect(stateRepeated).to.shallowDeepEqual({});
    expect(rio.denormalizer).to.be.an.instanceof(ReduxApiStateDenormalizer);
    expect(rio.resourcePaths).to.deep.equal(expectedSchemaPathsRepeated);
  });
});
