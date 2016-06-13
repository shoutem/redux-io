/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import nock from 'nock';
import { RSAA, apiMiddleware } from 'redux-api-middleware';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  find,
  LOAD_REQUEST,
  LOAD_SUCCESS,
  LOAD_ERROR,
  OBJECT_FETCHED,
  REFERENCE_FETCHED,
  REFERENCE_STATUS,
  apiStateMiddleware,
} from '../src';
import { middlewareJsonApiSource } from '../src/middleware';
import {
  busyStatus,
} from '../src/status';

describe('Find action creator', () => {
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
    const tag = 'collection_test';
    const action = find(config, schema, tag);

    expect(action[RSAA]).to.not.be.undefined;
    expect(action[RSAA].method).to.equal('GET');
    expect(action[RSAA].endpoint).to.equal(config.endpoint);
    expect(action[RSAA].headers).to.equal(config.headers);
    expect(action[RSAA].types).to.not.be.undefined;

    const types = action[RSAA].types;
    const expectedMeta = {
      source: middlewareJsonApiSource,
      schema,
      tag,
    };
    expect(types[0].type).to.equal(LOAD_REQUEST);
    expect(types[0].meta).to.deep.equal(expectedMeta);
    expect(types[1].type).to.equal(LOAD_SUCCESS);
    expect(types[1].meta).to.deep.equal(expectedMeta);
    expect(types[2].type).to.equal(LOAD_ERROR);
    expect(types[2].meta).to.deep.equal(expectedMeta);
  });

  it('creates a invalid action with null config', () => {
    const config = null;

    const schema = 'app.builder';
    const tag = 'collection_test';
    expect(() => find(config, schema, tag)).to.throw('Config isn\'t object.');
  });

  it('creates a invalid action with string config', () => {
    const config = '';

    const schema = 'app.builder';
    const tag = 'collection_test';
    expect(() => find(config, schema, tag)).to.throw('Config isn\'t object.');
  });

  it('creates a invalid action with invalid schema', () => {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
    };

    const schema = '';
    const tag = 'collection_test';
    expect(() => find(config, schema, tag)).to.throw('Schema is invalid.');
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
    expect(() => find(config, schema, tag)).to.throw('Tag isn\'t string.');
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
      source: middlewareJsonApiSource,
      schema,
      tag,
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

    const action = find(config, schema, tag);

    const store = mockStore({});
    store.dispatch(action)
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(6);

        const actionCollStatus = performedActions[0];
        expect(actionCollStatus.type).to.equal(REFERENCE_STATUS);
        expect(actionCollStatus.meta).to.deep.equal({ ...expectedMeta });
        const expectedCollStatusPayload = { busyStatus: busyStatus.BUSY };
        expect(actionCollStatus.payload).to.deep.equal(expectedCollStatusPayload);

        expect(performedActions[1].type).to.equal(LOAD_REQUEST);

        const actionObjFetched = performedActions[2];
        expect(actionObjFetched.type).to.equal(OBJECT_FETCHED);
        expect(actionObjFetched.meta).to.deep.equal({ ...expectedMeta, transformation: {} });
        expect(actionObjFetched.payload).to.deep.equal(expectedPayload.data[0]);

        const actionCollFetched = performedActions[4];
        expect(actionCollFetched.type).to.equal(REFERENCE_FETCHED);
        expect(actionCollFetched.meta).to.deep.equal({ ...expectedMeta });
        expect(actionCollFetched.payload).to.deep.equal(expectedPayload.data);

        const successAction = performedActions[5];
        expect(successAction.type).to.equal(LOAD_SUCCESS);
        expect(successAction.meta).to.deep.equal(expectedMeta);
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });
});
