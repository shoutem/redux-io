import { assert } from 'chai';
import _ from 'lodash';
import {
  toSerializableFormat
} from '../../../src/serialization';
import {
  TYPE_KEY,
  ARRAY_TYPE
} from '../../../src/serialization/rio-state-serializer/type';
import { STATUS } from '../../../src/status';

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

  it('transform array with status to object array', () => {
    const status = {
      testNumber: 1,
      testString: 'Test'
    };
    const arr = [1,2,3];
    const arrWithStatus = [...arr];
    arrWithStatus[STATUS] = status;
    const state = {
      arrWithStatus,
    };
    const expectedSerializedState = {
      arrWithStatus: {
        arr,
        [TYPE_KEY]: ARRAY_TYPE,
        [STATUS]: status,
      },
    };
    const serializedState = toSerializableFormat(state);
    assert.deepEqual(serializedState.arrWithStatus, expectedSerializedState.arrWithStatus);
  });

  it('leave array without status as array', () => {
    const state = {
      arr: [1,2,3],
    };
    const expectedSerializedState = {
      arr: state.arr,
    };
    const serializedState = toSerializableFormat(state);
    assert.deepEqual(serializedState.arr, expectedSerializedState.arr);
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
    const expectedSerializedState = _.cloneDeep(state);

    const serializedState = toSerializableFormat(state);
    assert.deepEqual(serializedState, expectedSerializedState);
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
    const arr = [1,2,3];
    const status = { a: 1 };
    const arrWithStatus = [...arr];
    arrWithStatus[STATUS] = status;
    const state = {
      storage: {
        a: 1,
      },
      b: ['a', 1],
      arrWithStatus,
      c: 2,
      d: 'string',
    };
    const expectedSerializedData = {
      storage: {
        a: 1,
      },
      b: state.b,
      arrWithStatus: {
        arr,
        [TYPE_KEY]: ARRAY_TYPE,
        [STATUS]: status,
      },
      c: 2,
      d: 'string',
    };
    const serializedState = toSerializableFormat(state);
    assert.deepEqual(serializedState, expectedSerializedData);
  });

  it('creates JSON.stringifiable object', () => {
    const arrWithStatus = [1, 2];
    const status = { a: 1 };
    arrWithStatus[STATUS] = status;
    const state = {
      storage: {
        a: 1,
      },
      b: ['a', 1],
      arrWithStatus,
      c: 2,
      d: 'string',
    };
    assert.isOk(typeof JSON.stringify(toSerializableFormat(state)) === 'string');
  });
});
