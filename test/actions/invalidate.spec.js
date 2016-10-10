import { expect } from 'chai';
import {
  REFERENCE_STATUS,
  invalidate,
} from '../../src';
import {
  validationStatus
} from '../../src/status';

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
    action.meta.timestamp = invalidateAction.meta.timestamp;

    expect(invalidateAction).to.deep.equal(action);
  });

  it('throws exception on action with invalid schema', () => {
    expect(() => invalidate(undefined, 'collection_test'))
      .to.throw('Invalid schema, "invalidate" expected a string but got: undefined');
  });
});
