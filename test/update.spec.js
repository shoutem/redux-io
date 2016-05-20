/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import nock from 'nock';
import { CALL_API, apiMiddleware } from 'redux-api-middleware';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  update,
  UPDATE_REQUEST,
  UPDATE_SUCCESS,
  UPDATE_ERROR,
  OBJECTS_UPDATING,
  OBJECTS_UPDATED,
  COLLECTION_STATUS,
  apiStateMiddleware,
} from '../src';
import { middlewareJsonApiSource } from '../src/middleware';
import {
  validationStatus,
  busyStatus,
} from '../src/status';

describe('Update action creator', () => {
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
    const action = update(config, schema, item);

    expect(action[CALL_API]).to.not.be.undefined;
    expect(action[CALL_API].method).to.equal('PATCH');
    expect(action[CALL_API].endpoint).to.equal(config.endpoint);
    expect(action[CALL_API].headers).to.equal(config.headers);
    expect(action[CALL_API].types).to.not.be.undefined;

    const types = action[CALL_API].types;
    const expectedMeta = {
      source: middlewareJsonApiSource,
      schema,
    };
    expect(types[0].type).to.equal(UPDATE_REQUEST);
    expect(types[0].meta).to.deep.equal(expectedMeta);
    expect(types[0].payload).to.deep.equal({ data: item });
    expect(types[1].type).to.equal(UPDATE_SUCCESS);
    expect(types[1].meta).to.deep.equal(expectedMeta);
    expect(types[2]).to.equal(UPDATE_ERROR);
  });

  it('throws exception on invalid action with null config', () => {
    const config = null;
    const schema = 'app.builder';
    const item = {};
    expect(() => update(config, schema, item)).to.throw('Config isn\'t object.');
  });

  it('throws exception on invalid action with string config', () => {
    const config = '';
    const schema = 'app.builder';
    const item = {};
    expect(() => update(config, schema, item)).to.throw('Config isn\'t object.');
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
    expect(() => update(config, schema, item)).to.throw('Schema is invalid.');
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
    expect(() => update(config, schema, item)).to.throw('Item isn\'t object.');
  });

  it('produces valid storage and collection actions', done => {
    const schema = 'schema_test';
    const item = { id: 2, type: schema };
    const expectedMeta = {
      source: middlewareJsonApiSource,
      schema,
    };
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

    const action = update(config, schema, item);

    const store = mockStore({});
    store.dispatch(action)
      .then(() => {
        const performedActions = store.getActions();

        expect(performedActions).to.have.length(6);

        const actionCollStatusBusy = performedActions[0];
        expect(actionCollStatusBusy.type).to.equal(COLLECTION_STATUS);
        expect(actionCollStatusBusy.meta)
          .to.deep.equal({ ...expectedMeta, tag: '*' });
        const expectedCollStatusBusyPayload = {
          busyStatus: busyStatus.BUSY,
          validationStatus: validationStatus.INVALID,
        };
        expect(actionCollStatusBusy.payload).to.deep.equal(expectedCollStatusBusyPayload);

        const actionObjUpdating = performedActions[1];
        expect(actionObjUpdating.type).to.equal(OBJECTS_UPDATING);
        expect(actionObjUpdating.meta).to.deep.equal(expectedMeta);
        expect(actionObjUpdating.payload).to.deep.equal([item]);

        const actionUpdateRequest = performedActions[2];
        expect(actionUpdateRequest.type).to.equal(UPDATE_REQUEST);
        expect(actionUpdateRequest.meta).to.deep.equal(expectedMeta);
        expect(actionUpdateRequest.payload).to.deep.equal(expectedPayload);

        const actionObjUpdated = performedActions[3];
        expect(actionObjUpdated.type).to.equal(OBJECTS_UPDATED);
        expect(actionObjUpdated.meta).to.deep.equal(expectedMeta);
        expect(actionObjUpdated.payload).to.deep.equal([item]);

        const actionCollStatusIdle = performedActions[4];
        expect(actionCollStatusIdle.type).to.equal(COLLECTION_STATUS);
        expect(actionCollStatusIdle.meta)
          .to.deep.equal({ ...expectedMeta, tag: '*' });
        const expectedCollStatusIdlePayload = {
          busyStatus: busyStatus.IDLE,
          validationStatus: validationStatus.INVALID,
        };
        expect(actionCollStatusIdle.payload).to.deep.equal(expectedCollStatusIdlePayload);

        const successAction = performedActions[5];
        expect(successAction.type).to.equal(UPDATE_SUCCESS);
        expect(successAction.meta).to.deep.equal(expectedMeta);
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });
});
