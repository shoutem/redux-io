import chai, { expect } from 'chai';
import shallowDeepEqual from 'chai-shallow-deep-equal';
import deepFreeze from 'deep-freeze';
import {
  collection,
  checkExpiration,
  REFERENCE_FETCHED,
  REFERENCE_CLEAR,
  REFERENCE_STATUS,
} from '../../src';
import {
  STATUS,
  validationStatus,
  busyStatus,
  createStatus,
  setStatus,
} from '../../src/status';

chai.use(shallowDeepEqual);

describe('Collection reducer', () => {
  it('has a valid initial state', () => {
    const testReducer = collection('test', 'test');
    const state = testReducer(undefined, {});
    const expectedStatus = createStatus();

    expect(state[STATUS].validationStatus).to.eql(expectedStatus.validationStatus);
    expect(state[STATUS].busyStatus).to.eql(expectedStatus.busyStatus);
    expect(state[STATUS].schema).to.eql('test');
    expect(state).to.shallowDeepEqual([]);
  });

  it('adds collection of indices on Fetch', () => {
    const initialState = [];
    const items = [
      { id: 1 },
      { id: 2 },
    ];

    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, undefined, initialState);
    deepFreeze(initialState);

    const action = {
      type: REFERENCE_FETCHED,
      meta: {
        schema,
        tag,
      },
      payload: items,
    };

    const nextState = reducer(undefined, action);
    const expectedState = items.map(item => item.id);

    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.VALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
    expect(nextState).to.shallowDeepEqual(expectedState);
  });

  it('adds collection of indices on Fetch event with default tag', () => {
    const items = [
      { id: 1 },
      { id: 2 },
    ];

    const schema = 'schema_test';
    const reducer = collection(schema);

    const action = {
      type: REFERENCE_FETCHED,
      meta: {
        schema,
        tag: '',
      },
      payload: items,
    };

    const nextState = reducer(undefined, action);
    const expectedState = items.map(item => item.id);

    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.VALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
    expect(nextState).to.shallowDeepEqual(expectedState);
  });

  it('appends collection of indices on Fetch event with default tag', () => {
    const initialState = [4, 5];
    const items = [
      { id: 1 },
      { id: 2 },
    ];

    const schema = 'schema_test';
    const reducer = collection(schema);

    const action = {
      type: REFERENCE_FETCHED,
      meta: {
        schema,
        tag: '',
        options: {
          appendMode: true,
        },
      },
      payload: items,
    };

    const nextState = reducer(initialState, action);
    const expectedState = [...initialState, ...items.map(item => item.id)];

    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.VALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
    expect(nextState).to.shallowDeepEqual(expectedState);
  });

  it('ignores action with different schema', () => {
    const initialState = [];
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, undefined, initialState);
    deepFreeze(initialState);

    const action = {
      type: REFERENCE_FETCHED,
      meta: {
        schema: 'test2',
        tag,
      },
      payload: items,
    };

    const nextState = reducer(undefined, action);
    expect(nextState).to.equal(initialState);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.NONE);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
  });

  it('ignores action with different action type', () => {
    const initialState = [];
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, undefined, initialState);
    deepFreeze(initialState);

    const action = {
      type: 'REFERENCE_FETCHED',
      meta: {
        schema,
        tag,
      },
      payload: items,
    };

    const nextState = reducer(undefined, action);
    expect(nextState).to.equal(initialState);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.NONE);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
  });

  it('ignores action with different collection type', () => {
    const initialState = [];
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, undefined, initialState);
    deepFreeze(initialState);

    const action = {
      type: REFERENCE_FETCHED,
      meta: {
        schema,
        tag: 'collection2',
      },
      payload: items,
    };

    const nextState = reducer(undefined, action);
    expect(nextState).to.equal(initialState);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.NONE);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
  });

  it('re-populates list of indices on fetch', () => {
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const initialState = items;
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, undefined, initialState);
    deepFreeze(initialState);

    const itemsNew = [
      { id: 3 },
      { id: 4 },
    ];
    const action = {
      type: REFERENCE_FETCHED,
      meta: {
        schema,
        tag,
      },
      payload: itemsNew,
    };

    const nextState = reducer(undefined, action);
    const expectedState = itemsNew.map(item => item.id);

    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.VALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
    expect(nextState).to.shallowDeepEqual(expectedState);
  });

  it('saves the find params in the collection status on Fetch', () => {
    const initialState = [];
    const items = [
      { id: 1 },
      { id: 2 },
    ];

    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, undefined, initialState);
    deepFreeze(initialState);

    const params = {
      param1: '1',
      param2: '2,',
      nestedParam: {
        childParam: 'child',
      },
    };

    const action = {
      type: REFERENCE_FETCHED,
      meta: {
        schema,
        tag,
        params,
      },
      payload: items,
    };

    const nextState = reducer(undefined, action);
    const expectedState = items.map(item => item.id);

    expect(nextState[STATUS].params).to.deep.equal(params);
    expect(nextState).to.shallowDeepEqual(expectedState);
  });

  it('invalidates collection with broadcast status', () => {
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const initialState = items;
    const schema = 'schema_test';
    const tag = 'tag_value';
    const reducer = collection(schema, tag, undefined, initialState);
    initialState[STATUS].validationStatus = validationStatus.VALID;
    deepFreeze(initialState);

    const action = {
      type: REFERENCE_STATUS,
      payload: { validationStatus: validationStatus.INVALID, busyStatus: busyStatus.IDLE },
      meta: {
        schema,
        tag: '*',
      },
    };

    const nextState = reducer(undefined, action);

    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.INVALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);

    nextState[STATUS] = initialState[STATUS];
    expect(nextState).to.deep.eql(initialState);
  });

  it('change collection status to busy with non-broadcast status', () => {
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const initialState = items;
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, undefined, initialState);
    const otherTag = 'other_tag';
    const otherReducer = collection(schema, otherTag, undefined, initialState);
    deepFreeze(initialState);

    const action = {
      type: REFERENCE_STATUS,
      payload: { busyStatus: busyStatus.BUSY },
      meta: {
        schema,
        tag,
      },
    };

    const nextState = reducer(undefined, action);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.NONE);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.BUSY);

    const nextOtherState = otherReducer(undefined, action);
    expect(nextOtherState[STATUS].validationStatus).to.eql(validationStatus.NONE);
    expect(nextOtherState[STATUS].busyStatus).to.eql(busyStatus.IDLE);

    expect(nextOtherState).to.deep.eql(initialState);
  });

  it('throws exception on reserved tag value', () => {
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const initialState = items;
    const schema = 'schema_test';
    const tag = '*';
    expect(() => collection(schema, tag, undefined, initialState))
      .to.throw('Tag value \'*\' is reserved for redux-io and cannot be used.');
  });

  it('clears collection', () => {
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const initialState = items;
    const schema = 'schema_test';
    const tag = 'tag_test';

    const action = {
      type: REFERENCE_CLEAR,
      meta: {
        schema,
        tag,
      },
    };

    const reducer = collection(schema, tag, undefined, initialState);
    deepFreeze(initialState);
    const nextState = reducer(undefined, action);

    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.VALID);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
    expect(nextState).to.shallowDeepEqual([]);
  });

  it('adds status to collection state without status', () => {
    const initialState = [];
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, undefined, initialState);
    deepFreeze(initialState);

    const action = {
      type: 'unknown action',
      meta: {
        schema,
        tag,
      },
      payload: items,
    };

    const customState = [];
    deepFreeze(customState);
    const nextState = reducer(customState, action);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.NONE);
    expect(nextState[STATUS].busyStatus).to.eql(busyStatus.IDLE);
    expect(nextState[STATUS].schema).to.eql(schema);
    expect(nextState[STATUS].type).to.eql('collection');
    expect(nextState).to.shallowDeepEqual(customState);
  });

  it('invalidates collection', () => {
    const initialState = [
      { id: 1 },
      { id: 2 },
    ];
    const schema = 'schema_test';
    const reducer = collection(schema, '', undefined, initialState);
    initialState[STATUS].validationStatus = validationStatus.VALID;
    deepFreeze(initialState);

    const action = {
      type: REFERENCE_STATUS,
      meta: {
        schema,
        tag: '*',
      },
      payload: { validationStatus: validationStatus.INVALID },
    };
    const nextState = reducer(undefined, action);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.INVALID);

    nextState[STATUS] = initialState[STATUS];
    expect(nextState).to.deep.eql(initialState);
  });

  it('invalidates collection by tag', () => {
    const initialState = [
      { id: 1 },
      { id: 2 },
    ];
    const schema = 'schema_test';
    const tag = 'tag_test'
    const reducer = collection(schema, tag, undefined, initialState);
    initialState[STATUS].validationStatus = validationStatus.VALID;
    deepFreeze(initialState);

    const action = {
      type: REFERENCE_STATUS,
      meta: {
        schema,
        tag,
      },
      payload: { validationStatus: validationStatus.INVALID },
    };
    const nextState = reducer(undefined, action);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.INVALID);

    nextState[STATUS] = initialState[STATUS];
    expect(nextState).to.deep.eql(initialState);
  });

  it('cannot invalidate collection with different tag', () => {
    const initialState = [
      { id: 1 },
      { id: 2 },
    ];
    const schema = 'schema_test';
    const tag = 'tag_test'
    const reducer = collection(schema, tag, undefined, initialState);
    initialState[STATUS].validationStatus = validationStatus.VALID;
    deepFreeze(initialState);

    const action = {
      type: REFERENCE_STATUS,
      meta: {
        schema,
        tag: 'custom_test',
      },
      payload: { validationStatus: validationStatus.INVALID },
    };
    const nextState = reducer(undefined, action);
    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.VALID);
  });

  it('cannot invalidate un-initialized collection', () => {
    const initialState = [
      { id: 1 },
      { id: 2 },
    ];
    const schema = 'schema_test';
    const reducer = collection(schema, '', undefined, initialState);
    deepFreeze(initialState);

    const action = {
      type: REFERENCE_STATUS,
      meta: {
        schema,
        tag: '*',
      },
      payload: { validationStatus: validationStatus.INVALID },
    };
    const nextState = reducer(undefined, action);

    expect(nextState[STATUS].validationStatus).to.eql(validationStatus.NONE);

    nextState[STATUS] = initialState[STATUS];
    expect(nextState).to.deep.eql(initialState);
  });

  it('sets additional settings to status', () => {
    const settingValue = 1000;
    const reducer = collection('schema', 'tag', { setting: settingValue });
    const state = reducer(undefined, {});
    const collectionStatus = state[STATUS];
    expect(collectionStatus.setting).to.equal(settingValue);
    expect(collectionStatus.id).to.be.ok;
    expect(collectionStatus.tag).to.be.ok;
    expect(collectionStatus.schema).to.be.ok;
    expect(collectionStatus.type).to.be.ok;
  });

  describe('CHECK_EXPIRATION', () => {
    it('change collection validationStatus to invalid if expired', () => {
      const expirationTime = 1;
      const items = [
        { id: 1 },
        { id: 2 },
      ];
      const initialState = items;
      const schema = 'schema_test';
      const tag = 'tag_test';
      const reducer = collection(schema, tag, { expirationTime }, initialState);

      const state = reducer(undefined, undefined);
      // Fake modification
      state[STATUS].modifiedTimestamp = Date.now() - (expirationTime * 1000 + 1);

      const action = checkExpiration();
      const nextState = reducer(state, action);

      expect(nextState[STATUS].validationStatus).to.eql(validationStatus.INVALID);
      expect(nextState === state).to.be.not.ok;
    });

    it('does not change anything beside validationStatus if invalid', () => {
      const expirationTime = 1;
      const items = [
        { id: 1 },
        { id: 2 },
      ];
      const initialState = items;
      const schema = 'schema_test';
      const tag = 'tag_test';
      const reducer = collection(schema, tag, { expirationTime }, initialState);

      const state = reducer(undefined, undefined);
      // Fake modification
      state[STATUS].modifiedTimestamp = Date.now() - (expirationTime * 1000 + 1);

      const action = checkExpiration();
      const nextState = reducer(state, action);

      const expectedState = [...state];
      setStatus(expectedState, {
        ...state[STATUS],
        // Validation status gets updated
        validationStatus: validationStatus.INVALID
      });

      expect(nextState).to.eql(expectedState);
    });

    it('does not create new reference if not expired', () => {
      const expirationTime = 10;
      const items = [
        { id: 1 },
        { id: 2 },
      ];
      const initialState = items;
      const schema = 'schema_test';
      const tag = 'tag_test';
      const reducer = collection(schema, tag, { expirationTime }, initialState);
      deepFreeze(initialState);

      const state = reducer(undefined, undefined);

      const action = checkExpiration();
      const nextState = reducer(state, action);

      expect(state === nextState).to.be.ok;
    });
  });
});
