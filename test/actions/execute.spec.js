/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import nock from 'nock';
import { RSAA, apiMiddleware } from 'redux-api-middleware';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import sinon from 'sinon';
import rio, {
  LOAD_REQUEST,
  LOAD_SUCCESS,
  LOAD_ERROR,
  CREATE_REQUEST,
  CREATE_SUCCESS,
  CREATE_ERROR,
  apiStateMiddleware,
  JSON_API_RESOURCE,
  ReduxApiStateDenormalizer,
} from '../../src';
import {
  busyStatus,
} from '../../src/status';
import  { execute } from '../../src/actions/execute';
import { extractThunk } from '../helpers/thunk';

describe('Find action creator', () => {
  const middlewares = [thunk, apiMiddleware, apiStateMiddleware];
  let mockStore = configureMockStore(middlewares);

  beforeEach(() => {
    const denormalizer = new ReduxApiStateDenormalizer();
    rio.setDenormalizer(denormalizer);
  });

  afterEach(() => {
    nock.cleanAll();
    mockStore = configureMockStore(middlewares);
    rio.clear();
  });

  it('creates a valid find action', () => {
    const config = {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.api+json',
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

    const action = execute({
      ...schemaConfig,
      name: 'find',
      actionTypes: 'LOAD',
      tag,
    });

    expect(action[RSAA]).to.not.be.undefined;
    expect(action[RSAA].method).to.equal('GET');
    expect(action[RSAA].endpoint).to.equal(config.endpoint);
    expect(action[RSAA].headers).to.deep.equal(config.headers);
    expect(action[RSAA].types).to.not.be.undefined;

    const types = action[RSAA].types;
    const expectedMeta = {
      source: JSON_API_RESOURCE,
      schema,
      tag,
      endpoint: config.endpoint,
      params: {},
      options: {},
      timestamp: types[0].meta.timestamp,
    };
    const expectedResponseMeta = {
      ...expectedMeta,
      response: {
        status: 200,
        headers: {},
      },
    };
    const metaResponse = [{}, {}, new Response(null, {
      "status": 200,
      "headers": {},
    })];

    expect(types[0].type).to.equal(LOAD_REQUEST);
    expect(types[0].meta).to.deep.equal(expectedMeta);
    expect(types[1].type).to.equal(LOAD_SUCCESS);
    expect(types[1].meta(...metaResponse)).to.deep.equal(expectedResponseMeta);
    expect(types[2].type).to.equal(LOAD_ERROR);
    expect(types[2].meta(...metaResponse)).to.deep.equal(expectedResponseMeta);
  });

  it('creates a valid find action with resource', () => {
    const tag = 'collection_test';

    const resourceConfig = {
      schema: 'app.builder',
      request: {
        headers: {
          'Content-Type': 'application/vnd.api+json',
        },
        endpoint: 'api.test',
      },
    };

    const resource = rio.registerResource(resourceConfig);

    const actionThunk = resource.find({ tag });

    const spiedAction = extractThunk(actionThunk);

    const expectedHeaders = {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
    };

    expect(spiedAction[RSAA]).to.not.be.undefined;
    expect(spiedAction[RSAA].method).to.equal('GET');
    expect(spiedAction[RSAA].endpoint).to.equal(resourceConfig.request.endpoint);
    expect(spiedAction[RSAA].headers).to.deep.equal(expectedHeaders);
    expect(spiedAction[RSAA].types).to.not.be.undefined;

    const types = spiedAction[RSAA].types;
    console.log('########', spiedAction[RSAA]);
    const expectedMeta = {
      source: JSON_API_RESOURCE,
      schema: resourceConfig.schema,
      tag,
      endpoint: resourceConfig.request.endpoint,
      params: {},
      options: {},
      timestamp: types[0].meta.timestamp,
    };
    const expectedResponseMeta = {
      ...expectedMeta,
      response: {
        status: 200,
        headers: {},
      },
    };
    const metaResponse = [{}, {}, new Response(null, {
      "status": 200,
      "headers": {},
    })];

    expect(types[0].type).to.equal(LOAD_REQUEST);
    expect(types[0].meta).to.deep.equal(expectedMeta);
    expect(types[1].type).to.equal(LOAD_SUCCESS);
    expect(types[1].meta(...metaResponse)).to.deep.equal(expectedResponseMeta);
    expect(types[2].type).to.equal(LOAD_ERROR);
    expect(types[2].meta(...metaResponse)).to.deep.equal(expectedResponseMeta);
  });

  it('creates a valid create action', () => {
    const config = {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
    };

    const schema = 'schema_test';
    const schemaConfig = {
      schema,
      request: config,
    };

    const item = {
      schema,
      id: '1',
      attributes: {
        name: 'Test1',
      },
    };

    const action = execute({
      ...schemaConfig,
      name: 'create',
      item,
      actionTypes: 'CREATE',
    });

    expect(action[RSAA]).to.not.be.undefined;
    expect(action[RSAA].method).to.equal('POST');
    expect(action[RSAA].endpoint).to.equal(config.endpoint);
    expect(action[RSAA].headers).to.deep.equal(config.headers);
    const expectedBody = JSON.stringify({
      data: item,
    });
    expect(action[RSAA].body).to.equal(expectedBody);
    expect(action[RSAA].types).to.not.be.undefined;

    const types = action[RSAA].types;
    const expectedMeta = {
      source: JSON_API_RESOURCE,
      schema,
      endpoint: config.endpoint,
      params: {},
      options: {},
      timestamp: types[0].meta.timestamp,
    };
    const expectedResponseMeta = {
      ...expectedMeta,
      response: {
        status: 200,
        headers: {},
      },
    };
    const metaResponse = [{}, {}, { status: 200 }];

    expect(types[0].type).to.equal(CREATE_REQUEST);
    expect(types[0].meta).to.deep.equal(expectedMeta);
    expect(types[1].type).to.equal(CREATE_SUCCESS);
    expect(types[1].meta(...metaResponse)).to.deep.equal(expectedResponseMeta);
    expect(types[2].type).to.equal(CREATE_ERROR);
    expect(types[2].meta(...metaResponse)).to.deep.equal(expectedResponseMeta);
  });

});
