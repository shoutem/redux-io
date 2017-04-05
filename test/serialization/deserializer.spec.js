import { assert } from 'chai';
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
});
