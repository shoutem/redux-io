import { assert } from 'chai';
import { isReferenceChanged } from '../../src/cache/RioCache';
import {
  STATUS,
} from '../../src/status';

describe('isReferenceChanged', () => {
  it('returns unchanged reference', () => {
    const reference = {};
    reference[STATUS] = { modifiedTimestamp: 1 };

    const cachedReference = {};
    cachedReference[STATUS] = { ...reference[STATUS] };

    assert.isOk(!isReferenceChanged(reference, cachedReference), 'reference changed');
  });
  it('returns changed reference', () => {
    const reference = {};
    reference[STATUS] = { modifiedTimestamp: 1 };

    const cachedReference = {};
    cachedReference[STATUS] = { ...reference[STATUS], modifiedTimestamp: 0 };

    assert.isOk(isReferenceChanged(reference, cachedReference), 'reference unchanged');
  });
  it('returns changed descriptor', () => {
    const descriptor = {};
    const cachedDescriptor = {};

    assert.isOk(isReferenceChanged(descriptor, cachedDescriptor), 'descriptor unchanged');
  });
});
