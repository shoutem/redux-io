/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import nock from 'nock';
import { RSAA, apiMiddleware } from 'redux-api-middleware';
import sinon from 'sinon';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import {
  apiStateMiddleware,
  JSON_API_SOURCE,
} from '../../src';
import create from '../../src/actions/create';

describe('thunkActions', () => {
  const middlewares = [thunk, apiMiddleware, apiStateMiddleware];
  let mockStore = configureMockStore(middlewares);

  beforeEach(() => {
    nock.cleanAll();
    mockStore = configureMockStore(middlewares);
  });

  it('resolves valid action',  done => {
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
    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
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

    const action = create(schemaConfig, item);

    const success = sinon.spy();
    const error = sinon.spy();

    const store = mockStore({});
    store.dispatch(action)
      .then(success, error)
      .then(() => {
        sinon.assert.calledOnce(success);
        sinon.assert.notCalled(error);
        done();
      })
      .catch(done);
  });

  it('rejects action with error',  done => {
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
    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
    };

    const item = {
      schema,
      attributes: {
        name: 'Test1',
      },
    };
    nock('http://api.server.local')
      .post('/apps')
      .reply(401, expectedPayload, { 'Content-Type': 'vnd.api+json' });

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

    const action = create(schemaConfig, item);

    const success = sinon.spy();
    const error = sinon.spy();

    const store = mockStore({});
    store.dispatch(action)
      .then(success, error)
      .then(() => {
        sinon.assert.notCalled(success);
        sinon.assert.calledOnce(error);
        done();
      })
      .catch(done);
  });
});
