import chai, { expect } from 'chai';
import chaiImmutable from 'chai-immutable';
import nock from 'nock';
import Immutable from 'immutable';
import { CALL_API, apiMiddleware } from 'redux-api-middleware';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  storage,
  collection,
  find,
  LOAD_REQUEST,
  LOAD_SUCCESS,
  LOAD_ERROR,
  OBJECT_FETCHED,
  COLLECTION_FETCHED,
  jsonApiMiddleware
} from '../src';

chai.use(chaiImmutable);

describe('Storage reducer', () => {
  it('should have a valid initial state', () => {
    const testReducer = storage('test');
    expect(testReducer(undefined, {})).to.equal(new Immutable.Map());
  });

  it('should be able to add item', () => {
    const initialState = new Immutable.Map();
    const item = { id: 1 };
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        type: 'test',
      },
      payload: item,
    };
    const reducer = storage('test', initialState);

    const nextState = reducer(initialState, action);
    const expectedState = new Immutable.Map()
      .set(item.id, Immutable.fromJS(item));

    expect(nextState).to.equal(expectedState);
  });

  it('should be able to ignore action with different schema type', () => {
    const initialState = new Immutable.Map();
    const item = { id: 1 };
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        type: 'test2',
      },
      payload: item,
    };

    const reducer = storage('test', initialState);
    const nextState = reducer(initialState, action);

    expect(nextState).to.equal(initialState);
  });

  it('should be able to ignore action with different action type', () => {
    const initialState = new Immutable.Map();
    const item = { id: 1 };
    const action = {
      type: 'OBJECT_FETCHED',
      meta: {
        type: 'test',
      },
      payload: item,
    };

    const reducer = storage('test', initialState);
    const nextState = reducer(initialState, action);

    expect(nextState).to.equal(initialState);
  });

  it('should be able to overwrite object with same id in storage', () => {
    const item = { id: 1, value: 'a' };
    const initialState = new Immutable.Map()
      .set(item.id, Immutable.fromJS(item));
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
    const expectedState = new Immutable.Map()
      .set(item.id, Immutable.fromJS(itemNew));
    expect(nextState).to.equal(expectedState);
  });

  it('should be able to keep object with different id in storage', () => {
    const item1 = { id: 1, value: 'a' };
    const initialState = new Immutable.Map()
      .set(item1.id, Immutable.fromJS(item1));
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
    const expectedState = new Immutable.Map()
      .set(item1.id, Immutable.fromJS(item1))
      .set(item2.id, Immutable.fromJS(item2));
    expect(nextState).to.equal(expectedState);
  });
});

describe('Collection reducer', () => {
  it('should have a valid initial state', () => {
    const testReducer = collection('test');
    expect(testReducer(undefined, {})).to.equal(new Immutable.List());
  });

  it('should be able to add collection of indices', () => {
    const initialState = new Immutable.List();
    const items = [
      { id: 1 },
      { id: 2 },
    ];
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
    const expectedState = new Immutable.List(items.map(i => i.id));

    expect(nextState).to.equal(expectedState);
  });

  it('should be able to ignore action with different schema type', () => {
    const initialState = new Immutable.List();
    const items = [
      { id: 1 },
      { id: 2 },
    ];
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

  it('should be able to ignore action with different action type', () => {
    const initialState = new Immutable.List();
    const items = [
      { id: 1 },
      { id: 2 },
    ];
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

  it('should be able to ignore action with different collection type', () => {
    const initialState = new Immutable.List();
    const items = [
      { id: 1 },
      { id: 2 },
    ];
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

  it('should be able to overwrite list of indicies on collection fetched action', () => {
    const initialState = new Immutable.List();
    const items = [
      { id: 1 },
      { id: 2 },
    ];
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

  it('should create a valid action', () => {
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
    expect(types[1].meta).to.eql(expectedMeta);
    expect(types[2]).to.equal(LOAD_ERROR);
  });

  it('should produce valid storage and collection actions', done => {
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
        expect(actionObjFetched.meta).to.eql({ type });
        expect(actionObjFetched.payload).to.eql(expectedPayload.data[0]);

        const actionCollFetched = performedActions[3];
        expect(actionCollFetched.type).to.equal(COLLECTION_FETCHED);
        expect(actionCollFetched.meta).to.eql({ type, collection: collectionName });
        expect(actionCollFetched.payload).to.eql(expectedPayload.data);

        const successAction = performedActions[4];
        expect(successAction.type).to.equal(LOAD_SUCCESS);
        const expectedMeta = {
          source: 'json_api',
          type,
          collection: collectionName,
        };
        expect(successAction.meta).to.eql(expectedMeta);
        expect(successAction.payload).to.eql(expectedPayload);
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

  it('should produce valid storage and collection actions', done => {
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
        expect(actionObjFetched.meta).to.eql({ type });
        expect(actionObjFetched.payload).to.eql(expectedPayload.data[0]);

        const actionCollFetched = performedActions[2];
        expect(actionCollFetched.type).to.equal(COLLECTION_FETCHED);
        expect(actionCollFetched.meta).to.eql({ type, collection: collectionName });
        expect(actionCollFetched.payload).to.eql(expectedPayload.data);

        const successAction = performedActions[3];
        expect(successAction.type).to.equal(LOAD_SUCCESS);

        expect(successAction.meta).to.eql(expectedMeta);
        expect(successAction.payload).to.eql(expectedPayload);
      }).then(done).catch(done);
  });

  it('should be able to ignore other actions', done => {
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

