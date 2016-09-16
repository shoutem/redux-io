/* eslint-disable no-unused-expressions */
import { combineReducers } from 'redux';
import sinon from 'sinon';
import chai, { expect } from 'chai';
import shallowDeepEqual from 'chai-shallow-deep-equal';
import { batchActions } from 'redux-batched-actions';
import rio, {
  enableRio,
  storage,
  one,
  getOne,
} from '../../src';
import {
  STATUS,
  createStatus,
} from '../../src/status';

chai.use(shallowDeepEqual);

describe('getOne', () => {
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
    topLocation: { value: 1 },
  };
  initialData.locations[1][STATUS] = createStatus();
  initialData.locations[2][STATUS] = createStatus();
  initialData.locations[3][STATUS] = createStatus();
  const expectedDenormalizedTopLocation = {
    id: 1,
    type: 'locations',
    name: 'London',
  };

  const initializeState = () => {
    const userReducer = combineReducers({
      locationsStorage: storage('locations', { ...initialData.locations }),
      interestsStorage: storage('interests'),
    });
    const testReducer = combineReducers({
      users: userReducer,
      carsStorage: storage('cars'),
      topLocation: one('locations', 'topLocation', initialData.topLocation.value),
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

  it('denormalize one', () => {
    const state = initializeState();

    expect(state.topLocation).to.shallowDeepEqual(initialData.topLocation);
    expect(state.users.locationsStorage).to.shallowDeepEqual(initialData.locations);

    const denormalizedTopLocation = getOne(state.topLocation, state);
    expect(denormalizedTopLocation).to.be.shallowDeepEqual(expectedDenormalizedTopLocation);
  });

  it('denormalize primitive', () => {
    const state = initializeState();

    expect(state.topLocation).to.shallowDeepEqual(initialData.topLocation);
    expect(state.users.locationsStorage).to.shallowDeepEqual(initialData.locations);

    const denormalizedLocation = getOne(1, state, 'locations');
    expect(denormalizedLocation).to.be.shallowDeepEqual(expectedDenormalizedTopLocation);
  });

  it('on invalid state throws appropriate error', () => {
    expect(() => getOne(initialData.topLocation, '', 'locations'))
      .to.throw('State argument is invalid, should be an object.');
  });

  it('on invalid schema throws appropriate error', () => {
    const state = initializeState();
    expect(() => getOne(initialData.topLocation, state))
      .to.throw(
      'Missing schema name in getCollection or getOne function. Schema needs to'
      + ' be defined in reference or as argument.'
    );
  });

  it('on invalid one throws appropriate error', () => {
    const state = initializeState();
    expect(() => getOne([], state))
      .to.throw('One must be object or primitive value');
  });

  it('warns that schema is defined in one an via argument', () => {
    const state = initializeState();

    expect(state.topLocation).to.shallowDeepEqual(initialData.topLocation);
    expect(state.users.locationsStorage).to.shallowDeepEqual(initialData.locations);

    const denormalizedTopLocation = getOne(state.topLocation, state, 'locations');
    expect(denormalizedTopLocation).to.be.shallowDeepEqual(expectedDenormalizedTopLocation);

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
    expect(() => getOne(initialData.topLocation, state, missingSchema))
      .to.throw(`Storage for resolved schema ${missingSchema} doesn't exists in state.`);
  });
});
