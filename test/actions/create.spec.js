/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import nock from 'nock';
import { RSAA, apiMiddleware } from 'redux-api-middleware';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import rio, {
  CREATE_REQUEST,
  CREATE_SUCCESS,
  CREATE_ERROR,
  OBJECT_CREATED,
  REFERENCE_STATUS,
  apiStateMiddleware,
  JSON_API_SOURCE,
  ReduxApiStateDenormalizer,
} from '../../src';
import {
  validationStatus,
  busyStatus,
} from '../../src/status';
import  { create } from '../../src/actions/create';

describe('Create action creator', () => {
  const middlewares = [thunk, apiMiddleware, apiStateMiddleware];
  let mockStore = configureMockStore(middlewares);

  beforeEach(() => {
    nock.cleanAll();
    mockStore = configureMockStore(middlewares);
    const denormalizer = new ReduxApiStateDenormalizer();
    rio.setDenormalizer(denormalizer);
  });

  it('creates a valid action', () => {
    const config = {
      headers: {
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

    const action = create(schemaConfig, item);

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
      source: JSON_API_SOURCE,
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

  it('creates a valid action with item in config', () => {
    const schema = 'schema_test';
    const item = {
      schema,
      id: '1',
      attributes: {
        name: 'Test1',
      },
    };
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
      body: item,
    };

    const schemaConfig = {
      schema,
      request: config,
    };

    const action = create(schemaConfig);

    expect(action[RSAA]).to.not.be.undefined;
    expect(action[RSAA].method).to.equal('POST');
    expect(action[RSAA].endpoint).to.equal(config.endpoint);
    expect(action[RSAA].headers).to.deep.equal(config.headers);
    expect(action[RSAA].body).to.deep.equal(item);
    expect(action[RSAA].types).to.not.be.undefined;

    const types = action[RSAA].types;
    const expectedMeta = {
      source: JSON_API_SOURCE,
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
  });

  it('creates a valid action with item in argument has priority over item in config.body', () => {
    const schema = 'schema_test';
    const item = {
      schema,
      id: '1',
      attributes: {
        name: 'Test1',
      },
    };
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
      body: item,
    };

    const schemaConfig = {
      schema,
      request: config,
    };

    const action = create(schemaConfig, item);

    expect(action[RSAA]).to.not.be.undefined;
    expect(action[RSAA].method).to.equal('POST');
    expect(action[RSAA].endpoint).to.equal(config.endpoint);
    expect(action[RSAA].headers).to.deep.equal(config.headers);
    expect(action[RSAA].body).to.equal(JSON.stringify({ data: item }));
    expect(action[RSAA].types).to.not.be.undefined;

    const types = action[RSAA].types;
    const expectedMeta = {
      source: JSON_API_SOURCE,
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
  });

  it('creates a valid action with valid endpoint with filled params', () => {
    const schema = 'schema_test';
    const item = {
      schema,
      id: '1',
      attributes: {
        name: 'Test1',
      },
    };
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test/{param1}/{param2}/abc{?q1,q2}',
    };

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

    const action = create(schemaConfig, item, params);

    const expectedEndpoint = 'api.test/a/b/abc?q1=c&q2=d';
    expect(action[RSAA]).to.not.be.undefined;
    expect(action[RSAA].method).to.equal('POST');
    expect(action[RSAA].endpoint).to.equal(expectedEndpoint);
    expect(action[RSAA].headers).to.deep.equal(config.headers);
    expect(action[RSAA].body).to.equal(JSON.stringify({ data: item }));
    expect(action[RSAA].types).to.not.be.undefined;

    const types = action[RSAA].types;
    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
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
    const metaResponse = [{}, {}, { status: 200 }];

    expect(types[0].type).to.equal(CREATE_REQUEST);
    expect(types[0].meta).to.deep.equal(expectedMeta);
    expect(types[1].type).to.equal(CREATE_SUCCESS);
    expect(types[1].meta(...metaResponse)).to.deep.equal(expectedResponseMeta);
  });

  it('throws exception on action with resource configuration is invalid', () => {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
    };

    const schemaConfig = {
      request: config,
    };

    expect(() => create(schemaConfig)).to.throw(
      'Resource configuration is invalid. Error:'
      + ' [{"code":"OBJECT_MISSING_REQUIRED_PROPERTY","params":'
      + '["schema"],"message":"Missing required pr'
      + 'operty: schema","path":"#/"}]. Invalid resource config:'
      + ' {"request":{"headers":{"Content-Type":'
      + '"application/vnd.api+json"},"endpoint":"api.test"}}'
    );
  });

  it('throws exception on action with schema undefined', () => {
    const schemaConfig = 'schema_test';
    expect(() => create(schemaConfig)).to.throw(
      'Couldn\'t resolve schema schema_test in function find.'
    );
  });

  it('throws exception on action with invalid item', () => {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
    };

    const schema = 'app.builder';
    const schemaConfig = {
      schema,
      request: config,
    };
    const item = 2;
    expect(() => create(schemaConfig, item))
      .to.throw('Item is not valid in method argument');
  });

  it('does not throw exception on action with missing item', () => {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
    };

    const schema = 'app.builder';
    const schemaConfig = {
      schema,
      request: config,
    };
    expect(() => create(schemaConfig)).to.not.throw();
  });

  it('uses body from config if the item is missing', () => {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      body: 'Body',
      endpoint: 'api.test',
    };

    const schema = 'app.builder';
    const schemaConfig = {
      schema,
      request: config,
    };

    const action = create(schemaConfig);

    expect(action[RSAA].body).to.equal(config.body);
  });

  it('produces valid storage and collection actions', done => {
    const schema = 'schema_test';
    const expectedPayload = {
      data: {
        schema,
        id: '1',
        type: schema,
        attributes: {
          name: 'Test1',
        },
      },
    };

    const item = {
      schema,
      attributes: {
        name: 'Test1',
      },
    };
    nock('http://api.server.local')
      .post('/apps')
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
      endpoint: config.endpoint,
      params: {},
      options: {},
      schema,
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

    const action = create(schemaConfig, item);
    const store = mockStore({});
    store.dispatch(action)
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(4);

        const batchedActionsRequest = performedActions[0].payload;

        const actionCollStatusBusy = batchedActionsRequest[0];
        expect(actionCollStatusBusy.type).to.equal(REFERENCE_STATUS);
        expect(actionCollStatusBusy.meta).to.deep.equal({
          ...expectedMeta,
          tag: '*',
          timestamp: actionCollStatusBusy.meta.timestamp,
        });
        const expectedCollStatusBusyPayload = {
          busyStatus: busyStatus.BUSY,
          validationStatus: validationStatus.INVALID,
        };
        expect(actionCollStatusBusy.payload).to.deep.equal(expectedCollStatusBusyPayload);

        expect(performedActions[1].type).to.equal(CREATE_REQUEST);

        const batchedActionsSuccess = performedActions[2].payload;

        const actionObjCreated = batchedActionsSuccess[0];
        expect(actionObjCreated.type).to.equal(OBJECT_CREATED);
        expect(actionObjCreated.meta).to.deep.equal({
          ...expectedResponseMeta,
          transformation: {},
          timestamp: actionObjCreated.meta.timestamp,
        });
        expect(actionObjCreated.payload).to.deep.equal(expectedPayload.data);

        const actionCollStatus = batchedActionsSuccess[1];
        expect(actionCollStatus.type).to.equal(REFERENCE_STATUS);
        expect(actionCollStatus.meta).to.deep.equal({
          ...expectedResponseMeta,
          tag: '*',
          timestamp: actionCollStatus.meta.timestamp,
        });
        const expectedCollStatusPayload = {
          validationStatus: validationStatus.INVALID,
          busyStatus: busyStatus.IDLE,
        };
        expect(actionCollStatus.payload).to.deep.equal(expectedCollStatusPayload);

        const successAction = performedActions[3];
        expect(successAction.type).to.equal(CREATE_SUCCESS);
        expect(successAction.meta).to.deep.equal({
          ...expectedResponseMeta,
          timestamp: successAction.meta.timestamp,
        });
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });

  it('produces valid storage without invalidating references', done => {
    const schema = 'schema_test';
    const expectedPayload = {
      data: {
        schema,
        id: '1',
        type: schema,
        attributes: {
          name: 'Test1',
        },
      },
    };

    const item = {
      schema,
      attributes: {
        name: 'Test1',
      },
    };
    nock('http://api.server.local')
      .post('/apps')
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

    const options = { invalidate: false };

    const expectedMeta = {
      source: JSON_API_SOURCE,
      endpoint: config.endpoint,
      params: {},
      options,
      schema,
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

    const action = create(schemaConfig, item, {}, options);
    const store = mockStore({});
    store.dispatch(action)
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(3);

        expect(performedActions[0].type).to.equal(CREATE_REQUEST);

        const batchedActionsSuccess = performedActions[1].payload;

        const actionObjCreated = batchedActionsSuccess[0];
        expect(actionObjCreated.type).to.equal(OBJECT_CREATED);
        expect(actionObjCreated.meta).to.deep.equal({
          ...expectedResponseMeta,
          transformation: {},
          timestamp: actionObjCreated.meta.timestamp,
        });
        expect(actionObjCreated.payload).to.deep.equal(expectedPayload.data);

        const successAction = performedActions[2];
        expect(successAction.type).to.equal(CREATE_SUCCESS);
        expect(successAction.meta).to.deep.equal({
          ...expectedResponseMeta,
          timestamp: successAction.meta.timestamp,
        });
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });
});
