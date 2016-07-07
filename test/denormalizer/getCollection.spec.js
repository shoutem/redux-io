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
  getCollection,
} from '../../src';

chai.use(shallowDeepEqual);

function initializeState() {
  const userReducer = combineReducers({
    locationsStorage: storage('locations', initialData.locations),
    interestsStorage: storage('interests'),
  });
  const testReducer = combineReducers({
    users: userReducer,
    carsStorage: storage('cars'),
    topLocations: collection('locations', 'topLocations', initialData.topLocations),
  });

  const testBatchedReducer = enableRio(testReducer);
  return testBatchedReducer(undefined, batchActions([{}]));
}

describe('EnableRio reducer', () => {
  const initialData = {
    locations: {
      1: {
        id: 1,
        type: 'locations',
        attributes: {
          name: 'London',
        },
      },
      2: {
        id: 2,
        type: 'locations',
        attributes: {
          name: 'Zagreb',
        }
      },
      3: {
        id: 3,
        type: 'locations',
        attributes: {
          name: 'New York',
        }
      },
    },
    topLocations: [1,3],
  };
  const expectedDenormalizedTopLocations = [
    {
      id: 1,
      type: 'locations',
      name: 'London',
    },
    {
      id: 3,
      type: 'locations',
      name: 'New York',
    },
  ];

  const initializeState = () => {
    const userReducer = combineReducers({
      locationsStorage: storage('locations', { ...initialData.locations }),
      interestsStorage: storage('interests'),
    });
    const testReducer = combineReducers({
      users: userReducer,
      carsStorage: storage('cars'),
      topLocations: collection('locations', 'topLocations', [...initialData.topLocations]),
    });

    const testBatchedReducer = enableRio(testReducer);
    return testBatchedReducer(undefined, batchActions([{}]));
  };

  afterEach(() => {
    rio.clear();
  });

  it('denormalize collection', () => {
    const state = initializeState();

    expect(state.topLocations).to.shallowDeepEqual(initialData.topLocations);
    expect(state.users.locationsStorage).to.shallowDeepEqual(initialData.locations);

    const denormalizedTopLocations = getCollection(state.topLocations, state);
    expect(denormalizedTopLocations).to.have.length(2);
    expect(denormalizedTopLocations).to.be.shallowDeepEqual(expectedDenormalizedTopLocations);
  });

  it('denormalize array', () => {
    const state = initializeState();

    expect(state.topLocations).to.shallowDeepEqual(initialData.topLocations);
    expect(state.users.locationsStorage).to.shallowDeepEqual(initialData.locations);

    const denormalizedTopLocations = getCollection(initialData.topLocations, state, 'locations');
    expect(denormalizedTopLocations).to.have.length(2);
    expect(denormalizedTopLocations).to.be.shallowDeepEqual(expectedDenormalizedTopLocations);
  });

  it('on invalid state throws appropriate error', () => {
    expect(() => getCollection(initialData.topLocations, '', 'locations'))
      .to.throw('State is invalid, should be an object.');
  });

  it('on invalid schema throws appropriate error', () => {
    const state = initializeState();
    expect(() => getCollection(initialData.topLocations, state))
      .to.throw(
      `Schema name is invalid. Check collection
      configuration or passed schema argument`
    );
  });

  it('on invalid collection throws appropriate error', () => {
    const state = initializeState();
    expect(() => getCollection({}, state))
      .to.throw('Collection argument needs to be array.');
  });

  it('on state without storage for requested schema', () => {
    const state = initializeState();
    const missingSchema = 'missing_schema';
    expect(() => getCollection(initialData.topLocations, state, missingSchema))
      .to.throw(`Storage for resolved schema ${missingSchema} doesn't exists in state.`);
  });
});
