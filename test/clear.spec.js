import { expect } from 'chai';
import {
  INDEX_CLEAR,
  clear,
} from '../src';

describe('Clear action creator', () => {
  it('creates valid action', () => {
    const action = {
      type: INDEX_CLEAR,
      meta: {
        schema: 'schema_test',
        tag: 'all',
      },
    };
    const clearAction = clear('schema_test', 'all');

    expect(clearAction).to.deep.equal(action);
  });

  it('throws exception on action with invalid schema', () => {
    expect(() => clear(undefined, 'collection_test')).to.throw('Schema is invalid.');
  });

  it('creates a valid action with default tag', () => {
    const schema = 'schema_test';
    expect(clear(schema)).to.deep.equal({
      type: INDEX_CLEAR,
      meta: {
        schema,
        tag: '',
      },
    });
  });

  it('throws exception on action with invalid tag', () => {
    const schema = 'schema_test';
    expect(() => clear(schema, {})).to.throw('Tag isn\'t string.');
  });
});
