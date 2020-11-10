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
  OBJECT_FETCHED,
  REFERENCE_FETCHED,
  REFERENCE_STATUS,
  apiStateMiddleware,
  JSON_API_SOURCE,
  ReduxApiStateDenormalizer,
} from '../../src';
import {
  busyStatus,
} from '../../src/status';
import  { find } from '../../src/actions/find';

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
    const metaResponse = [{}, {}, new Response(null, {
      "status": 200,
      "headers": {
        "content-type": "vnd.api+json"
      },
    })];

    const types = action[RSAA].types;
    expect(types[0].type).to.equal(LOAD_REQUEST);
    expect(types[0].meta.params).to.deep.equal(params);
    expect(types[1].type).to.equal(LOAD_SUCCESS);
    expect(types[1].meta(...metaResponse).params).to.deep.equal(params);
    expect(types[2].type).to.equal(LOAD_ERROR);
    expect(types[2].meta(...metaResponse).params).to.deep.equal(params);
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
      endpoint: config.endpoint,
      params: {},
      options: {
        appendMode: true,
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

  it('creates a valid action with predefined action config', () => {
    const request = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
    };

    const actions = {
      find: {
        request: {
          endpoint: 'api.find.test',
          headers: {
            Accept: 'application/vnd.api+json',
          },
        },
      },
      update:  {
        request: {
          endpoint: 'api.find.test3',
          headers: {
            Accept3: 'application/vnd.api+json3',
          },
        },
      },
    };

    const schema = 'app.builder';
    const tag = 'collection_test';

    const schemaConfig = {
      schema,
      request,
      actions,
    };
    rio.registerSchema(schemaConfig);

    const action = find(schema, tag);

    const exceptedEndpoint = actions.find.request.endpoint;
    const exceptedHeaders = {
      ...request.headers,
      ...actions.find.request.headers,
    };

    expect(action[RSAA]).to.not.be.undefined;
    expect(action[RSAA].method).to.equal('GET');
    expect(action[RSAA].endpoint).to.equal(exceptedEndpoint);
    expect(action[RSAA].headers).to.deep.equal(exceptedHeaders);
    expect(action[RSAA].types).to.not.be.undefined;

    console.log(action[RSAA]);

    const types = action[RSAA].types;
    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
      tag,
      endpoint: exceptedEndpoint,
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
      endpoint: argSchemaConfig.request.endpoint,
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

  it('creates a valid action with merged action config', () => {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
    };

    const actions = {
      find: {
        request: {
          endpoint: 'api.find.test',
          headers: {
            Accept: 'application/vnd.api+json',
          },
        },
      }
    };

    const schema = 'app.builder';
    const tag = 'collection_test';

    const schemaConfig = {
      schema,
      request: config,
      actions,
    };
    rio.registerSchema(schemaConfig);

    const argsActions = {
      find: {
        request: {
          endpoint: 'api.find.test2',
          headers: {
            Accept2: 'application/vnd.api+json',
          },
        },
      }
    };

    const argSchemaConfig = {
      schema,
      request: {
        endpoint: 'api.test2',
      },
      actions: argsActions,
    };

    const action = find(argSchemaConfig, tag);

    const expectedEndpoint = argsActions.find.request.endpoint;
    const expectedHeaders = {
      ...config.headers,
      ...actions.find.request.headers,
      ...argsActions.find.request.headers,
    };

    expect(action[RSAA]).to.not.be.undefined;
    expect(action[RSAA].method).to.equal('GET');
    expect(action[RSAA].endpoint).to.equal(expectedEndpoint);
    expect(action[RSAA].headers).to.deep.equal(expectedHeaders);
    expect(action[RSAA].types).to.not.be.undefined;

    const types = action[RSAA].types;
    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
      tag,
      endpoint: expectedEndpoint,
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
      'Resource configuration is invalid. Error:'
      + ' [{"code":"OBJECT_MISSING_REQUIRED_PROPERTY","params":'
      + '["endpoint"],"message":"Missing required property: endpoint"'
      + ',"path":"#/request"}]. Invalid resource config: {"schema":"'
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
      endpoint: 'api.test/{param1}/{param2}/abc{?q1,q2}',
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
      endpoint: expectedEndpoint,
      params,
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

    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
      tag,
      endpoint: config.endpoint,
      params: {},
      options: {},
    };
    const expectedResponseMeta = {
      ...expectedMeta,
      response: {
        status: 200,
        headers: {
          "content-type": "vnd.api+json"
        },
      },
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
        expect(actionCollStatus.meta).to.deep.equal({
          ...expectedMeta,
          timestamp: actionCollStatus.meta.timestamp,
        });
        const expectedCollStatusPayload = { busyStatus: busyStatus.BUSY };
        expect(actionCollStatus.payload).to.deep.equal(expectedCollStatusPayload);

        expect(performedActions[1].type).to.equal(LOAD_REQUEST);

        const batchedActionsSuccess = performedActions[2].payload;

        const actionObjFetched = batchedActionsSuccess[0];
        expect(actionObjFetched.type).to.equal(OBJECT_FETCHED);
        expect(actionObjFetched.meta).to.deep.equal({
          ...expectedResponseMeta,
          transformation: {},
          timestamp: actionObjFetched.meta.timestamp,
        });
        expect(actionObjFetched.payload).to.deep.equal(expectedPayload.data[0]);

        const actionCollFetched = batchedActionsSuccess[2];
        expect(actionCollFetched.type).to.equal(REFERENCE_FETCHED);
        expect(actionCollFetched.meta).to.deep.equal({
          ...expectedResponseMeta,
          timestamp: actionCollFetched.meta.timestamp,
        });
        expect(actionCollFetched.payload).to.deep.equal(expectedPayload.data);

        const successAction = performedActions[3];
        expect(successAction.type).to.equal(LOAD_SUCCESS);
        expect(successAction.meta).to.deep.equal({
          ...expectedResponseMeta,
          timestamp: successAction.meta.timestamp,
        });
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });

  it('produces valid storage without invalidating references', done => {
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

    const options = { invalidateReferences: false };

    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
      tag,
      endpoint: config.endpoint,
      params: {},
      options,
    };
    const expectedResponseMeta = {
      ...expectedMeta,
      response: {
        status: 200,
        headers: {
          "content-type": "vnd.api+json"
        },
      },
    };

    const action = find(schemaConfig, tag, {}, options);

    const store = mockStore({});
    store.dispatch(action)
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(3);

        expect(performedActions[0].type).to.equal(LOAD_REQUEST);

        const batchedActionsSuccess = performedActions[1].payload;

        const actionObjFetched = batchedActionsSuccess[0];
        expect(actionObjFetched.type).to.equal(OBJECT_FETCHED);
        expect(actionObjFetched.meta).to.deep.equal({
          ...expectedResponseMeta,
          transformation: {},
          timestamp: actionObjFetched.meta.timestamp,
        });
        expect(actionObjFetched.payload).to.deep.equal(expectedPayload.data[0]);

        const successAction = performedActions[2];
        expect(successAction.type).to.equal(LOAD_SUCCESS);
        expect(successAction.meta).to.deep.equal({
          ...expectedResponseMeta,
          timestamp: successAction.meta.timestamp,
        });
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });

  it('produces valid collection actions without invalidating resources', done => {
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

    const options = { invalidateResources: false };

    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
      tag,
      endpoint: config.endpoint,
      params: {},
      options,
    };
    const expectedResponseMeta = {
      ...expectedMeta,
      response: {
        status: 200,
        headers: {
          "content-type": "vnd.api+json"
        },
      },
    };

    const action = find(schemaConfig, tag, {}, options);

    const store = mockStore({});
    store.dispatch(action)
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(4);

        const batchedActionsRequest = performedActions[0].payload;

        const actionCollStatus = batchedActionsRequest[0];
        expect(actionCollStatus.type).to.equal(REFERENCE_STATUS);
        expect(actionCollStatus.meta).to.deep.equal({
          ...expectedMeta,
          timestamp: actionCollStatus.meta.timestamp,
        });
        const expectedCollStatusPayload = { busyStatus: busyStatus.BUSY };
        expect(actionCollStatus.payload).to.deep.equal(expectedCollStatusPayload);

        expect(performedActions[1].type).to.equal(LOAD_REQUEST);

        const batchedActionsSuccess = performedActions[2].payload;

        const actionCollFetched = batchedActionsSuccess[0];
        expect(actionCollFetched.type).to.equal(REFERENCE_FETCHED);
        expect(actionCollFetched.meta).to.deep.equal({
          ...expectedResponseMeta,
          timestamp: actionCollFetched.meta.timestamp,
        });
        expect(actionCollFetched.payload).to.deep.equal(expectedPayload.data);

        const successAction = performedActions[3];
        expect(successAction.type).to.equal(LOAD_SUCCESS);
        expect(successAction.meta).to.deep.equal({
          ...expectedResponseMeta,
          timestamp: successAction.meta.timestamp,
        });
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });
});
