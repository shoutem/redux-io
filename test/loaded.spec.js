import { expect } from 'chai';
import _ from 'lodash';
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
      },
    };
    const loadSuccessAction = loaded(item);

    expect(loadSuccessAction).to.deep.equal(action);
  });
});
