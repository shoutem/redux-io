import { expect } from 'chai';
import {
  UPDATE_SUCCESS,
  updated,
  middlewareJsonApiSource,
} from '../src';

describe('Updated action creator', () => {
  it('updated valid action', () => {
    const schema = 'schema_test';
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
      type: UPDATE_SUCCESS,
      payload: item,
      meta: {
        schema,
        source: middlewareJsonApiSource,
      },
    };
    const updateSuccessAction = updated(item, schema);

    expect(updateSuccessAction).to.deep.equal(action);
  });

  it('throw exception on updated with invalid schema', () => {
    const payload = {
      data: {
      },
    };
    expect(() => updated(payload)).to.throw('Schema is invalid.');
  });

  it('throw exception on updated with invalid payload', () => {
    const payload = {
    };
    expect(() => updated(payload)).to.throw('Missing payload data property.');

    const textPayload = 'Wrong';
    expect(() => updated(textPayload)).to.throw('Invalid payload type.');
  });
});
