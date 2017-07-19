/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import nock from 'nock';
import sinon from 'sinon';
import thunk from 'redux-thunk';
import { RSAA, apiMiddleware } from 'redux-api-middleware';
import configureMockStore from 'redux-mock-store';
import rio, {
  apiStateMiddleware,
  JSON_API_SOURCE,
  LOAD_SUCCESS,
} from '../../src';
import {
  extractResponseHeaders,
} from '../../src/actions/rsaa';
import { find } from '../../src/actions/find';

describe('rsaa', () => {
  const middlewares = [thunk, apiMiddleware, apiStateMiddleware];
  let mockStore = configureMockStore(middlewares);

  afterEach(() => {
    nock.cleanAll();
    mockStore = configureMockStore(middlewares);
    rio.clear();
  });

  it ('can extract response headers', () => {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
    };

    const schema = 'app.builder';
    const tag = 'collection_test';

    const schemaConfig = {
      schema,
      request: config,
    };

    const action = find(schemaConfig, tag);
    const types = action[RSAA].types;
    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
      tag,
      endpoint: config.endpoint,
      params: {},
      options: {},
      timestamp: types[0].meta.timestamp,
    };
    const responseHeaders = {
      "accept": "text/html",
      "content-type": "application/vnd.api+json",

      // Added custom headers from Wordpress paging system
      // to verify meta response headers parsing
      "x-wp-total": "36",
      "x-wp-totalpages": "4"
    };
    const expectedResponseMeta = {
      ...expectedMeta,
      response: {
        "status": 200,
        "headers": { ...responseHeaders },
      },
    };

    const metaResponse = [{}, {}, new Response(null, {
      "status": 200,
      "headers": { ...responseHeaders },
    })];

    expect(action[RSAA]).to.not.be.undefined;
    expect(types[1].type).to.equal(LOAD_SUCCESS);
    expect(types[1].meta).to.not.be.undefined;
    expect(types[1].meta(...metaResponse)).to.deep.equal(expectedResponseMeta);
  })
})
