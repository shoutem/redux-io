import { expect } from 'chai';
import {
  LOAD_SUCCESS,
  loaded,
  JSON_API_SOURCE,
} from '../../src';

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
        source: JSON_API_SOURCE,
        tag,
      },
    };
    const loadSuccessAction = loaded(item, schema, tag);
    action.meta.timestamp = loadSuccessAction.meta.timestamp;

    expect(loadSuccessAction).to.deep.equal(action);
  });

  it('creates a invalid action with invalid schema', () => {
    const payload = {
      data: {
      },
    };
    expect(() => loaded(payload)).to.throw('Invalid schema, "loaded" expected a string but got: undefined');
  });

  it('creates a invalid action with invalid payload', () => {
    const payload = {
    };
    expect(() => loaded(payload)).to.throw('Missing payload data property.');

    const textPayload = 'Wrong';
    expect(() => loaded(textPayload)).to.throw('Invalid payload type.');
  });

  it('creates a invalid action with invalid tag', () => {
    const payload = {
      data: {
      },
    };
    const tag = {};
    expect(() => loaded(payload, 'schema_test', tag)).to.throw(
      'Invalid tag, "loaded" expected a string but got: {}'
    );
  });
});
