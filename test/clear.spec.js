import { expect } from 'chai';
import {
  COLLECTION_CLEARED,
  clear,
  collection,
} from '../src';
import deepFreeze from 'deep-freeze';

describe('Clear action creator', () => {
  it('creates valid action', () => {
    const action = {
      type: COLLECTION_CLEARED,
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
      type: COLLECTION_CLEARED,
      meta: {
        schema,
        tag: '',
      },
    });
  });

  it('clears collection', () => {
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const action = {
      type: COLLECTION_CLEARED,
      meta: {
        schema: 'schema_test',
        tag: 'all',
      },
    };
    const initialState = items;
    deepFreeze(initialState);
    const schema = 'schema_test';
    const tag = 'tag_test';
    const clearAction = clear(schema, tag);

    const reducer = collection(schema, tag, initialState);
    const nextState = reducer(undefined, clearAction);

    expect(nextState).to.deep.equal([]);
  });
});
