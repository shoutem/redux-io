import { assert } from 'chai';
import { toSerializableFormat, TYPE_KEY, ARRAY_TYPE } from '../../src/serialization';
import { STATUS } from '../../src/status';

describe('toSerializableFormat', () => {
  it('saves status to enumerable property', () => {
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
    assert.deepEqual(serializedState.storage[STATUS], status);
  });
  it('transform array to object array', () => {
    const state = {
      arr: [1,2,3],
    };
    const expectedSerializedState = {
      arr: state.arr,
      [TYPE_KEY]: ARRAY_TYPE,
    };
    const serializedState = toSerializableFormat(state);
    assert.deepEqual(serializedState.arr, expectedSerializedState);
  });
  it('saves collection status to object array', () => {
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
    assert.deepEqual(serializedState.collection[STATUS], status);
  });
  it('doesn\'t change objects values', () => {
    const state = {
      storage: {
        a: 1,
      },
      b: ['a', 1],
      c: 2,
      d: 'string',
    };
    const expectedSerializedData = {
      storage: {
        a: 1,
      },
      b: {
        arr: state.b,
        [TYPE_KEY]: ARRAY_TYPE,
      },
      c: 2,
      d: 'string',
    };
    const serializedState = toSerializableFormat(state);
    assert.deepEqual(serializedState, expectedSerializedData);
  });
  it('creates JSON.stringifiable object', () => {
    const state = {
      storage: {
        a: 1,
      },
      b: ['a', 1],
      c: 2,
      d: 'string',
    };
    assert.isOk(typeof JSON.stringify(toSerializableFormat(state)) === 'string');
  });
});
