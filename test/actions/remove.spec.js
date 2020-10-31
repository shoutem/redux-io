/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import nock from 'nock';
import { RSAA, apiMiddleware } from 'redux-api-middleware';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import rio, {
  REMOVE_REQUEST,
  REMOVE_SUCCESS,
  REMOVE_ERROR,
  OBJECT_REMOVING,
  OBJECT_REMOVED,
  REFERENCE_STATUS,
  apiStateMiddleware,
  JSON_API_SOURCE,
  ReduxApiStateDenormalizer,
} from '../../src';
import {
  validationStatus,
  busyStatus,
} from '../../src/status';
import  { remove } from '../../src/actions/remove';

describe('Delete action creator', () => {
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

    const schemaConfig = {
      schema,
      request: config,
    };

    const item = { id: 1 };
    const action = remove(schemaConfig, item);

    expect(action[RSAA]).to.not.be.undefined;
    expect(action[RSAA].method).to.equal('DELETE');
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
        headers: {}
      },
    };
    const metaResponse = [{}, {}, new Response(null, {
      "status": 200,
      "headers": {},
    })];

    expect(types[0].type).to.equal(REMOVE_REQUEST);
    expect(types[0].meta).to.deep.equal(expectedMeta);
    expect(types[1].type).to.equal(REMOVE_SUCCESS);
    expect(types[1].meta(...metaResponse)).to.deep.equal(expectedResponseMeta);
    expect(types[2].type).to.equal(REMOVE_ERROR);
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

    const action = remove(schemaConfig, item, params);

    const expectedEndpoint = 'api.test/a/b/abc?q1=c&q2=d';
    expect(action[RSAA]).to.not.be.undefined;
    expect(action[RSAA].method).to.equal('DELETE');
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
    const metaResponse = [{}, {}, new Response(null, {
      "status": 200,
      "headers": {},
    })];

    expect(types[0].type).to.equal(REMOVE_REQUEST);
    expect(types[0].meta).to.deep.equal(expectedMeta);
    expect(types[1].type).to.equal(REMOVE_SUCCESS);
    expect(types[1].meta(...metaResponse)).to.deep.equal(expectedResponseMeta);
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

    expect(() => remove(schemaConfig, item)).to.throw(
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
    expect(() => remove(schemaConfig)).to.throw(
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
    expect(() => remove(schemaConfig, item)).to.throw('Item isn\'t object.');
  });

  it('produces valid storage and collection actions', done => {
    const schema = 'schema_test';
    const item = { id: 1, type: schema };

    nock('http://api.server.local')
      .delete('/apps/1')
      .reply(200, {}, { 'Content-Type': 'vnd.api+json' });

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

    const action = remove(schemaConfig, item);

    const store = mockStore({});
    store.dispatch(action)
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(4);

        const batchedRemovingActions = performedActions[0];
        const actionCollBusyRequest = batchedRemovingActions.payload[0];
        expect(actionCollBusyRequest.type).to.equal(REFERENCE_STATUS);
        expect(actionCollBusyRequest.meta)
          .to.deep.equal({ ...expectedMeta, tag: '*', timestamp: actionCollBusyRequest.meta.timestamp });
        const expectedCollBusyStatusPayload = {
          validationStatus: validationStatus.INVALID,
          busyStatus: busyStatus.BUSY,
        };
        expect(actionCollBusyRequest.payload).to.deep.equal(expectedCollBusyStatusPayload);

        const actionObjDeleting = batchedRemovingActions.payload[1];
        expect(actionObjDeleting.type).to.equal(OBJECT_REMOVING);
        expect(actionObjDeleting.meta).to.deep.equal({
          ...expectedMeta,
          transformation: {},
          timestamp: actionObjDeleting.meta.timestamp
        });

        expect(performedActions[1].type).to.equal(REMOVE_REQUEST);

        const batchedRemovedActions = performedActions[2];
        const actionObjRemoved = batchedRemovedActions.payload[0];
        expect(actionObjRemoved.type).to.equal(OBJECT_REMOVED);
        expect(actionObjRemoved.meta).to.deep.equal({
          ...expectedMeta,
          transformation: {},
          timestamp: actionObjRemoved.meta.timestamp,
          response: {
            status: 200,
            headers: {
              "content-type": "vnd.api+json",
            }
          },
        });

        const actionCollStatus = batchedRemovedActions.payload[1];
        expect(actionCollStatus.type).to.equal(REFERENCE_STATUS);
        expect(actionCollStatus.meta).to.deep.equal({
          ...expectedMeta,
          tag: '*',
          timestamp: actionCollStatus.meta.timestamp,
          response: {
            status: 200,
            headers: {
              "content-type": "vnd.api+json",
            }
          },
        });
        const expectedCollStatusPayload = {
          validationStatus: validationStatus.INVALID,
          busyStatus: busyStatus.IDLE,
        };
        expect(actionCollStatus.payload).to.deep.equal(expectedCollStatusPayload);

        const successAction = performedActions[3];
        expect(successAction.type).to.equal(REMOVE_SUCCESS);
        expect(successAction.meta).to.deep.equal({
          ...expectedMeta,
          timestamp: successAction.meta.timestamp,
          response: {
            status: 200,
            headers: {
              "content-type": "vnd.api+json",
            }
          },
        });
      }).then(done).catch(done);
  });

  it('produces valid storage without invalidating collections', done => {
    const schema = 'schema_test';
    const item = { id: 1, type: schema };

    nock('http://api.server.local')
      .delete('/apps/1')
      .reply(200, {}, { 'Content-Type': 'vnd.api+json' });

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

    const options = { invalidate: false };

    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
      endpoint: config.endpoint,
      params: {},
      options,
    };

    const action = remove(schemaConfig, item, {}, options);

    const store = mockStore({});
    store.dispatch(action)
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(4);

        const batchedRemovingActions = performedActions[0];
        const actionObjDeleting = batchedRemovingActions.payload[0];
        expect(actionObjDeleting.type).to.equal(OBJECT_REMOVING);
        expect(actionObjDeleting.meta).to.deep.equal({
          ...expectedMeta,
          transformation: {},
          timestamp: actionObjDeleting.meta.timestamp
        });

        expect(performedActions[1].type).to.equal(REMOVE_REQUEST);

        const batchedRemovedActions = performedActions[2];
        const actionObjRemoved = batchedRemovedActions.payload[0];
        expect(actionObjRemoved.type).to.equal(OBJECT_REMOVED);
        expect(actionObjRemoved.meta).to.deep.equal({
          ...expectedMeta,
          transformation: {},
          timestamp: actionObjRemoved.meta.timestamp,
          response: {
            status: 200,
            headers: {
              "content-type": "vnd.api+json",
            }
          },
        });

        const successAction = performedActions[3];
        expect(successAction.type).to.equal(REMOVE_SUCCESS);
        expect(successAction.meta).to.deep.equal({
          ...expectedMeta,
          timestamp: successAction.meta.timestamp,
          response: {
            status: 200,
            headers: {
              "content-type": "vnd.api+json",
            }
          },
        });
      }).then(done).catch(done);
  });
});
