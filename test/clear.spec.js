import { expect } from 'chai';
import {
  COLLECTION_CLEAR,
  clear,
  collection,
} from '../src';
import deepFreeze from 'deep-freeze';

describe('Clear action creator', () => {
  it('creates valid action', () => {
    const action = {
      type: COLLECTION_CLEAR,
      meta: {
        schema: 'schema_test',
        tag: 'all',
      },
    };
    const clearAction = clear('schema_test', 'all');

    expect(clearAction).to.deep.equal(action);
  });

  it('creates a invalid action with invalid schema', () => {
    expect(() => clear(undefined, 'collection_test')).to.throw('Schema is invalid.');
  });

  it('creates a valid action with default tag', () => {
    const schema = 'schema_test';
    expect(clear(schema)).to.deep.equal({
      type: COLLECTION_CLEAR,
      meta: {
        schema,
        tag: '',
      },
    });
  });
});
