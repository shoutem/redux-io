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
  LOAD_REQUEST,
  LOAD_SUCCESS,
  LOAD_ERROR,
  OBJECT_FETCHED,
  COLLECTION_FETCHED,
  jsonApiMiddleware
} from '../src';

chai.use(chaiImmutable);

describe('Plain Storage reducer', () => {
  it('have a valid initial state', () => {
    const testReducer = storage('test');
    expect(testReducer(undefined, {})).to.deep.equal({});
  });

  it('able to add item', () => {
    const initialState = {};
    const item = { id: 1 };
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        type: 'test',
      },
      payload: item,
    };
    deepFreeze(initialState);
    const reducer = storage('test', initialState);

    const nextState = reducer(initialState, action);
    const expectedState = { [item.id]: item };

    expect(nextState).to.deep.equal(expectedState);
  });

  it('able to ignore action with different schema type', () => {
    const initialState = {};
    const item = { id: 1 };
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        type: 'test2',
      },
      payload: item,
    };
    deepFreeze(initialState);
    const reducer = storage('test', initialState);
    const nextState = reducer(initialState, action);

    expect(nextState).to.deep.equal(initialState);
  });

  it('able to ignore action with different action type', () => {
    const initialState = {};
    const item = { id: 1 };
    const action = {
      type: 'OBJECT_FETCHED',
      meta: {
        type: 'test',
      },
      payload: item,
    };
    deepFreeze(initialState);
    const reducer = storage('test', initialState);
    const nextState = reducer(initialState, action);

    expect(nextState).to.deep.equal(initialState);
  });

  it('able to replace object with same id in storage', () => {
    const item = { id: 1, value: 'a' };
    const initialState = { [item.id]: item };
    deepFreeze(initialState);
    const reducer = storage('test', initialState);

    const itemNew = { id: 1, value: 'b' };
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        type: 'test',
      },
      payload: itemNew,
    };

    const nextState = reducer(initialState, action);
    const expectedState = { [itemNew.id]: itemNew };
    expect(nextState).to.deep.equal(expectedState);
  });

  it('able to keep object with different id in storage', () => {
    const item1 = { id: 1, value: 'a' };
    const initialState = { [item1.id]: item1 };
    deepFreeze(initialState);
    const reducer = storage('test', initialState);

    const item2 = { id: 2, value: 'b' };
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        type: 'test',
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

  it('able to add item', () => {
    const initialState = new Immutable.Map();
    const item = { id: 1 };
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        type: 'test',
      },
      payload: item,
    };
    const reducer = storageImmutable('test', initialState);

    const nextState = reducer(initialState, action);
    const expectedState = new Immutable.Map()
      .set(item.id, Immutable.fromJS(item));

    expect(nextState).to.equal(expectedState);
  });

  it('able to ignore action with different schema type', () => {
    const initialState = new Immutable.Map();
    const item = { id: 1 };
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        type: 'test2',
      },
      payload: item,
    };

    const reducer = storageImmutable('test', initialState);
    const nextState = reducer(initialState, action);

    expect(nextState).to.equal(initialState);
  });

  it('able to ignore action with different action type', () => {
    const initialState = new Immutable.Map();
    const item = { id: 1 };
    const action = {
      type: 'OBJECT_FETCHED',
      meta: {
        type: 'test',
      },
      payload: item,
    };

    const reducer = storageImmutable('test', initialState);
    const nextState = reducer(initialState, action);

    expect(nextState).to.equal(initialState);
  });

  it('able to overwrite object with same id in storage', () => {
    const item = { id: 1, value: 'a' };
    const initialState = new Immutable.Map()
      .set(item.id, Immutable.fromJS(item));
    const reducer = storageImmutable('test', initialState);

    const itemNew = { id: 1, value: 'b' };
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        type: 'test',
      },
      payload: itemNew,
    };

    const nextState = reducer(initialState, action);
    const expectedState = new Immutable.Map()
      .set(item.id, Immutable.fromJS(itemNew));
    expect(nextState).to.equal(expectedState);
  });

  it('able to keep object with different id in storage', () => {
    const item1 = { id: 1, value: 'a' };
    const initialState = new Immutable.Map()
      .set(item1.id, Immutable.fromJS(item1));
    const reducer = storageImmutable('test', initialState);

    const item2 = { id: 2, value: 'b' };
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        type: 'test',
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

  it('able to add collection of indices', () => {
    const initialState = [];
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    deepFreeze(initialState);
    const reducer = collection('test', 'collection', initialState);

    const action = {
      type: COLLECTION_FETCHED,
      meta: {
        type: 'test',
        collection: 'collection',
      },
      payload: items,
    };

    const nextState = reducer(initialState, action);
    const expectedState = items.map(item => item.id);

    expect(nextState).to.eql(expectedState);
  });

  it('able to ignore action with different schema type', () => {
    const initialState = [];
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    deepFreeze(initialState);
    const reducer = collection('test', 'collection', initialState);

    const action = {
      type: COLLECTION_FETCHED,
      meta: {
        type: 'test2',
        collection: 'collection',
      },
      payload: items,
    };

    const nextState = reducer(initialState, action);
    expect(nextState).to.equal(initialState);
  });

  it('able to ignore action with different action type', () => {
    const initialState = [];
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    deepFreeze(initialState);
    const reducer = collection('test', 'collection', initialState);

    const action = {
      type: 'COLLECTION_FETCHED',
      meta: {
        type: 'test',
        collection: 'collection',
      },
      payload: items,
    };

    const nextState = reducer(initialState, action);
    expect(nextState).to.equal(initialState);
  });

  it('able to ignore action with different collection type', () => {
    const initialState = [];
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    deepFreeze(initialState);
    const reducer = collection('test', 'collection', initialState);

    const action = {
      type: COLLECTION_FETCHED,
      meta: {
        type: 'test',
        collection: 'collection2',
      },
      payload: items,
    };

    const nextState = reducer(initialState, action);
    expect(nextState).to.equal(initialState);
  });

  it('able to overwrite list of indicies on collection fetched action', () => {
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const initialState = items;
    deepFreeze(initialState);
    const reducer = collection('test', 'collection', initialState);

    const itemsNew = [
      { id: 3 },
      { id: 4 },
    ];
    const action = {
      type: COLLECTION_FETCHED,
      meta: {
        type: 'test',
        collection: 'collection',
      },
      payload: itemsNew,
    };

    const nextState = reducer(initialState, action);
    const expectedState = itemsNew.map(item => item.id);
    expect(nextState).to.eql(expectedState);
  });
});

