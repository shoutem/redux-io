import { expect } from 'chai';
import nock from 'nock';
import { CALL_API, apiMiddleware } from 'redux-api-middleware';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  remove,
  REMOVE_REQUEST,
  REMOVE_SUCCESS,
  REMOVE_ERROR,
  OBJECT_REMOVED,
  COLLECTION_INVALIDATE,
  apiStateMiddleware,
} from '../src';
import { middlewareJsonApiSource } from '../src/middleware';

describe('Delete action creator', () => {
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
    const item = { id: 1 };
    const action = remove(config, schema, item);

    expect(action[CALL_API]).to.not.be.undefined;
    expect(action[CALL_API].method).to.equal('DELETE');
    expect(action[CALL_API].endpoint).to.equal(config.endpoint);
    expect(action[CALL_API].headers).to.equal(config.headers);
    expect(action[CALL_API].types).to.not.be.undefined;

    const types = action[CALL_API].types;
    expect(types[0]).to.equal(REMOVE_REQUEST);
    expect(types[1].type).to.equal(REMOVE_SUCCESS);
    const expectedMeta = {
      source: middlewareJsonApiSource,
      schema,
      item,
    };
    expect(types[1].meta).to.deep.equal(expectedMeta);
    expect(types[2]).to.equal(REMOVE_ERROR);
  });

  it('creates an invalid action with null config', () => {
    const config = null;
    const schema = 'app.builder';
    const item = {};
    expect(() => remove(config, schema, item)).to.throw('Config isn\'t object.');
  });

  it('creates an invalid action with string config', () => {
    const config = '';
    const schema = 'app.builder';
    const item = {};
    expect(() => remove(config, schema, item)).to.throw('Config isn\'t object.');
  });

  it('creates an invalid action with invalid schema', () => {
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

  it('produces valid storage and collection actions', done => {
    const schema = 'schema_test';
    const item = { id: 1, type: schema };
    const expectedMeta = {
      source: middlewareJsonApiSource,
      schema,
      item,
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
        expect(performedActions[0].type).to.equal(REMOVE_REQUEST);

        const actionObjFetched = performedActions[1];
        expect(actionObjFetched.type).to.equal(OBJECT_REMOVED);
        expect(actionObjFetched.meta).to.deep.equal(expectedMeta);

        const actionCollFetched = performedActions[2];
        expect(actionCollFetched.type).to.equal(COLLECTION_INVALIDATE);
        expect(actionCollFetched.meta).to.deep.equal({...expectedMeta, tag: ''});

        const successAction = performedActions[3];
        expect(successAction.type).to.equal(REMOVE_SUCCESS);
        expect(successAction.meta).to.deep.equal(expectedMeta);
      }).then(done).catch(done);
  });
});
