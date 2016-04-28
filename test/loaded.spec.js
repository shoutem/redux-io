import { expect } from 'chai';
import {
  LOAD_SUCCESS,
  loaded,
  middlewareJsonApiSource,
} from '../src';

describe('Loaded action creator', () => {
  it('creates valid action', () => {
    const schema = 'schema_test';
    const tag = 'all';
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
        schema,
        source: middlewareJsonApiSource,
        tag,
      },
    };
    const loadSuccessAction = loaded(item, schema, tag);

    expect(loadSuccessAction).to.deep.equal(action);
  });

  it('creates a invalid action with invalid schema', () => {
    const item = {
      data: {
      },
    };
    expect(() => loaded(item)).to.throw('Schema is invalid.');
  });

  it('creates a invalid action with invalid tag', () => {
    const item = {
      data: {
      },
    };
    const tag = {};
    expect(() => loaded(item, 'schema_test', tag)).to.throw('Tag isn\'t string.');
  });
});
