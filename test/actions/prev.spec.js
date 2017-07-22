/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import nock from 'nock';
import { RSAA, apiMiddleware } from 'redux-api-middleware';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import rio, {
  LOAD_REQUEST,
  LOAD_SUCCESS,
  LOAD_ERROR,
  apiStateMiddleware,
  JSON_API_SOURCE,
  collection,
} from '../../src';
import { setStatus, updateStatus, getStatus } from '../../src/status';
import { APPEND_MODE } from '../../src/actions/find';
import { RESOLVED_ENDPOINT, NO_MORE_RESULTS } from '../../src/consts';
import  { prev } from '../../src/actions/prev';

describe('Prev action creator', () => {
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
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
    };
    const schemaConfig = {
      schema,
      request: config,
    };
    rio.registerSchema(schemaConfig);

    const links = {
      self: 'self url',
      prev: 'prev url',
      last: 'last url',
    };
    const reducer = collection(schema, tag, [1, 2, 3]);
    const demoCollection = reducer();
    setStatus(demoCollection, updateStatus(getStatus(demoCollection), { links }));

    const action = prev(demoCollection);

    expect(action[RSAA]).to.not.be.undefined;
    expect(action[RSAA].method).to.equal('GET');
    expect(action[RSAA].endpoint).to.equal(links.prev);
    expect(action[RSAA].headers).to.deep.equal({ 'Content-Type': 'application/vnd.api+json' });
    expect(action[RSAA].types).to.not.be.undefined;

    const types = action[RSAA].types;
    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
      tag,
      endpoint: links.prev,
      params: {},
      options: {
        [APPEND_MODE]: true,
        [RESOLVED_ENDPOINT]: true,
      },
      timestamp: types[0].meta.timestamp,
    };
    const expectedResponseMeta = {
      ...expectedMeta,
      response: {
        status: 200,
        headers: {},
      },
    };
    const metaResponse = [{}, {}, {
      status: 200,
    }];

    expect(types[0].type).to.equal(LOAD_REQUEST);
    expect(types[0].meta).to.deep.equal(expectedMeta);
    expect(types[1].type).to.equal(LOAD_SUCCESS);
    expect(types[1].meta(...metaResponse)).to.deep.equal(expectedResponseMeta);
    expect(types[2].type).to.equal(LOAD_ERROR);
    expect(types[2].meta(...metaResponse)).to.deep.equal(expectedResponseMeta);
  });

  it('creates NO_MORE_ITEMS action', () => {
    const schema = 'test_schema';
    const tag = 'test_tag';
    const reducer = collection(schema, tag, [1, 2, 3]);
    const demoCollection = reducer();
    setStatus(demoCollection, updateStatus(getStatus(demoCollection)));

    const action = prev(demoCollection);
    expect(action.type).to.equal(NO_MORE_RESULTS);
    expect(action.schema).to.equal(schema);
    expect(action.tag).to.equal(tag);
  });
});
