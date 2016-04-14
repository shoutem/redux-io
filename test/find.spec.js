import { expect } from 'chai';
import nock from 'nock';
import { CALL_API, apiMiddleware } from 'redux-api-middleware';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  find,
  LOAD_REQUEST,
  LOAD_SUCCESS,
  LOAD_ERROR,
  OBJECT_FETCHED,
  COLLECTION_FETCHED,
  apiStateMiddleware,
} from '../src';
import { middlewareJsonApiSource } from '../src/middleware';

describe('Find action creator', () => {
  const middlewares = [thunk, apiMiddleware, apiStateMiddleware];
  let mockStore = configureMockStore(middlewares);

  afterEach(() => {
    nock.cleanAll();
    mockStore = configureMockStore(middlewares);
  })

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

    expect(action[CALL_API]).to.not.be.undefined;
    expect(action[CALL_API].method).to.equal('GET');
    expect(action[CALL_API].endpoint).to.equal(config.endpoint);
    expect(action[CALL_API].headers).to.equal(config.headers);
    expect(action[CALL_API].types).to.not.be.undefined;

    const types = action[CALL_API].types;
    expect(types[0]).to.equal(LOAD_REQUEST);
    expect(types[1].type).to.equal(LOAD_SUCCESS);
    const expectedMeta = {
      source: middlewareJsonApiSource,
      schema,
      tag,
    };
    expect(types[1].meta).to.deep.equal(expectedMeta);
    expect(types[2]).to.equal(LOAD_ERROR);
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
    const expectedPayload = {
      data: [{
        schema,
        id: '1',
        attributes: {
          name: 'Test1',
        },
      }, {
        schema,
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

    const tag = 'collection_test';
    const action = find(config, schema, tag);

    const store = mockStore({});
    store.dispatch(action)
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(5);
        expect(performedActions[0].type).to.equal(LOAD_REQUEST);

        const actionObjFetched = performedActions[1];
        expect(actionObjFetched.type).to.equal(OBJECT_FETCHED);
        expect(actionObjFetched.meta).to.deep.equal({ schema });
        expect(actionObjFetched.payload).to.deep.equal(expectedPayload.data[0]);

        const actionCollFetched = performedActions[3];
        expect(actionCollFetched.type).to.equal(COLLECTION_FETCHED);
        expect(actionCollFetched.meta).to.deep.equal({ schema, tag });
        expect(actionCollFetched.payload).to.deep.equal(expectedPayload.data);

        const successAction = performedActions[4];
        expect(successAction.type).to.equal(LOAD_SUCCESS);
        const expectedMeta = {
          source: middlewareJsonApiSource,
          schema,
          tag,
        };
        expect(successAction.meta).to.deep.equal(expectedMeta);
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });
});
