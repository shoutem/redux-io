import { expect } from 'chai';
import {
  LOAD_SUCCESS,
  loaded,
  middlewareJsonApiSource,
} from '../src';

describe('Loaded action creator', () => {
  it('creates valid action', () => {
    const item = {
      data: {
        id: 1,
        type: 'schema_test',
        attributes: {
          a: 2,
          b: 3,
        },
      },
    };
    const action = {
      type: LOAD_SUCCESS,
      payload: item,
      meta: {
        schema: 'schema_test',
        source: middlewareJsonApiSource,
        tag: 'all',
      },
    };
    const loadSuccessAction = loaded(item, 'all');

    expect(loadSuccessAction).to.deep.equal(action);
  });

  it('creates a invalid action with invalid schema', () => {
    const item = {
      data: {
        type: '',
      },
    };
    const tag = 'collection_test';
    expect(() => loaded(item, tag)).to.throw('Schema is invalid.');
  });

  it('creates a invalid action with invalid tag', () => {
    const item = {
      data: {
        type: 'schema_test',
      },
    };
    const tag = {};
    expect(() => loaded(item, tag)).to.throw('Tag isn\'t string.');
  });
});
