import chai, { expect } from 'chai';
import chaiImmutable from 'chai-immutable';
import nock from 'nock';
import Immutable from 'immutable';
import deepFreeze from 'deep-freeze';
import { CALL_API, apiMiddleware } from 'redux-api-middleware';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  storage,
  storageImmutable,
  collection,
  collectionImmutable,
  find,
  create,
  LOAD_REQUEST,
  LOAD_SUCCESS,
  LOAD_ERROR,
  CREATE_REQUEST,
  CREATE_SUCCESS,
  CREATE_ERROR,
  OBJECT_CREATED,
  OBJECT_FETCHED,
  COLLECTION_FETCHED,
  COLLECTION_INVALIDATE,
  jsonApiMiddleware,
} from '../src';
import { middlewareJsonApiSource } from '../src/middleware';

chai.use(chaiImmutable);

describe('Plain Storage reducer', () => {
  it('have a valid initial state', () => {
    const testReducer = storage('test');
    expect(testReducer(undefined, {})).to.deep.equal({});
  });

  it('add item in state on Fetch', () => {
    const initialState = {};
    const item = { id: 1 };
    const schema = 'schema_test';
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        schema,
      },
      payload: item,
    };
    deepFreeze(initialState);
    const reducer = storage(schema, initialState);

    const nextState = reducer(initialState, action);
    const expectedState = { [item.id]: item };

    expect(nextState).to.deep.equal(expectedState);
  });

  it('add item in state on Create', () => {
    const initialState = {};
    const item = { id: 1 };
    const schema = 'schema_test';
    const action = {
      type: OBJECT_CREATED,
      meta: {
        schema,
      },
      payload: item,
    };
    deepFreeze(initialState);
    const reducer = storage(schema, initialState);

    const nextState = reducer(initialState, action);
    const expectedState = { [item.id]: item };

    expect(nextState).to.deep.equal(expectedState);
  });

  it('ignore action with different schema type', () => {
    const initialState = {};
    const item = { id: 1 };
    const schema = 'schema_test';
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        schema: 'test2',
      },
      payload: item,
    };
    deepFreeze(initialState);
    const reducer = storage(schema, initialState);
    const nextState = reducer(initialState, action);

    expect(nextState).to.deep.equal(initialState);
  });

  it('ignore action with different action type', () => {
    const initialState = {};
    const item = { id: 1 };
    const schema = 'schema_test';
    const action = {
      type: 'OBJECT_FETCHED',
      meta: {
        schema,
      },
      payload: item,
    };
    deepFreeze(initialState);
    const reducer = storage(schema, initialState);
    const nextState = reducer(initialState, action);

    expect(nextState).to.deep.equal(initialState);
  });

  it('replace object with same id in storage', () => {
    const item = { id: 1, value: 'a' };
    const initialState = { [item.id]: item };
    deepFreeze(initialState);
    const schema = 'schema_test';
    const reducer = storage(schema, initialState);

    const itemNew = { id: 1, value: 'b' };
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        schema,
      },
      payload: itemNew,
    };

    const nextState = reducer(initialState, action);
    const expectedState = { [itemNew.id]: itemNew };
    expect(nextState).to.deep.equal(expectedState);
  });

  it('keep object with different id in storage', () => {
    const item1 = { id: 1, value: 'a' };
    const initialState = { [item1.id]: item1 };
    deepFreeze(initialState);
    const schema = 'schema_test';
    const reducer = storage(schema, initialState);

    const item2 = { id: 2, value: 'b' };
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        schema,
      },
      payload: item2,
    };

    const nextState = reducer(initialState, action);
    const expectedState = { [item1.id]: item1, [item2.id]: item2 };
    expect(nextState).to.deep.equal(expectedState);
  });
});

