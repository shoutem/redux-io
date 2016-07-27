/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import deepFreeze from 'deep-freeze';
import {
  createStatus,
  updateStatus,
  isValid,
  isBusy,
  isInitialized,
  isError,
  shouldRefresh,
  validationStatus,
  busyStatus,
  STATUS,
  cloneStatus,
  applyStatus,
} from '../src/status';

describe('Status metadata', () => {
  it('initial status', () => {
    const obj = {};
    applyStatus(obj, createStatus());

    expect(isValid(obj)).to.be.false;
    expect(isBusy(obj)).to.be.false;
  });

  it('isValid returns correct value on valid', () => {
    const status = updateStatus(
      createStatus(),
      { validationStatus: validationStatus.VALID }
    );
    const obj = {};
    applyStatus(obj, status);

    expect(isValid(obj)).to.be.true;
  });

  it('isValid returns correct value on invalid', () => {
    const status = updateStatus(
      createStatus(),
      { validationStatus: validationStatus.INVALID }
    );
    const obj = {};
    applyStatus(obj, status);

    expect(isValid(obj)).to.be.false;
  });

  it('isValid returns correct value on none', () => {
    const status = updateStatus(
      createStatus(),
      { validationStatus: validationStatus.NONE }
    );
    const obj = {};
    applyStatus(obj, status);

    expect(isValid(obj)).to.be.false;
  });

  it('isBusy returns correct value on busy', () => {
    const status = updateStatus(
      createStatus(),
      { busyStatus: busyStatus.BUSY }
    );
    const obj = {};
    applyStatus(obj, status);

    expect(isBusy(obj)).to.be.true;
  });

  it('isBusy returns correct value on idle', () => {
    const status = updateStatus(
      createStatus(),
      { busyStatus: busyStatus.IDLE }
    );
    const obj = {};
    applyStatus(obj, status);

    expect(isBusy(obj)).to.be.false;
  });

  it('isInitialized returns correct value on none', () => {
    const status = updateStatus(
      createStatus(),
      { validationStatus: validationStatus.NONE }
    );
    const obj = {};
    applyStatus(obj, status);
    expect(isInitialized(obj)).to.be.false;
  });

  it('isError returns correct value on error', () => {
    const status = updateStatus(
      createStatus(),
      { error: true }
    );
    const obj = {};
    applyStatus(obj, status);
    expect(isError(obj)).to.be.true;
  });

  it('isInitialized returns correct value on invalid', () => {
    const status = updateStatus(
      createStatus(),
      { validationStatus: validationStatus.INVALID }
    );
    const obj = {};
    applyStatus(obj, status);
    expect(isInitialized(obj)).to.be.true;
  });

  it('isError returns correct value on not error', () => {
    const status = updateStatus(
      createStatus(),
      { error: false }
    );
    const obj = {};
    applyStatus(obj, status);
    expect(isError(obj)).to.be.false;
  });

  it('isInitialized returns correct value on valid', () => {
    const status = updateStatus(
      createStatus(),
      { validationStatus: validationStatus.VALID }
    );
    const obj = {};
    applyStatus(obj, status);

    expect(isInitialized(obj)).to.be.true;
  });

  it('isInitialized returns correct value on object without status', () => {
    const obj = {};
    expect(isInitialized(obj)).to.be.false;
  });

  it('shouldRefresh returns correct value on idle,invalid', () => {
    const status = updateStatus(
      createStatus(),
      {
        busyStatus: busyStatus.IDLE,
        validationStatus: validationStatus.INVALID,
      }
    );
    const obj = {};
    applyStatus(obj, status);

    expect(shouldRefresh(obj)).to.be.true;
  });

  it('shouldRefresh returns correct value on busy,invalid', () => {
    const status = updateStatus(
      createStatus(),
      {
        busyStatus: busyStatus.BUSY,
        validationStatus: validationStatus.INVALID,
      }
    );
    const obj = {};
    applyStatus(obj, status);

    expect(shouldRefresh(obj)).to.be.false;
  });

  it('shouldRefresh returns correct value on error', () => {
    const status = updateStatus(
      createStatus(),
      {
        busyStatus: busyStatus.IDLE,
        validationStatus: validationStatus.INVALID,
        error: true,
      }
    );
    const obj = {};
    applyStatus(obj, status);

    expect(shouldRefresh(obj)).to.be.false;
  });

  it('shouldRefresh returns correct value on error with ignoreError flag', () => {
    const status = updateStatus(
      createStatus(),
      {
        busyStatus: busyStatus.IDLE,
        validationStatus: validationStatus.INVALID,
        error: true,
      }
    );
    const obj = {};
    applyStatus(obj, status);

    expect(shouldRefresh(obj, true)).to.be.true;
  });

  it('cloneStatus clones status on destination object from source object', () => {
    const status = updateStatus(
      createStatus(),
      {
        busyStatus: busyStatus.BUSY,
        validationStatus: validationStatus.INVALID,
        transformation: {
          a: 'a',
          b: 'b',
        },
      }
    );
    deepFreeze(status);
    const sourceObj = {};
    applyStatus(sourceObj, status);

    const destObj = {};
    cloneStatus(sourceObj, destObj);

    expect(destObj[STATUS]).to.be.deep.equal(status);
  });

  it('update status updates timestamp to newer', (done) => {
    const obj = {};
    applyStatus(obj, createStatus());
    const initModifiedTimestamp = obj[STATUS].modifiedTimestamp;

    setTimeout(() => {
      applyStatus(obj, updateStatus(obj[STATUS], {}));
      const updatedModifiedTimestamp = obj[STATUS].modifiedTimestamp;

      expect(updatedModifiedTimestamp).to.be.above(initModifiedTimestamp);
      done();
    }, 100);
  });

  it('doesn\'t interfere with forEach in Array', () => {
    const obj = [1, 2, 3];
    applyStatus(obj, createStatus());

    let counter = 0;
    obj.forEach(() => counter++);

    expect(counter).to.be.eql(3);
  });

  it('doesn\'t interfere with map in Array', () => {
    const obj = [1, 2, 3];
    applyStatus(obj, createStatus());

    let counter = 0;
    obj.map(() => counter++);

    expect(counter).to.be.eql(3);
  });

  it('does\'t interfere with \'for in\' in Array', () => {
    const obj = [1, 2, 3];
    applyStatus(obj, createStatus());

    let counter = 0;
    for (const o in obj) {
      counter++;
    }

    expect(counter).to.be.eql(3);
  });

  it('doesn\'t interfere with \'for of\' in Array', () => {
    const obj = [1, 2, 3];
    applyStatus(obj, createStatus());

    let counter = 0;
    for (const o of obj) {
      counter++;
    }

    expect(counter).to.be.eql(3);
  });

  it('does\'t interfere with \'Object.keys\' in Object', () => {
    const obj = {
      a: 5,
      b: 6,
      c: 7,
    };
    applyStatus(obj, createStatus());

    let counter = 0;
    for (const o in Object.keys(obj)) {
      counter++;
    }

    expect(counter).to.be.eql(3);
  });

  it('does\'t interfere with \'Object.keys\' in Array', () => {
    const obj = [1, 2, 3];
    applyStatus(obj, createStatus());

    let counter = 0;
    for (const o in Object.keys(obj)) {
      counter++;
    }

    expect(counter).to.be.eql(3);
  });

  it('spread operator doesn\'t copy status', () => {
    const obj = { 1:{}, 2:{}, 3:{} };
    applyStatus(obj, createStatus());

    const newObj = { ...obj };

    let counter = 0;
    for (const o in Object.keys(newObj)) {
      counter++;
    }

    expect(counter).to.be.eql(3);
    expect(newObj[STATUS]).to.be.undefined;
  });

});
