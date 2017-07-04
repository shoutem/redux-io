import { assert } from 'chai';
import _ from 'lodash';
import {
  fromSerializableFormat,
  toSerializableFormat,
} from '../../src/serialization';
import { STATUS } from '../../src/status';

describe('fromSerializableFormat', () => {
  it('restores status from serialized data', () => {
    const status = {
      testNumber: 1,
      testString: 'Test'
    };
    const state = {
      storage: {
        [STATUS]: status,
      }
    };
    const serializedState = toSerializableFormat(state);
    const deserializedState = fromSerializableFormat(serializedState);
    assert.deepEqual(deserializedState.storage[STATUS], status);
  });

  it('transform "object array" to array', () => {
    const state = {
      arr: [1,2,3],
    };
    const serializedState = toSerializableFormat(state);
    const deserializedState = fromSerializableFormat(serializedState);
    assert.deepEqual(state, deserializedState);
  });

  it('restore object array status', () => {
    const status = {
      testNumber: 1,
      testString: 'Test'
    };
    const collection = [1,2,3];
    collection[STATUS] = status;
    const state = {
      collection,
    };
    const serializedState = toSerializableFormat(state);
    const deserializedState = fromSerializableFormat(serializedState);
    assert.deepEqual(deserializedState.collection[STATUS], status);
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
