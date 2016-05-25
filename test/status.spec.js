/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import deepFreeze from 'deep-freeze';
import {
  createStatus,
  updateStatus,
  isValid,
  isBusy,
  shouldRefresh,
  validationStatus,
  busyStatus,
  STATUS,
  applyStatus,
} from '../src/status';

describe('Status metadata', () => {
  it('initial status', () => {
    const obj = {};
    obj[STATUS] = createStatus();

    expect(isValid(obj)).to.be.false;
    expect(isBusy(obj)).to.be.false;
  });

  it('isValid returns correct value on valid', () => {
    const status = updateStatus(
      createStatus(),
      { validationStatus: validationStatus.VALID }
    );
    const obj = {};
    obj[STATUS] = status;

    expect(isValid(obj)).to.be.true;
  });

  it('isValid returns correct value on invalid', () => {
    const status = updateStatus(
      createStatus(),
      { validationStatus: validationStatus.INVALID }
    );
    const obj = {};
    obj[STATUS] = status;

    expect(isValid(obj)).to.be.false;
  });

  it('isValid returns correct value on none', () => {
    const status = updateStatus(
      createStatus(),
      { validationStatus: validationStatus.NONE }
    );
    const obj = {};
    obj[STATUS] = status;

    expect(isValid(obj)).to.be.false;
  });

  it('isBusy returns correct value on busy', () => {
    const status = updateStatus(
      createStatus(),
      { busyStatus: busyStatus.BUSY }
    );
    const obj = {};
    obj[STATUS] = status;

    expect(isBusy(obj)).to.be.true;
  });

  it('isBusy returns correct value on idle', () => {
    const status = updateStatus(
      createStatus(),
      { busyStatus: busyStatus.IDLE }
    );
    const obj = {};
    obj[STATUS] = status;

    expect(isBusy(obj)).to.be.false;
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
    obj[STATUS] = status;

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
    obj[STATUS] = status;

    expect(shouldRefresh(obj)).to.be.false;
  });

  it('applyStatus applies cloned status on destination object from source object', () => {
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
    sourceObj[STATUS] = status;

    const destObj = {};
    applyStatus(sourceObj, destObj);

    expect(destObj[STATUS]).to.be.deep.equal(status);
  });

  it('update status updates timestamp to newer', (done) => {
    const obj = {};
    obj[STATUS] = createStatus();
    const initModifiedTimestamp = obj[STATUS].modifiedTimestamp;

    setTimeout(() => {
      obj[STATUS] = updateStatus(obj[STATUS], {});
      const updatedModifiedTimestamp = obj[STATUS].modifiedTimestamp;

      expect(updatedModifiedTimestamp).to.be.above(initModifiedTimestamp);
      done();
    }, 100);
  });
});
