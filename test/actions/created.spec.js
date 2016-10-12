import { expect } from 'chai';
import {
  CREATE_SUCCESS,
  JSON_API_SOURCE,
} from '../../src';
import  { created } from '../../src/actions/created';

describe('Created action creator', () => {
  it('creates valid action', () => {
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
      type: CREATE_SUCCESS,
      payload: item,
      meta: {
        schema,
        source: JSON_API_SOURCE,
      },
    };
    const createSuccessAction = created(item, schema);
    action.meta.timestamp = createSuccessAction.meta.timestamp;

    expect(createSuccessAction).to.deep.equal(action);
  });

  it('creates a invalid action with invalid schema', () => {
    const payload = {
      data: {
      },
    };
    expect(() => created(payload)).to.throw('Invalid schema, "created" expected a string but got: undefined');
  });

  it('creates a invalid action with invalid payload', () => {
    const payload = {
    };
    expect(() => created(payload)).to.throw('Missing payload data property.');

    const textPayload = 'Wrong';
    expect(() => created(textPayload)).to.throw('Invalid payload type.');
  });
});
