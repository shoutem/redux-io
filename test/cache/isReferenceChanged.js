import { assert } from 'chai';
import { isReferenceChanged } from '../../src/cache/RioCache';
import {
  STATUS,
} from '../../src/status';
import _ from 'lodash';

describe('isReferenceChanged', () => {
  it('mark reference as unchanged', () => {
    const reference = {};
    reference[STATUS] = { modifiedTimestamp: 1 };

    const cachedReference = {};
    cachedReference[STATUS] = { ...reference[STATUS] };

    assert.isOk(!isReferenceChanged(reference, cachedReference), 'mark reference as changed');
  });
  it('mark reference as changed', () => {
    const reference = {};
    reference[STATUS] = { modifiedTimestamp: 1 };

    const cachedReference = {};
    cachedReference[STATUS] = { ...reference[STATUS], modifiedTimestamp: 0 };

    assert.isOk(isReferenceChanged(reference, cachedReference), 'mark reference as unchanged');
  });
  it('mark descriptor as unchanged', () => {
    const descriptor = {};
    const cachedDescriptor = {};

    assert.isOk(!isReferenceChanged(descriptor, cachedDescriptor), 'mark descriptor as changed');
  });
});
