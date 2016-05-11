/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import nock from 'nock';
import { CALL_API, apiMiddleware } from 'redux-api-middleware';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  create,
  CREATE_REQUEST,
  CREATE_SUCCESS,
  CREATE_ERROR,
  OBJECT_CREATED,
  COLLECTION_STATUS,
  apiStateMiddleware,
} from '../src';
import { middlewareJsonApiSource } from '../src/middleware';
import {
  validationStatus,
  busyStatus,
} from '../src/status';

describe('Create action creator', () => {
  const middlewares = [thunk, apiMiddleware, apiStateMiddleware];
  let mockStore = configureMockStore(middlewares);

  beforeEach(() => {
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

    const schema = 'schema_test';
    const item = {
      schema,
      id: '1',
      attributes: {
        name: 'Test1',
      },
    };
    const action = create(config, schema, item);

    expect(action[CALL_API]).to.not.be.undefined;
    expect(action[CALL_API].method).to.equal('POST');
    expect(action[CALL_API].endpoint).to.equal(config.endpoint);
    expect(action[CALL_API].headers).to.equal(config.headers);
    const expectedBody = JSON.stringify({
      data: item,
    });
    expect(action[CALL_API].body).to.equal(expectedBody);
    expect(action[CALL_API].types).to.not.be.undefined;

    const expectedMeta = {
      source: middlewareJsonApiSource,
      schema,
    };
    const types = action[CALL_API].types;
    expect(types[0].type).to.equal(CREATE_REQUEST);
    expect(types[0].meta).to.deep.equal(expectedMeta);
    expect(types[1].type).to.equal(CREATE_SUCCESS);
    expect(types[1].meta).to.deep.equal(expectedMeta);
    expect(types[2]).to.equal(CREATE_ERROR);
  });

  it('throws exception on invalid action with undefined config', () => {
    const config = undefined;

    const schema = 'schema_test';
    const item = {
      schema,
      id: '1',
      attributes: {
        name: 'Test1',
      },
    };
    expect(() => create(config, schema, item)).to.throw('Config isn\'t object.');
  });

  it('throws exception on invalid action with invalid schema', () => {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
    };

    const schema = '';
    const item = {
      schema,
      id: '1',
      attributes: {
        name: 'Test1',
      },
    };
    expect(() => create(config, schema, item)).to.throw('Schema is invalid.');
  });

  it('throws exception on invalid action with invalid item', () => {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
    };

    const schema = 'app.builder';
    const item = undefined;
    expect(() => create(config, schema, item)).to.throw('Item isn\'t object.');
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
    const expectedMeta = {
      source: middlewareJsonApiSource,
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

    const action = create(config, schema, item);
    const store = mockStore({});
    store.dispatch(action)
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(5);

        const actionCollStatusBusy = performedActions[0];
        expect(actionCollStatusBusy.type).to.equal(COLLECTION_STATUS);
        expect(actionCollStatusBusy.meta)
          .to.deep.equal({ ...expectedMeta, tag: '', broadcast: true });
        const expectedCollStatusBusyPayload = {
          busyStatus: busyStatus.BUSY,
          validationStatus: validationStatus.INVALID,
        };
        expect(actionCollStatusBusy.payload).to.deep.equal(expectedCollStatusBusyPayload);

        expect(performedActions[1].type).to.equal(CREATE_REQUEST);

        const actionObjCreated = performedActions[2];
        expect(actionObjCreated.type).to.equal(OBJECT_CREATED);
        expect(actionObjCreated.meta).to.deep.equal(expectedMeta);
        expect(actionObjCreated.payload).to.deep.equal(expectedPayload.data);

        const actionCollStatus = performedActions[3];
        expect(actionCollStatus.type).to.equal(COLLECTION_STATUS);
        expect(actionCollStatus.meta).to.deep.equal({ ...expectedMeta, tag: '', broadcast: true });
        const expectedCollStatusPayload = {
          validationStatus: validationStatus.INVALID,
          busyStatus: busyStatus.IDLE,
        };
        expect(actionCollStatus.payload).to.deep.equal(expectedCollStatusPayload);

        const successAction = performedActions[4];
        expect(successAction.type).to.equal(CREATE_SUCCESS);
        expect(successAction.meta).to.deep.equal(expectedMeta);
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });
});