describe('Immutable Storage reducer', () => {
  it('have a valid initial state', () => {
    const testReducer = storageImmutable('test');
    expect(testReducer(undefined, {})).to.equal(new Immutable.Map());
  });

  it('add item in state on Fetch', () => {
    const initialState = new Immutable.Map();
    const item = { id: 1 };
    const schema = 'schema_test';
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        schema,
      },
      payload: item,
    };
    const reducer = storageImmutable(schema, initialState);

    const nextState = reducer(initialState, action);
    const expectedState = new Immutable.Map()
      .set(item.id, Immutable.fromJS(item));

    expect(nextState).to.equal(expectedState);
  });

  it('add item in state on Create', () => {
    const initialState = new Immutable.Map();
    const item = { id: 1 };
    const schema = 'schema_test';
    const action = {
      type: OBJECT_CREATED,
      meta: {
        schema,
      },
      payload: item,
    };
    const reducer = storageImmutable(schema, initialState);

    const nextState = reducer(initialState, action);
    const expectedState = new Immutable.Map()
      .set(item.id, Immutable.fromJS(item));

    expect(nextState).to.equal(expectedState);
  });

  it('ignore action with different schema', () => {
    const initialState = new Immutable.Map();
    const item = { id: 1 };
    const schema = 'schema_test';
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        schema: 'test2',
      },
      payload: item,
    };

    const reducer = storageImmutable(schema, initialState);
    const nextState = reducer(initialState, action);

    expect(nextState).to.equal(initialState);
  });

  it('ignore action with different action type', () => {
    const initialState = new Immutable.Map();
    const item = { id: 1 };
    const schema = 'schema_test';
    const action = {
      type: 'OBJECT_FETCHED',
      meta: {
        schema,
      },
      payload: item,
    };

    const reducer = storageImmutable(schema, initialState);
    const nextState = reducer(initialState, action);

    expect(nextState).to.equal(initialState);
  });

  it('overwrite object with same id in storage', () => {
    const item = { id: 1, value: 'a' };
    const initialState = new Immutable.Map()
      .set(item.id, Immutable.fromJS(item));
    const schema = 'schema_test';
    const reducer = storageImmutable(schema, initialState);

    const itemNew = { id: 1, value: 'b' };
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        schema,
      },
      payload: itemNew,
    };

    const nextState = reducer(initialState, action);
    const expectedState = new Immutable.Map()
      .set(item.id, Immutable.fromJS(itemNew));
    expect(nextState).to.equal(expectedState);
  });

  it('keep object with different id in storage', () => {
    const item1 = { id: 1, value: 'a' };
    const initialState = new Immutable.Map()
      .set(item1.id, Immutable.fromJS(item1));
    const schema = 'schema_test';
    const reducer = storageImmutable(schema, initialState);

    const item2 = { id: 2, value: 'b' };
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        schema,
      },
      payload: item2,
    };

    const nextState = reducer(initialState, action);
    const expectedState = new Immutable.Map()
      .set(item1.id, Immutable.fromJS(item1))
      .set(item2.id, Immutable.fromJS(item2));
    expect(nextState).to.equal(expectedState);
  });
});

describe('Plain Collection reducer', () => {
  it('have a valid initial state', () => {
    const testReducer = collection('test', 'test');
    expect(testReducer(undefined, {})).to.eql([]);
  });

  it('add collection of indices on Fetch', () => {
    const initialState = [];
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    deepFreeze(initialState);
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, initialState);

    const action = {
      type: COLLECTION_FETCHED,
      meta: {
        schema,
        tag,
      },
      payload: items,
    };

    const nextState = reducer(initialState, action);
    const expectedState = items.map(item => item.id);

    expect(nextState).to.eql(expectedState);
  });

  it('ignore action with different schema', () => {
    const initialState = [];
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    deepFreeze(initialState);
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, initialState);

    const action = {
      type: COLLECTION_FETCHED,
      meta: {
        schema: 'test2',
        tag,
      },
      payload: items,
    };

    const nextState = reducer(initialState, action);
    expect(nextState).to.equal(initialState);
  });

  it('ignore action with different action type', () => {
    const initialState = [];
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    deepFreeze(initialState);
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, initialState);

    const action = {
      type: 'COLLECTION_FETCHED',
      meta: {
        schema,
        tag,
      },
      payload: items,
    };

    const nextState = reducer(initialState, action);
    expect(nextState).to.equal(initialState);
  });

  it('ignore action with different collection type', () => {
    const initialState = [];
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    deepFreeze(initialState);
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, initialState);

    const action = {
      type: COLLECTION_FETCHED,
      meta: {
        schema,
        tag: 'collection2',
      },
      payload: items,
    };

    const nextState = reducer(initialState, action);
    expect(nextState).to.equal(initialState);
  });

  it('re-populate list of indicies on fetch', () => {
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const initialState = items;
    deepFreeze(initialState);
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, initialState);

    const itemsNew = [
      { id: 3 },
      { id: 4 },
    ];
    const action = {
      type: COLLECTION_FETCHED,
      meta: {
        schema,
        tag,
      },
      payload: itemsNew,
    };

    const nextState = reducer(initialState, action);
    const expectedState = itemsNew.map(item => item.id);
    expect(nextState).to.eql(expectedState);
  });

  it('clear list of ids on create', () => {
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const initialState = items;
    deepFreeze(initialState);
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collection(schema, tag, initialState);

    const action = {
      type: COLLECTION_INVALIDATE,
      meta: {
        schema,
        tag: '',
      },
    };

    const nextState = reducer(initialState, action);
    const expectedState = [];
    expect(nextState).to.eql(expectedState);
  });
});

