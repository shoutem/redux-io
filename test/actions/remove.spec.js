/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import nock from 'nock';
import { RSAA, apiMiddleware } from 'redux-api-middleware';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  remove,
  REMOVE_REQUEST,
  REMOVE_SUCCESS,
  REMOVE_ERROR,
  OBJECT_REMOVING,
  OBJECT_REMOVED,
  REFERENCE_STATUS,
  apiStateMiddleware,
} from '../../src';
import { middlewareJsonApiSource } from '../../src/middleware';
import {
  validationStatus,
  busyStatus,
} from '../../src/status';

describe('Delete action creator', () => {
  const middlewares = [thunk, apiMiddleware, apiStateMiddleware];
  let mockStore = configureMockStore(middlewares);

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
    const action = remove(config, schema, item);

    expect(action[RSAA]).to.not.be.undefined;
    expect(action[RSAA].method).to.equal('DELETE');
    expect(action[RSAA].endpoint).to.equal(config.endpoint);
    expect(action[RSAA].headers).to.equal(config.headers);
    expect(action[RSAA].types).to.not.be.undefined;

    const expectedMeta = {
      source: middlewareJsonApiSource,
      schema,
    };

    const types = action[RSAA].types;
    expect(types[0].type).to.equal(REMOVE_REQUEST);
    expect(types[0].meta).to.deep.equal(expectedMeta);
    expect(types[1].type).to.equal(REMOVE_SUCCESS);
    expect(types[1].meta).to.deep.equal(expectedMeta);
    expect(types[2].type).to.equal(REMOVE_ERROR);
    expect(types[2].meta).to.deep.equal(expectedMeta);
  });

  it('throws exception on invalid action with null config', () => {
    const config = null;
    const schema = 'app.builder';
    const item = {};
    expect(() => remove(config, schema, item)).to.throw('Config isn\'t object.');
  });

  it('throws exception on invalid action with string config', () => {
    const config = '';
    const schema = 'app.builder';
    const item = {};
    expect(() => remove(config, schema, item)).to.throw('Config isn\'t object.');
  });

  it('throws exception on invalid action with invalid schema', () => {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
    };
    const schema = '';
    const item = {};
    expect(() => remove(config, schema, item)).to.throw('Schema is invalid.');
  });

  it('throws exception on invalid action with invalid item', () => {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
    };
    const schema = 'app.builder';
    const item = 0;
    expect(() => remove(config, schema, item)).to.throw('Item isn\'t object.');
  });

  it('produces valid storage and collection actions', done => {
    const schema = 'schema_test';
    const item = { id: 1, type: schema };
    const expectedMeta = {
      source: middlewareJsonApiSource,
      schema,
    };

    nock('http://api.server.local')
      .delete('/apps/1')
      .reply(200, {}, { 'Content-Type': 'vnd.api+json' });

    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'http://api.server.local/apps/1',
    };

    const action = remove(config, schema, item);

    const store = mockStore({});
    store.dispatch(action)
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(4);

        const batchedRemovingActions = performedActions[0];
        const actionCollBusyRequest = batchedRemovingActions.payload[0];
        expect(actionCollBusyRequest.type).to.equal(REFERENCE_STATUS);
        expect(actionCollBusyRequest.meta)
          .to.deep.equal({ ...expectedMeta, tag: '*' });
        const expectedCollBusyStatusPayload = {
          validationStatus: validationStatus.INVALID,
          busyStatus: busyStatus.BUSY,
        };
        expect(actionCollBusyRequest.payload).to.deep.equal(expectedCollBusyStatusPayload);

        const actionObjDeleting = batchedRemovingActions.payload[1];
        expect(actionObjDeleting.type).to.equal(OBJECT_REMOVING);
        expect(actionObjDeleting.meta).to.deep.equal({ ...expectedMeta, transformation: {} });

        expect(performedActions[1].type).to.equal(REMOVE_REQUEST);

        const batchedRemovedActions = performedActions[2];
        const actionObjRemoved = batchedRemovedActions.payload[0];
        expect(actionObjRemoved.type).to.equal(OBJECT_REMOVED);
        expect(actionObjRemoved.meta).to.deep.equal({ ...expectedMeta, transformation: {} });

        const actionCollStatus = batchedRemovedActions.payload[1];
        expect(actionCollStatus.type).to.equal(REFERENCE_STATUS);
        expect(actionCollStatus.meta).to.deep.equal({ ...expectedMeta, tag: '*' });
        const expectedCollStatusPayload = {
          validationStatus: validationStatus.INVALID,
          busyStatus: busyStatus.IDLE,
        };
        expect(actionCollStatus.payload).to.deep.equal(expectedCollStatusPayload);

        const successAction = performedActions[3];
        expect(successAction.type).to.equal(REMOVE_SUCCESS);
        expect(successAction.meta).to.deep.equal(expectedMeta);
      }).then(done).catch(done);
  });
});
