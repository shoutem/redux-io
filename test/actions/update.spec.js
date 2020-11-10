/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import nock from 'nock';
import { RSAA, apiMiddleware } from 'redux-api-middleware';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import rio, {
  UPDATE_REQUEST,
  UPDATE_SUCCESS,
  UPDATE_ERROR,
  OBJECT_UPDATING,
  OBJECT_UPDATED,
  REFERENCE_STATUS,
  apiStateMiddleware,
  JSON_API_SOURCE,
  ReduxApiStateDenormalizer,
} from '../../src';
import {
  validationStatus,
  busyStatus,
} from '../../src/status';
import  { update } from '../../src/actions/update';

describe('Update action creator', () => {
  const middlewares = [thunk, apiMiddleware, apiStateMiddleware];
  let mockStore = configureMockStore(middlewares);

  beforeEach(() => {
    const denormalizer = new ReduxApiStateDenormalizer();
    rio.setDenormalizer(denormalizer);
  });

  afterEach(() => {
    nock.cleanAll();
    mockStore = configureMockStore(middlewares);
  });

  it('creates a valid action', () => {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
    };
    const schema = 'app.builder';
    const item = { id: 1 };

    const schemaConfig = {
      schema,
      request: config,
    };

    const action = update(schemaConfig, item);

    expect(action[RSAA]).to.not.be.undefined;
    expect(action[RSAA].method).to.equal('PATCH');
    expect(action[RSAA].endpoint).to.equal(config.endpoint);
    expect(action[RSAA].headers).to.deep.equal(config.headers);
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

    expect(types[0].type).to.equal(UPDATE_REQUEST);
    expect(types[0].meta).to.deep.equal(expectedMeta);
    expect(types[0].payload).to.deep.equal({ data: item });
    expect(types[1].type).to.equal(UPDATE_SUCCESS);
    expect(types[1].meta(...metaResponse)).to.deep.equal(expectedResponseMeta);
    expect(types[2].type).to.equal(UPDATE_ERROR);
    expect(types[2].meta(...metaResponse)).to.deep.equal(expectedResponseMeta);
  });

  it('creates a valid action with valid endpoint with filled params', () => {
    const schema = 'app.builder';
    const item = { id: 1 };

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

    const action = update(schemaConfig, item, params);

    const expectedEndpoint = 'api.test/a/b/abc?q1=c&q2=d';
    expect(action[RSAA]).to.not.be.undefined;
    expect(action[RSAA].method).to.equal('PATCH');
    expect(action[RSAA].endpoint).to.equal(expectedEndpoint);
    expect(action[RSAA].headers).to.deep.equal(config.headers);
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

    expect(types[0].type).to.equal(UPDATE_REQUEST);
    expect(types[0].meta).to.deep.equal(expectedMeta);
    expect(types[1].type).to.equal(UPDATE_SUCCESS);
    expect(types[1].meta(...metaResponse)).to.deep.equal(expectedResponseMeta);
  });

  it('creates a valid action with denormalized item based on config.schema', () => {
    const schemaType = 'schema_test';
    const item = {
      type: schemaType,
      id: '1',
      name: 'Test1',
    };
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
      body: 'Body',
    };

    const schema = {
      type: schemaType,
      relationships: { },
    }

    const schemaConfig = {
      schema: schema,
      request: config,
    };

    const action = update(schemaConfig, item);

    const expectedItem = {
      type: schemaType,
      id: '1',
      attributes: {
        name: 'Test1',
      },
    };
    expect(JSON.parse(action[RSAA].body)).to.deep.equal({ data: expectedItem });
  });

  it('creates a valid action with denormalized item without schema', () => {
    const schemaType = 'schema_test';
    const item = {
      type: schemaType,
      id: '1',
      name: 'Test1',
      owner: {
        type: 'app.owner',
        id: 'ABC',
        name: 'User',
        age: 22,
      },
    };
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
      body: 'Body',
    };

    const resourceConfig = {
      schema: schemaType,
      request: config,
    };

    const action = update(resourceConfig, item);

    const expectedItem = {
      type: schemaType,
      id: '1',
      attributes: {
        name: 'Test1',
      },
      relationships: {
        owner: {
          data: {
            type: 'app.owner',
            id: 'ABC',
          },
        },
      },
    };
    expect(JSON.parse(action[RSAA].body)).to.deep.equal({ data: expectedItem });
  });

  it('creates a valid action where normalized item in argument has priority over item in config.body', () => {
    const schema = 'schema_test';
    const item = {
      type: schema,
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
      body: 'Body',
    };

    const schemaConfig = {
      schema,
      request: config,
    };

    const action = update(schemaConfig, item);

    expect(action[RSAA].body).to.equal(JSON.stringify({ data: item }));
  });

  it('throws exception on action with resource configuration is invalid', () => {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
    };

    const item = {};

    const schemaConfig = {
      request: config,
    };

    expect(() => update(schemaConfig, item)).to.throw(
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
    expect(() => update(schemaConfig)).to.throw(
      'Couldn\'t resolve schema schema_test in function find.'
    );
  });

  it('throws exception on invalid action with invalid item', () => {
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

    const item = 0;
    expect(() => update(schemaConfig, item)).to.throw('Item is not valid in method argument');
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
    expect(() => update(schemaConfig))
      .to.not.throw();
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

    const action = update(schemaConfig);

    expect(action[RSAA].body).to.equal(config.body);
  });

  it('produces valid storage and collection actions', done => {
    const schema = 'schema_test';
    const item = { id: 2, type: schema };
    const expectedPayload = {
      data: item,
    };

    nock('http://api.server.local')
      .patch('/apps/1')
      .reply(200, expectedPayload, { 'Content-Type': 'vnd.api+json' });

    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'http://api.server.local/apps/1',
    };

    const schemaConfig = {
      schema,
      request: config,
    };

    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
      endpoint: config.endpoint,
      params: {},
      options: {},
    };

    const action = update(schemaConfig, item);

    const store = mockStore({});
    store.dispatch(action)
      .then(() => {
        const performedActions = store.getActions();

        expect(performedActions).to.have.length(4);

        const batchedUpdatingActions = performedActions[0];
        const actionCollStatusBusy = batchedUpdatingActions.payload[0];
        expect(actionCollStatusBusy.type).to.equal(REFERENCE_STATUS);
        expect(actionCollStatusBusy.meta)
          .to.deep.equal({ ...expectedMeta, tag: '*', timestamp: actionCollStatusBusy.meta.timestamp });
        const expectedCollStatusBusyPayload = {
          busyStatus: busyStatus.BUSY,
          validationStatus: validationStatus.INVALID,
        };
        expect(actionCollStatusBusy.payload).to.deep.equal(expectedCollStatusBusyPayload);

        const actionObjUpdating = batchedUpdatingActions.payload[1];
        expect(actionObjUpdating.type).to.equal(OBJECT_UPDATING);
        expect(actionObjUpdating.meta).to.deep.equal({
          ...expectedMeta,
          transformation: {},
          timestamp: actionObjUpdating.meta.timestamp
        });
        expect(actionObjUpdating.payload).to.deep.equal(item);

        const actionUpdateRequest = performedActions[1];
        expect(actionUpdateRequest.type).to.equal(UPDATE_REQUEST);
        expect(actionUpdateRequest.meta).to.deep.equal({
          ...expectedMeta,
          timestamp: actionUpdateRequest.meta.timestamp,
        });
        expect(actionUpdateRequest.payload).to.deep.equal(expectedPayload);

        const batchedUpdatedActions = performedActions[2];
        const actionObjUpdated = batchedUpdatedActions.payload[0];
        expect(actionObjUpdated.type).to.equal(OBJECT_UPDATED);
        expect(actionObjUpdated.meta).to.deep.equal({
          ...expectedMeta,
          transformation: {},
          timestamp: actionObjUpdated.meta.timestamp,
          response: {
            status: 200,
            headers: {
              'content-type': 'vnd.api+json'
            },
          },
        });
        expect(actionObjUpdated.payload).to.deep.equal(expectedPayload.data);

        const actionCollStatusIdle = batchedUpdatedActions.payload[1];
        expect(actionCollStatusIdle.type).to.equal(REFERENCE_STATUS);
        expect(actionCollStatusIdle.meta).to.deep.equal({
          ...expectedMeta,
          tag: '*',
          timestamp: actionObjUpdated.meta.timestamp,
          response: {
            status: 200,
            headers: {
              'content-type': 'vnd.api+json'
            },
          },
        });
        const expectedCollStatusIdlePayload = {
          busyStatus: busyStatus.IDLE,
          validationStatus: validationStatus.INVALID,
        };
        expect(actionCollStatusIdle.payload).to.deep.equal(expectedCollStatusIdlePayload);

        const successAction = performedActions[3];
        expect(successAction.type).to.equal(UPDATE_SUCCESS);
        expect(successAction.meta).to.deep.equal({
          ...expectedMeta,
          timestamp: successAction.meta.timestamp,
          response: {
            status: 200,
            headers: {
              'content-type': 'vnd.api+json'
            },
          },
        });
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });

  it('produces valid storage without invalidating references', done => {
    const schema = 'schema_test';
    const item = { id: 2, type: schema };
    const expectedPayload = {
      data: item,
    };

    nock('http://api.server.local')
      .patch('/apps/1')
      .reply(200, expectedPayload, { 'Content-Type': 'vnd.api+json' });

    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'http://api.server.local/apps/1',
    };

    const schemaConfig = {
      schema,
      request: config,
    };

    const options = { invalidateReferences: false };

    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
      endpoint: config.endpoint,
      params: {},
      options,
    };

    const action = update(schemaConfig, item, {}, options);

    const store = mockStore({});
    store.dispatch(action)
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(4);

        const batchedUpdatingActions = performedActions[0];
        const actionObjUpdating = batchedUpdatingActions.payload[0];
        expect(actionObjUpdating.type).to.equal(OBJECT_UPDATING);
        expect(actionObjUpdating.meta).to.deep.equal({
          ...expectedMeta,
          transformation: {},
          timestamp: actionObjUpdating.meta.timestamp
        });
        expect(actionObjUpdating.payload).to.deep.equal(item);

        const actionUpdateRequest = performedActions[1];
        expect(actionUpdateRequest.type).to.equal(UPDATE_REQUEST);
        expect(actionUpdateRequest.meta).to.deep.equal({
          ...expectedMeta,
          timestamp: actionUpdateRequest.meta.timestamp,
        });
        expect(actionUpdateRequest.payload).to.deep.equal(expectedPayload);

        const batchedUpdatedActions = performedActions[2];
        const actionObjUpdated = batchedUpdatedActions.payload[0];
        expect(actionObjUpdated.type).to.equal(OBJECT_UPDATED);
        expect(actionObjUpdated.meta).to.deep.equal({
          ...expectedMeta,
          transformation: {},
          timestamp: actionObjUpdated.meta.timestamp,
          response: {
            status: 200,
            headers: {
              'content-type': 'vnd.api+json'
            },
          },
        });
        expect(actionObjUpdated.payload).to.deep.equal(expectedPayload.data);

        const successAction = performedActions[3];
        expect(successAction.type).to.equal(UPDATE_SUCCESS);
        expect(successAction.meta).to.deep.equal({
          ...expectedMeta,
          timestamp: successAction.meta.timestamp,
          response: {
            status: 200,
            headers: {
              'content-type': 'vnd.api+json'
            },
          },
        });
        expect(successAction.payload).to.deep.equal(expectedPayload);

      }).then(done).catch(done);
  });

  it('produces valid collection actions without invalidating resources', done => {
    const schema = 'schema_test';
    const item = { id: 2, type: schema };
    const expectedPayload = {
      data: item,
    };

    nock('http://api.server.local')
      .patch('/apps/1')
      .reply(200, expectedPayload, { 'Content-Type': 'vnd.api+json' });

    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'http://api.server.local/apps/1',
    };

    const schemaConfig = {
      schema,
      request: config,
    };

    const options = { invalidateResources: false };

    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
      endpoint: config.endpoint,
      params: {},
      options,
    };

    const action = update(schemaConfig, item, {}, options);

    const store = mockStore({});
    store.dispatch(action)
      .then(() => {
        const performedActions = store.getActions();

        expect(performedActions).to.have.length(4);

        const batchedUpdatingActions = performedActions[0];
        const actionCollStatusBusy = batchedUpdatingActions.payload[0];
        expect(actionCollStatusBusy.type).to.equal(REFERENCE_STATUS);
        expect(actionCollStatusBusy.meta)
          .to.deep.equal({ ...expectedMeta, tag: '*', timestamp: actionCollStatusBusy.meta.timestamp });
        const expectedCollStatusBusyPayload = {
          busyStatus: busyStatus.BUSY,
          validationStatus: validationStatus.INVALID,
        };
        expect(actionCollStatusBusy.payload).to.deep.equal(expectedCollStatusBusyPayload);

        const actionUpdateRequest = performedActions[1];
        expect(actionUpdateRequest.type).to.equal(UPDATE_REQUEST);
        expect(actionUpdateRequest.meta).to.deep.equal({
          ...expectedMeta,
          timestamp: actionUpdateRequest.meta.timestamp,
        });
        expect(actionUpdateRequest.payload).to.deep.equal(expectedPayload);

        const batchedUpdatedActions = performedActions[2];
        
        const actionCollStatusIdle = batchedUpdatedActions.payload[0];
        expect(actionCollStatusIdle.type).to.equal(REFERENCE_STATUS);
        expect(actionCollStatusIdle.meta).to.deep.equal({
          ...expectedMeta,
          tag: '*',
          timestamp: actionCollStatusIdle.meta.timestamp,
          response: {
            status: 200,
            headers: {
              'content-type': 'vnd.api+json'
            },
          },
        });
        const expectedCollStatusIdlePayload = {
          busyStatus: busyStatus.IDLE,
          validationStatus: validationStatus.INVALID,
        };
        expect(actionCollStatusIdle.payload).to.deep.equal(expectedCollStatusIdlePayload);

        const successAction = performedActions[3];
        expect(successAction.type).to.equal(UPDATE_SUCCESS);
        expect(successAction.meta).to.deep.equal({
          ...expectedMeta,
          timestamp: successAction.meta.timestamp,
          response: {
            status: 200,
            headers: {
              'content-type': 'vnd.api+json'
            },
          },
        });
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });
});
