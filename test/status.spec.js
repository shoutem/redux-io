/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import {
  createStatus,
  updateStatus,
  isValid,
  isBusy,
  validationStatus,
  busyStatus,
  STATUS,
} from '../src/status';

describe('Status metadata', () => {
  it('initial status', () => {
    const obj = {};
    obj[STATUS] = createStatus();

    expect(isValid(obj)).to.be.false;
    expect(isBusy(obj)).to.be.false;
  });

  it('isValid returns correct boolean value', () => {
    const status = updateStatus(
      createStatus(),
      { validationStatus: validationStatus.VALID }
    );
    const obj = {};
    obj[STATUS] = status;

    expect(isValid(obj)).to.be.true;

    obj[STATUS] = updateStatus(
      status,
      { validationStatus: validationStatus.INVALID }
    );

    expect(isValid(obj)).to.be.false;

    obj[STATUS] = updateStatus(
      status,
      { validationStatus: validationStatus.NONE }
    );

    expect(isValid(obj)).to.be.false;
  });

  it('isBusy returns correct boolean value', () => {
    const status = updateStatus(
      createStatus(),
      { busyStatus: busyStatus.BUSY }
    );
    const obj = {};
    obj[STATUS] = status;

    expect(isBusy(obj)).to.be.true;

    obj[STATUS] = updateStatus(
      status,
      { busyStatus: busyStatus.IDLE }
    );

    expect(isBusy(obj)).to.be.false;
  });

  it('update status updates timestamp to newer', () => {
    const obj = {};
    obj[STATUS] = createStatus();
    const initModifiedTimestamp = obj[STATUS].modifiedTimestamp;

    obj[STATUS] = updateStatus(obj[STATUS], {});
    const updatedModifiedTimestamp = obj[STATUS].modifiedTimestamp;

    expect(updatedModifiedTimestamp).to.be.least(initModifiedTimestamp);
  });
});
