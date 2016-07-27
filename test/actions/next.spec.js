/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import nock from 'nock';
import { RSAA, apiMiddleware } from 'redux-api-middleware';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import rio, {
  next,
  LOAD_REQUEST,
  LOAD_SUCCESS,
  LOAD_ERROR,
  apiStateMiddleware,
  JSON_API_SOURCE,
  collection,
} from '../../src';
import { applyStatus, updateStatus, getStatus } from '../../src/status';

describe('Next action creator', () => {
  const middlewares = [thunk, apiMiddleware, apiStateMiddleware];
  let mockStore = configureMockStore(middlewares);

  afterEach(() => {
    nock.cleanAll();
    mockStore = configureMockStore(middlewares);
    rio.clear();
  });

  it('creates a valid action', () => {
    const schema = 'schema_test';
    const tag = 'tag_test';
    const links = {
      self: 'self url',
      next: 'next url',
      last: 'last url',
    };
    const reducer = collection(schema, tag, [1, 2, 3]);
    const demoCollection = reducer();
    applyStatus(demoCollection, updateStatus(getStatus(demoCollection), { links }));

    const action = next(demoCollection);

    expect(action[RSAA]).to.not.be.undefined;
    expect(action[RSAA].method).to.equal('GET');
    expect(action[RSAA].endpoint).to.equal(links.next);
    expect(action[RSAA].headers).to.deep.equal({ 'Content-Type': 'application/vnd.api+json' });
    expect(action[RSAA].types).to.not.be.undefined;

    const types = action[RSAA].types;
    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
      tag,
      appendMode: true,
    };
    expect(types[0].type).to.equal(LOAD_REQUEST);
    expect(types[0].meta).to.deep.equal(expectedMeta);
    expect(types[1].type).to.equal(LOAD_SUCCESS);
    expect(types[1].meta).to.deep.equal(expectedMeta);
    expect(types[2].type).to.equal(LOAD_ERROR);
    expect(types[2].meta).to.deep.equal(expectedMeta);
  });
});
