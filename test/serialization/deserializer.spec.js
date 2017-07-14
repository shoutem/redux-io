import { assert } from 'chai';
import _ from 'lodash';
import {
  fromSerializableFormat,
  toSerializableFormat,
} from '../../src/serialization';
import {
  STATUS,
  setStatus,
  getStatus,
  hasStatus,
} from '../../src/status';
import deepFreeze from 'deep-freeze';

describe('fromSerializableFormat', () => {
  it('restores status from serialized data', () => {
    const status = {
      testNumber: 1,
      testString: 'Test'
    };

    const storage = {
      test: 'test',
    };

    setStatus(storage, status);
    const state = {
      storage,
    };

    const serializedState = toSerializableFormat(state);
    const deserializedState = fromSerializableFormat(serializedState);
    assert.deepEqual(getStatus(deserializedState.storage), status);
  });

  it('transform "object array" to array', () => {
    const state = {
      arr: [1,2,3],
    };
    const serializedState = toSerializableFormat(state);
    const deserializedState = fromSerializableFormat(serializedState);
    assert.deepEqual(state, deserializedState);
  });

  it('restore object array status in state', () => {
    const status = {
      testNumber: 1,
      testString: 'Test',
    };
    const collection = [1,2,3];

    setStatus(collection, status);
    const state = {
      collection,
    };

    deepFreeze(state);

    const serializedState = toSerializableFormat(state);
    const deserializedState = fromSerializableFormat(serializedState);
    assert.deepEqual(getStatus(deserializedState.collection), status);
  });

  it('restore multiple various arrays and objects in state', () => {
    const status1 = {
      testNumber: 1,
      testString: 'Test1',
    };
    const collection1 = [1,2,3];
    setStatus(collection1, status1);

    const status2 = {
      testNumber: 2,
      testString: 'Test2',
    };
    const collection2 = [4,5,6];
    setStatus(collection2, status2);

    const status3 = {
      testNumber: 3,
      testString: 'Test3'
    };
    const storage3 = {
      test: 'test3',
    };
    setStatus(storage3, status3);

    const status4 = {
      testNumber: 4,
      testString: 'Test4'
    };
    const storage4 = {
      test: 'test4',
    };
    setStatus(storage4, status4);

    const state = {
      storage3,
      storage4,
      collection1,
      collection2,
    };

    deepFreeze(state);

    const serializedState = toSerializableFormat(state);
    const deserializedState = fromSerializableFormat(serializedState);

    assert.deepEqual(deserializedState, state);
    assert.deepEqual(getStatus(deserializedState.collection1), status1);
    assert.deepEqual(getStatus(deserializedState.collection2), status2);
    assert.deepEqual(deserializedState.storage3[STATUS], status3);
    assert.deepEqual(getStatus(deserializedState.storage4), status4);
  });

  it('restore object array status', () => {
    const status = {
      testNumber: 1,
      testString: 'Test'
    };
    const collection = [1,2,3];
    setStatus(collection, status);

    deepFreeze(collection);

    const serializedCollection = toSerializableFormat(collection);
    const deserializedCollection = fromSerializableFormat(serializedCollection);
    assert.deepEqual(getStatus(deserializedCollection), status);
  });

  it('doesn\'t change objects', () => {
    const state = {
      storage: {
        a: 1,
      },
      b: ['a', 1],
      c: 2,
      d: 'string',
    };
    const serializedState = toSerializableFormat(state);
    const deserializedState = fromSerializableFormat(serializedState);
    assert.deepEqual(deserializedState, state);
  });

  it('leave ordinary array as is, regardless of depth', () => {
    const state = [
      [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ],
      [
        [10, 11, 12],
        [13, 14, 15],
        [16, 17, 18],
      ],
    ];
    const expectedDeserializedState = _.cloneDeep(state);

    const deserializedState = fromSerializableFormat(state);
    assert.deepEqual(deserializedState, expectedDeserializedState);
  });
});