describe('Immutable Collection reducer', () => {
  it('have a valid initial state', () => {
    const testReducer = collectionImmutable('test', 'test');
    expect(testReducer(undefined, {})).to.equal(new Immutable.List());
  });

  it('able to add collection of indices', () => {
    const initialState = new Immutable.List();
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const reducer = collectionImmutable('test', 'collection', initialState);

    const action = {
      type: COLLECTION_FETCHED,
      meta: {
        type: 'test',
        collection: 'collection',
      },
      payload: items,
    };

    const nextState = reducer(initialState, action);
    const expectedState = new Immutable.List(items.map(i => i.id));

    expect(nextState).to.equal(expectedState);
  });

  it('able to ignore action with different schema type', () => {
    const initialState = new Immutable.List();
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const reducer = collectionImmutable('test', 'collection', initialState);

    const action = {
      type: COLLECTION_FETCHED,
      meta: {
        type: 'test2',
        collection: 'collection',
      },
      payload: items,
    };

    const nextState = reducer(initialState, action);
    expect(nextState).to.equal(initialState);
  });

  it('able to ignore action with different action type', () => {
    const initialState = new Immutable.List();
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const reducer = collectionImmutable('test', 'collection', initialState);

    const action = {
      type: 'COLLECTION_FETCHED',
      meta: {
        type: 'test',
        collection: 'collection',
      },
      payload: items,
    };

    const nextState = reducer(initialState, action);
    expect(nextState).to.equal(initialState);
  });

  it('able to ignore action with different collection type', () => {
    const initialState = new Immutable.List();
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const reducer = collectionImmutable('test', 'collection', initialState);

    const action = {
      type: COLLECTION_FETCHED,
      meta: {
        type: 'test',
        collection: 'collection2',
      },
      payload: items,
    };

    const nextState = reducer(initialState, action);
    expect(nextState).to.equal(initialState);
  });

  it('able to overwrite list of indicies on collection fetched action', () => {
    const items = [
      { id: 1 },
      { id: 2 },
    ];
    const initialState = Immutable.fromJS(items);
    const reducer = collectionImmutable('test', 'collection', initialState);

    const itemsNew = [
      { id: 3 },
      { id: 4 },
    ];
    const action = {
      type: COLLECTION_FETCHED,
      meta: {
        type: 'test',
        collection: 'collection',
      },
      payload: itemsNew,
    };

    const nextState = reducer(initialState, action);
    const expectedState = new Immutable.List(itemsNew.map(i => i.id));

    expect(nextState).to.equal(expectedState);
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
    const headers = {
      'Content-Type': 'application/vnd.api+json',
    };
    const endpoint = 'api.test';
    const type = 'type_test';
    const collectionName = 'collection_test';
    const action = find(endpoint, headers, type, collectionName);

    expect(action[CALL_API]).to.not.be.undefined;
    expect(action[CALL_API].method).to.equal('GET');
    expect(action[CALL_API].endpoint).to.equal(endpoint);
    expect(action[CALL_API].headers).to.equal(headers);
    expect(action[CALL_API].types).to.not.be.undefined;

    const types = action[CALL_API].types;
    expect(types[0]).to.equal(LOAD_REQUEST);
    expect(types[1].type).to.equal(LOAD_SUCCESS);
    const expectedMeta = {
      source: 'json_api',
      type,
      collection: collectionName,
    };
    expect(types[1].meta).to.deep.equal(expectedMeta);
    expect(types[2]).to.equal(LOAD_ERROR);
  });

  it('produce valid storage and collection actions', done => {
    const expectedPayload =  {
      data: [{
        type: 'type_test',
        id: '1',
        attributes: {
          name: 'Test1',
        },
      }, {
        type: 'type_test',
        id: '2',
        attributes: {
          name: 'Test2',
        },
      }],
    };

    nock('http://api.server.local')
      .get('/apps')
      .reply(200, expectedPayload, { 'Content-Type': 'vnd.api+json' });

    const headers = {
      'Content-Type': 'application/vnd.api+json',
    };
    const endpoint = 'http://api.server.local/apps';
    const type = 'type_test';
    const collectionName = 'collection_test';
    const action = find(endpoint, headers, type, collectionName);

    const store = mockStore({});
    store.dispatch(action)
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(5);
        expect(performedActions[0].type).to.equal(LOAD_REQUEST);

        const actionObjFetched = performedActions[1];
        expect(actionObjFetched.type).to.equal(OBJECT_FETCHED);
        expect(actionObjFetched.meta).to.deep.equal({ type });
        expect(actionObjFetched.payload).to.deep.equal(expectedPayload.data[0]);

        const actionCollFetched = performedActions[3];
        expect(actionCollFetched.type).to.equal(COLLECTION_FETCHED);
        expect(actionCollFetched.meta).to.deep.equal({ type, collection: collectionName });
        expect(actionCollFetched.payload).to.deep.equal(expectedPayload.data);

        const successAction = performedActions[4];
        expect(successAction.type).to.equal(LOAD_SUCCESS);
        const expectedMeta = {
          source: 'json_api',
          type,
          collection: collectionName,
        };
        expect(successAction.meta).to.deep.equal(expectedMeta);
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });
});

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

  it('produce valid storage and collection actions', done => {
    const type = 'type_test';
    const collectionName = 'collection_test';
    const expectedPayload =  {
      data: [{
        type: 'type_test',
        id: '1',
        attributes: {
          name: 'Test1',
        },
      }, {
        type: 'type_test',
        id: '2',
        attributes: {
          name: 'Test2',
        },
      }],
    };
    const expectedMeta = {
      source: 'json_api',
      type,
      collection: collectionName,
    };

    const successAction = {
      type: LOAD_SUCCESS,
      meta: expectedMeta,
      payload: expectedPayload,
    };

    const store = mockStore({});
    store.dispatch(actionPromise(successAction))
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(4);

        const actionObjFetched = performedActions[0];
        expect(actionObjFetched.type).to.equal(OBJECT_FETCHED);
        expect(actionObjFetched.meta).to.deep.equal({ type });
        expect(actionObjFetched.payload).to.deep.equal(expectedPayload.data[0]);

        const actionCollFetched = performedActions[2];
        expect(actionCollFetched.type).to.equal(COLLECTION_FETCHED);
        expect(actionCollFetched.meta).to.deep.equal({ type, collection: collectionName });
        expect(actionCollFetched.payload).to.deep.equal(expectedPayload.data);

        const successAction = performedActions[3];
        expect(successAction.type).to.equal(LOAD_SUCCESS);

        expect(successAction.meta).to.deep.equal(expectedMeta);
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });

  it('able to ignore other actions', done => {
    const type = 'type_test';
    const collectionName = 'collection_test';
    const expectedPayload =  {
      data: [{
        type: 'type_test',
        id: '1',
        attributes: {
          name: 'Test1',
        },
      }, {
        type: 'type_test',
        id: '2',
        attributes: {
          name: 'Test2',
        },
      }],
    };
    const expectedMeta = {
      source: 'json_api',
      type,
      collection: collectionName,
    };

    const successAction = {
      type: 'LOAD_SUCCESS',
      meta: expectedMeta,
      payload: expectedPayload,
    };

    const store = mockStore({});
    store.dispatch(actionPromise(successAction))
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(1);

        const actionObjFetched = performedActions[0];
        expect(actionObjFetched.type).to.equal('LOAD_SUCCESS');
      }).then(done).catch(done);
  });
});

