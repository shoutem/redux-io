import { expect } from 'chai';
import { REFERENCE_STATUS } from '../../src';
import {
  validationStatus
} from '../../src/status';
import { invalidate } from '../../src/actions/invalidate';

describe('Invalidate action creator', () => {
  it('creates valid action', () => {
    const action = {
      type: REFERENCE_STATUS,
      meta: {
        schema: 'schema_test',
        tag: '*',
      },
      payload: {
        validationStatus: validationStatus.INVALID,
      }
    };
    const invalidateAction = invalidate('schema_test');
    expect(invalidateAction).to.deep.equal(action);
  });

  it('throws exception on action with invalid schema', () => {
    expect(() => invalidate(undefined, 'collection_test'))
      .to.throw('Invalid schema, "invalidate" expected a string but got: undefined');
  });
});
