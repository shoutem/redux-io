/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import nock from 'nock';
import { RSAA, apiMiddleware } from 'redux-api-middleware';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import rio, {
  find,
  LOAD_REQUEST,
  LOAD_SUCCESS,
  LOAD_ERROR,
  OBJECT_FETCHED,
  REFERENCE_FETCHED,
  REFERENCE_STATUS,
  apiStateMiddleware,
  JSON_API_SOURCE,
} from '../../src';
import {
  busyStatus,
} from '../../src/status';

describe('Find action creator', () => {
  const middlewares = [thunk, apiMiddleware, apiStateMiddleware];
  let mockStore = configureMockStore(middlewares);

  afterEach(() => {
    nock.cleanAll();
    mockStore = configureMockStore(middlewares);
    rio.clear();
  });

  it('creates a valid action', () => {
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

    expect(action[RSAA]).to.not.be.undefined;
    expect(action[RSAA].method).to.equal('GET');
    expect(action[RSAA].endpoint).to.equal(config.endpoint);
    expect(action[RSAA].headers).to.deep.equal(config.headers);
    expect(action[RSAA].types).to.not.be.undefined;

    const types = action[RSAA].types;
    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
      tag,
      params: {},
      options: {},
    };
    expect(types[0].type).to.equal(LOAD_REQUEST);
    expect(types[0].meta).to.deep.equal(expectedMeta);
    expect(types[1].type).to.equal(LOAD_SUCCESS);
    expect(types[1].meta).to.deep.equal(expectedMeta);
    expect(types[2].type).to.equal(LOAD_ERROR);
    expect(types[2].meta).to.deep.equal(expectedMeta);
  });

  it('includes the find params in meta', () => {
    const schemaConfig = {
      schema: 'app.builder',
      request: {
        endpoint: 'api.test',
        headers: {},
      },
    };

    const params = {
      param1: 'a',
      param2: 'b',
      nestedParam: {
        simpleValue: 'val',
        nestedChild: {
          childValue: 'cval',
        },
      },
    };

    const action = find(schemaConfig, undefined, params);

    expect(action[RSAA]).to.not.be.undefined;
    expect(action[RSAA].types).to.not.be.undefined;

    const types = action[RSAA].types;
    expect(types[0].type).to.equal(LOAD_REQUEST);
    expect(types[0].meta.params).to.deep.equal(params);
    expect(types[1].type).to.equal(LOAD_SUCCESS);
    expect(types[1].meta.params).to.deep.equal(params);
    expect(types[2].type).to.equal(LOAD_ERROR);
    expect(types[2].meta.params).to.deep.equal(params);
  });

  it('creates a valid action with appendMode option', () => {
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

    const action = find(schemaConfig, tag, undefined, { appendMode: true});

    expect(action[RSAA]).to.not.be.undefined;
    expect(action[RSAA].method).to.equal('GET');
    expect(action[RSAA].endpoint).to.equal(config.endpoint);
    expect(action[RSAA].headers).to.deep.equal(config.headers);
    expect(action[RSAA].types).to.not.be.undefined;

    const types = action[RSAA].types;
    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
      tag,
      params: {},
      options: {
        appendMode: true,
      },
    };
    expect(types[0].type).to.equal(LOAD_REQUEST);
    expect(types[0].meta).to.deep.equal(expectedMeta);
    expect(types[1].type).to.equal(LOAD_SUCCESS);
    expect(types[1].meta).to.deep.equal(expectedMeta);
    expect(types[2].type).to.equal(LOAD_ERROR);
    expect(types[2].meta).to.deep.equal(expectedMeta);
  });

  it('creates a valid action with predefined config', () => {
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
    rio.registerSchema(schemaConfig);

    const action = find(schema, tag);

    expect(action[RSAA]).to.not.be.undefined;
    expect(action[RSAA].method).to.equal('GET');
    expect(action[RSAA].endpoint).to.equal(config.endpoint);
    expect(action[RSAA].headers).to.deep.equal(config.headers);
    expect(action[RSAA].types).to.not.be.undefined;

    const types = action[RSAA].types;
    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
      tag,
      params: {},
      options: {},
    };
    expect(types[0].type).to.equal(LOAD_REQUEST);
    expect(types[0].meta).to.deep.equal(expectedMeta);
    expect(types[1].type).to.equal(LOAD_SUCCESS);
    expect(types[1].meta).to.deep.equal(expectedMeta);
    expect(types[2].type).to.equal(LOAD_ERROR);
    expect(types[2].meta).to.deep.equal(expectedMeta);
  });

  it('creates a valid action with predefined config overriding find defaults', () => {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
      body: { a: 1 },
      method: 'POST',
    };

    const schema = 'app.builder';
    const tag = 'collection_test';

    const schemaConfig = {
      schema,
      request: config,
    };
    rio.registerSchema(schemaConfig);

    const action = find(schema, tag);

    expect(action[RSAA]).to.not.be.undefined;
    expect(action[RSAA].method).to.equal(config.method);
    expect(action[RSAA].endpoint).to.equal(config.endpoint);
    expect(action[RSAA].headers).to.deep.equal(config.headers);
    expect(action[RSAA].body).to.deep.equal(config.body);
    expect(action[RSAA].types).to.not.be.undefined;

    const types = action[RSAA].types;
    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
      tag,
      params: {},
      options: {},
    };
    expect(types[0].type).to.equal(LOAD_REQUEST);
    expect(types[0].meta).to.deep.equal(expectedMeta);
    expect(types[1].type).to.equal(LOAD_SUCCESS);
    expect(types[1].meta).to.deep.equal(expectedMeta);
    expect(types[2].type).to.equal(LOAD_ERROR);
    expect(types[2].meta).to.deep.equal(expectedMeta);
  });

  it('creates a valid action with merged config', () => {
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
    rio.registerSchema(schemaConfig);

    const argSchemaConfig = {
      schema,
      request: {
        endpoint: 'api.test2',
      },
    };

    const action = find(argSchemaConfig, tag);

    expect(action[RSAA]).to.not.be.undefined;
    expect(action[RSAA].method).to.equal('GET');
    expect(action[RSAA].endpoint).to.equal(argSchemaConfig.request.endpoint);
    expect(action[RSAA].headers).to.deep.equal(config.headers);
    expect(action[RSAA].types).to.not.be.undefined;

    const types = action[RSAA].types;
    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
      tag,
      params: {},
      options: {},
    };
    expect(types[0].type).to.equal(LOAD_REQUEST);
    expect(types[0].meta).to.deep.equal(expectedMeta);
    expect(types[1].type).to.equal(LOAD_SUCCESS);
    expect(types[1].meta).to.deep.equal(expectedMeta);
    expect(types[2].type).to.equal(LOAD_ERROR);
    expect(types[2].meta).to.deep.equal(expectedMeta);
  });

  it('creates a invalid action with missing registered schema', () => {
    const schema = 'app.builder';
    const tag = 'collection_test';
    expect(() => find(schema, tag)).to.throw(
      `Couldn't resolve schema ${schema} in function find.`
    );
  });

  it('creates a invalid action with undefined schema', () => {
    const tag = 'collection_test';
    expect(() => find(undefined, tag)).to.throw(
      `Couldn't resolve schema undefined in function find.`
    );
  });

  it('creates a invalid action with missing endpoint', () => {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
    };

    const schema = 'app.builder';
    const tag = 'collection_test';

    const schemaConfig = {
      schema,
      request: config,
    };

    expect(() => find(schemaConfig, tag)).to.throw(
      'Schema configuration is invalid. Error:'
      + ' [{"code":"OBJECT_MISSING_REQUIRED_PROPERTY","params":'
      + '["endpoint"],"message":"Missing required property: endpoint"'
      + ',"path":"#/request"}]. Invalid schema config: {"schema":"'
      + 'app.builder","request":{"headers":{"Content-Type":"application'
      + '/vnd.api+json"}}}');
  });

  it('creates a invalid action with invalid tag', () => {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
    };

    const schema = 'app.builder';
    const tag = {};

    const schemaConfig = {
      schema,
      request: config,
    };

    expect(() => find(schemaConfig, tag)).to.throw('Invalid tag, "find" expected a string but got: {}');
  });

  it('creates a valid action with valid endpoint with filled params', () => {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test/{param1}/{param2}/abc',
    };

    const schema = 'app.builder';
    const tag = 'collection_test';

    const schemaConfig = {
      schema,
      request: config,
    };

    const params = {
      param1: 'a',
      param2: 'b',
      q1: 'c',
      q2: 'd',
    };

    const action = find(schemaConfig, tag, params);

    const expectedEndpoint = 'api.test/a/b/abc?q1=c&q2=d';
    expect(action[RSAA]).to.not.be.undefined;
    expect(action[RSAA].method).to.equal('GET');
    expect(action[RSAA].endpoint).to.equal(expectedEndpoint);
    expect(action[RSAA].headers).to.deep.equal(config.headers);
    expect(action[RSAA].types).to.not.be.undefined;

    const types = action[RSAA].types;
    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
      tag,
      params,
      options: {},
    };
    expect(types[0].type).to.equal(LOAD_REQUEST);
    expect(types[0].meta).to.deep.equal(expectedMeta);
    expect(types[1].type).to.equal(LOAD_SUCCESS);
    expect(types[1].meta).to.deep.equal(expectedMeta);
    expect(types[2].type).to.equal(LOAD_ERROR);
    expect(types[2].meta).to.deep.equal(expectedMeta);
  });

  it('produces valid storage and collection actions', done => {
    const schema = 'schema_test';
    const tag = 'collection_test';
    const expectedPayload = {
      data: [{
        type: schema,
        id: '1',
        attributes: {
          name: 'Test1',
        },
      }, {
        type: schema,
        id: '2',
        attributes: {
          name: 'Test2',
        },
      }],
    };
    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
      tag,
      params: {},
      options: {},
    };

    nock('http://api.server.local')
      .get('/apps')
      .reply(200, expectedPayload, { 'Content-Type': 'vnd.api+json' });

    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'http://api.server.local/apps',
    };

    const schemaConfig = {
      schema,
      request: config,
    };

    const action = find(schemaConfig, tag);

    const store = mockStore({});
    store.dispatch(action)
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(4);

        const batchedActionsRequest = performedActions[0].payload;

        const actionCollStatus = batchedActionsRequest[0];
        expect(actionCollStatus.type).to.equal(REFERENCE_STATUS);
        expect(actionCollStatus.meta).to.deep.equal({ ...expectedMeta });
        const expectedCollStatusPayload = { busyStatus: busyStatus.BUSY };
        expect(actionCollStatus.payload).to.deep.equal(expectedCollStatusPayload);

        expect(performedActions[1].type).to.equal(LOAD_REQUEST);

        const batchedActionsSuccess = performedActions[2].payload;

        const actionObjFetched = batchedActionsSuccess[0];
        expect(actionObjFetched.type).to.equal(OBJECT_FETCHED);
        expect(actionObjFetched.meta).to.deep.equal({ ...expectedMeta, transformation: {} });
        expect(actionObjFetched.payload).to.deep.equal(expectedPayload.data[0]);

        const actionCollFetched = batchedActionsSuccess[2];
        expect(actionCollFetched.type).to.equal(REFERENCE_FETCHED);
        expect(actionCollFetched.meta).to.deep.equal({ ...expectedMeta });
        expect(actionCollFetched.payload).to.deep.equal(expectedPayload.data);

        const successAction = performedActions[3];
        expect(successAction.type).to.equal(LOAD_SUCCESS);
        expect(successAction.meta).to.deep.equal(expectedMeta);
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });
});
