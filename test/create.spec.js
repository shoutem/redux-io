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
  COLLECTION_INVALIDATE,
  apiStateMiddleware,
} from '../src';
import { middlewareJsonApiSource } from '../src/middleware';

describe('Create action creator', () => {
  const middlewares = [thunk, apiMiddleware,apiStateMiddleware];
  let mockStore = configureMockStore(middlewares);

  beforeEach(() => {
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

    const types = action[CALL_API].types;
    expect(types[0]).to.equal(CREATE_REQUEST);
    expect(types[1].type).to.equal(CREATE_SUCCESS);
    const expectedMeta = {
      source: middlewareJsonApiSource,
      schema,
    };
    expect(types[1].meta).to.deep.equal(expectedMeta);
    expect(types[2]).to.equal(CREATE_ERROR);
  });

  it('creates a invalid action with undefined config', () => {
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

  it('creates a invalid action with invalid schema', () => {
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

  it('creates a invalid action with invalid item', () => {
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
        expect(performedActions).to.have.length(4);
        expect(performedActions[0].type).to.equal(CREATE_REQUEST);

        const actionObjCreated = performedActions[1];
        expect(actionObjCreated.type).to.equal(OBJECT_CREATED);
        expect(actionObjCreated.meta).to.deep.equal(expectedMeta);
        expect(actionObjCreated.payload).to.deep.equal(expectedPayload.data);

        const actionCollInvalidate = performedActions[2];
        expect(actionCollInvalidate.type).to.equal(COLLECTION_INVALIDATE);
        expect(actionCollInvalidate.meta).to.deep.equal({ ...expectedMeta, tag: '' });
        expect(actionCollInvalidate.payload).to.deep.equal([expectedPayload.data]);
        const successAction = performedActions[3];
        expect(successAction.type).to.equal(CREATE_SUCCESS);
        expect(successAction.meta).to.deep.equal(expectedMeta);
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });
});