describe('Immutable Collection reducer', () => {
  it('have a valid initial state', () => {
    const testReducer = collectionImmutable('test', 'test');
    expect(testReducer(undefined, {})).to.equal(new Immutable.List());
  });

  it('add collection of indices', () => {
    const initialState = new Immutable.List();
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collectionImmutable(schema, tag, initialState);

    const action = {
      type: COLLECTION_FETCHED,
      meta: {
        schema,
        tag,
      },
      payload: items,
    };

    const nextState = reducer(initialState, action);
    const expectedState = new Immutable.List(items.map(i => i.id));

    expect(nextState).to.equal(expectedState);
  });

  it('ignore action with different schema', () => {
    const initialState = new Immutable.List();
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collectionImmutable(schema, tag, initialState);

    const action = {
      type: COLLECTION_FETCHED,
      meta: {
        schema: 'test2',
        tag,
      },
      payload: items,
    };

    const nextState = reducer(initialState, action);
    expect(nextState).to.equal(initialState);
  });

  it('ignore action with different action type', () => {
    const initialState = new Immutable.List();
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collectionImmutable(schema, tag, initialState);

    const action = {
      type: 'COLLECTION_FETCHED',
      meta: {
        schema,
        tag,
      },
      payload: items,
    };

    const nextState = reducer(initialState, action);
    expect(nextState).to.equal(initialState);
  });

  it('ignore action with different collection type', () => {
    const initialState = new Immutable.List();
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collectionImmutable(schema, tag, initialState);

    const action = {
      type: COLLECTION_FETCHED,
      meta: {
        schema,
        tag: 'tag2',
      },
      payload: items,
    };

    const nextState = reducer(initialState, action);
    expect(nextState).to.equal(initialState);
  });

  it('re-populate list of indicies on fetch', () => {
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const initialState = Immutable.fromJS(items);
    const schema = 'schema_test';
    const tag = 'tag_test';
    const reducer = collectionImmutable(schema, tag, initialState);

    const itemsNew = [
      { id: 3 },
      { id: 4 },
    ];
    const action = {
      type: COLLECTION_FETCHED,
      meta: {
        schema,
        tag,
      },
      payload: itemsNew,
    };

    const nextState = reducer(initialState, action);
    const expectedState = new Immutable.List(itemsNew.map(i => i.id));

    expect(nextState).to.equal(expectedState);
  });

  it('clear list of ids on create', () => {
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const initialState = items;
    const schema = 'schema_test';
    const reducer = collectionImmutable(schema, 'collection', Immutable.fromJS(initialState));

    const action = {
      type: COLLECTION_INVALIDATE,
      meta: {
        schema,
        tag: '',
      },
    };

    const nextState = reducer(initialState, action);
    const expectedState = new Immutable.List();
    expect(nextState).to.eql(expectedState);
  });
});

