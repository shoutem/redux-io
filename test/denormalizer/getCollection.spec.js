/* eslint-disable no-unused-expressions */
import _ from 'lodash';
import { combineReducers } from 'redux';
import sinon from 'sinon';
import chai, { expect } from 'chai';
import shallowDeepEqual from 'chai-shallow-deep-equal';
import { batchActions } from 'redux-batched-actions';
import rio, {
  enableRio,
  storage,
  collection,
  getCollection,
} from '../../src';
import {
  STATUS,
  createStatus,
} from '../../src/status';

chai.use(shallowDeepEqual);

describe('getCollection', () => {
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
  initialData.locations[1][STATUS] = createStatus();
  initialData.locations[2][STATUS] = createStatus();
  initialData.locations[3][STATUS] = createStatus();
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

  beforeEach(() => {
    sinon.spy(console, 'warn');
  });


  afterEach(() => {
    rio.clear();
    console.warn.restore();
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
      .to.throw('State argument is invalid, should be an object.');
  });

  it('on invalid schema throws appropriate error', () => {
    const state = initializeState();
    expect(() => getCollection(initialData.topLocations, state))
    .to.throw(
      'Missing schema name in getCollection or getOne function. Schema needs to'
      + ' be defined in reference or as argument.'
    );
  });

  it('on invalid collection throws appropriate error', () => {
    const state = initializeState();
    expect(() => getCollection({}, state))
      .to.throw('Collection argument needs to be array.');
  });

  it('warns that schema is defined in collection an via argument', () => {
    const state = initializeState();

    expect(state.topLocations).to.shallowDeepEqual(initialData.topLocations);
    expect(state.users.locationsStorage).to.shallowDeepEqual(initialData.locations);

    const denormalizedTopLocations = getCollection(state.topLocations, state, 'locations');
    expect(denormalizedTopLocations).to.have.length(2);
    expect(denormalizedTopLocations).to.be.shallowDeepEqual(expectedDenormalizedTopLocations);

    expect(console.warn.calledOnce).to.be.true;
    expect(console.warn.calledWith(
      `getCollection or getOne gets both reference schema (locations)`
      + ` and argument schema (locations). Reference schema has priority`
      + ' over schema argument.'
    )).to.be.true;

  });

  it('on state without storage for requested schema', () => {
    const state = initializeState();
    const missingSchema = 'missing_schema';
    expect(() => getCollection(initialData.topLocations, state, missingSchema))
      .to.throw(`Storage for resolved schema ${missingSchema} doesn't exists in state.`);
  });
});
