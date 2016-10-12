import { expect } from 'chai';
import { REFERENCE_CLEAR } from '../../src';
import  { clear } from '../../src/actions/clear';

describe('Clear action creator', () => {
  it('creates valid action', () => {
    const action = {
      type: REFERENCE_CLEAR,
      meta: {
        schema: 'schema_test',
        tag: 'all',
      },
    };
    const clearAction = clear('schema_test', 'all');

    expect(clearAction).to.deep.equal(action);
  });

  it('throws exception on action with invalid schema', () => {
    expect(() => clear(undefined, 'collection_test'))
      .to.throw('Invalid schema, "clear" expected a string but got: undefined');
  });

  it('creates a valid action with default tag', () => {
    const schema = 'schema_test';
    expect(clear(schema)).to.deep.equal({
      type: REFERENCE_CLEAR,
      meta: {
        schema,
        tag: '',
      },
    });
  });

  it('throws exception on action with invalid tag', () => {
    const schema = 'schema_test';
    expect(() => clear(schema, {}))
      .to.throw('Invalid tag, "updated" expected a string but got: {}');
  });
});