describe('Find action creator', () => {
  const middlewares = [thunk, apiMiddleware, jsonApiMiddleware];
  let mockStore = configureMockStore(middlewares);

  afterEach(() => {
    nock.cleanAll();
    mockStore = configureMockStore(middlewares);
  })

  it('create a valid action', () => {
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

  it('produce valid storage and collection actions', done => {
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

describe('Create action creator', () => {
  const middlewares = [thunk, apiMiddleware, jsonApiMiddleware];
  let mockStore = configureMockStore(middlewares);

  beforeEach(() => {
    nock.cleanAll();
    mockStore = configureMockStore(middlewares);
  })

  it('create a valid action', () => {
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

  it('produce valid storage and collection actions', done => {
    const schema = 'schema_test';
    const expectedPayload = {
      data: {
        schema,
        id: '1',
        attributes: {
          name: 'Test1',
        },
      },
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

        const actionObjFetched = performedActions[1];
        expect(actionObjFetched.type).to.equal(OBJECT_CREATED);
        expect(actionObjFetched.meta).to.deep.equal({ schema });
        expect(actionObjFetched.payload).to.deep.equal(expectedPayload.data);

        const actionCollFetched = performedActions[2];
        expect(actionCollFetched.type).to.equal(COLLECTION_INVALIDATE);
        expect(actionCollFetched.meta).to.deep.equal({ schema, tag: '' });
        expect(actionCollFetched.payload).to.deep.equal([expectedPayload.data]);

        const successAction = performedActions[3];
        expect(successAction.type).to.equal(CREATE_SUCCESS);
        const expectedMeta = {
          source: middlewareJsonApiSource,
          schema,
        };
        expect(successAction.meta).to.deep.equal(expectedMeta);
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });
})

describe('Json api middleware', () => {
  let mockStore = configureMockStore([thunk, jsonApiMiddleware]);
  const actionPromise = (action) => dispatch => {
    return new Promise((resolve) => {
      resolve();
    }).then(dispatch(action));
  };

  afterEach(() => {
    mockStore = configureMockStore([thunk, jsonApiMiddleware]);
  });

  it('produce valid actions for fetch', done => {
    const schema = 'schema_test';
    const tag = 'tag_test';
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

    const mockSuccessAction = {
      type: LOAD_SUCCESS,
      meta: expectedMeta,
      payload: expectedPayload,
    };

    const store = mockStore({});
    store.dispatch(actionPromise(mockSuccessAction))
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(4);

        const actionObjFetched = performedActions[0];
        expect(actionObjFetched.type).to.equal(OBJECT_FETCHED);
        expect(actionObjFetched.meta).to.deep.equal({ schema });
        expect(actionObjFetched.payload).to.deep.equal(expectedPayload.data[0]);

        const actionCollFetched = performedActions[2];
        expect(actionCollFetched.type).to.equal(COLLECTION_FETCHED);
        expect(actionCollFetched.meta).to.deep.equal({ schema, tag });
        expect(actionCollFetched.payload).to.deep.equal(expectedPayload.data);

        const successAction = performedActions[3];
        expect(successAction.type).to.equal(LOAD_SUCCESS);

        expect(successAction.meta).to.deep.equal(expectedMeta);
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });

  it('produce valid actions for create', done => {
    const schema = 'schema_test';
    const tag = 'tag_test';
    const expectedPayload = {
      data: [{
        type: schema,
        id: '1',
        attributes: {
          name: 'Test1',
        },
      }],
    };
    const expectedMeta = {
      source: middlewareJsonApiSource,
      schema,
      tag,
    };

    const mockSuccessAction = {
      type: CREATE_SUCCESS,
      meta: expectedMeta,
      payload: expectedPayload,
    };

    const store = mockStore({});
    store.dispatch(actionPromise(mockSuccessAction))
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(3);

        const actionObjCreated = performedActions[0];
        expect(actionObjCreated.type).to.equal(OBJECT_CREATED);
        expect(actionObjCreated.meta).to.deep.equal({ schema });
        expect(actionObjCreated.payload).to.deep.equal(expectedPayload.data[0]);

        const actionCollInvalidate = performedActions[1];
        expect(actionCollInvalidate.type).to.equal(COLLECTION_INVALIDATE);
        expect(actionCollInvalidate.meta).to.deep.equal({ schema, tag: '' });
        expect(actionCollInvalidate.payload).to.deep.equal(expectedPayload.data);

        const successAction = performedActions[2];
        expect(successAction.type).to.equal(CREATE_SUCCESS);

        expect(successAction.meta).to.deep.equal(expectedMeta);
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });

  it('able to ignore other actions', done => {
    const schema = 'schema_test';
    const tag = 'tag_test';
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

    const mockSuccessAction = {
      type: 'LOAD_SUCCESS',
      meta: expectedMeta,
      payload: expectedPayload,
    };

    const store = mockStore({});
    store.dispatch(actionPromise(mockSuccessAction))
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(1);

        const actionObjFetched = performedActions[0];
        expect(actionObjFetched.type).to.equal('LOAD_SUCCESS');
      }).then(done).catch(done);
  });
});

