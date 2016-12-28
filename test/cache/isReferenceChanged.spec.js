import { assert } from 'chai';
import { isReferenceChanged } from '../../src/cache/RioCache';
import {
  STATUS,
} from '../../src/status';

describe('isReferenceChanged', () => {
  it('returns false for unchanged reference', () => {
    const reference = {};
    reference[STATUS] = { modifiedTimestamp: 1 };

    const cachedReference = {};
    cachedReference[STATUS] = { ...reference[STATUS] };

    assert.isNotOk(isReferenceChanged(reference, cachedReference), 'reference marked changed');
  });
  it('returns true for changed reference', () => {
    const reference = {};
    reference[STATUS] = { modifiedTimestamp: 1 };

    const cachedReference = {};
    cachedReference[STATUS] = { ...reference[STATUS], modifiedTimestamp: 0 };

    assert.isOk(isReferenceChanged(reference, cachedReference), 'reference marked unchanged');
  });
  it('returns false for descriptor', () => {
    const descriptor = {};
    const cachedDescriptor = {};

    assert.isNotOk(isReferenceChanged(descriptor, cachedDescriptor), 'descriptor marked changed');
  });
});
