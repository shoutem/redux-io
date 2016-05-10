import { expect } from 'chai';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  LOAD_REQUEST,
  LOAD_SUCCESS,
  CREATE_SUCCESS,
  UPDATE_REQUEST,
  UPDATE_SUCCESS,
  REMOVE_REQUEST,
  REMOVE_SUCCESS,
  OBJECT_CREATED,
  OBJECT_FETCHED,
  OBJECT_UPDATING,
  OBJECT_UPDATED,
  OBJECT_REMOVING,
  OBJECT_REMOVED,
  COLLECTION_FETCHED,
  COLLECTION_STATUS,
  apiStateMiddleware,
} from '../src';
import {
  middlewareJsonApiSource,
} from '../src/middleware';
import {
  validationStatus,
  busyStatus,
} from '../src/status';

describe('Json api middleware', () => {
  let mockStore = configureMockStore([thunk, apiStateMiddleware]);
  const actionPromise = action => dispatch => (
    new Promise((resolve) => {
      resolve();
    }).then(dispatch(action))
  );

  afterEach(() => {
    mockStore = configureMockStore([thunk, apiStateMiddleware]);
  });

  it('produces valid actions for fetch request', done => {
    const schema = 'schema_test';
    const tag = 'tag_test';
    const expectedMeta = {
      source: middlewareJsonApiSource,
      schema,
      tag,
      broadcast: false,
    };

    const mockSuccessAction = {
      type: LOAD_REQUEST,
      meta: expectedMeta,
    };

    const store = mockStore({});
    store.dispatch(actionPromise(mockSuccessAction))
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(2);

        const actionCollStatus = performedActions[0];
        expect(actionCollStatus.type).to.equal(COLLECTION_STATUS);
        expect(actionCollStatus.meta).to.deep.equal({ ...expectedMeta, broadcast: false });
        const expectedCollStatusPayload = { busyStatus: busyStatus.BUSY };
        expect(actionCollStatus.payload).to.deep.equal(expectedCollStatusPayload);

        const requestAction = performedActions[1];
        expect(requestAction.type).to.equal(LOAD_REQUEST);
        expect(requestAction.meta).to.deep.equal(expectedMeta);
      }).then(done).catch(done);
  });

  it('produces valid actions for fetch success', done => {
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
      broadcast: false,
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
        expect(actionObjFetched.meta).to.deep.equal(expectedMeta);
        expect(actionObjFetched.payload).to.deep.equal(expectedPayload.data[0]);

        const actionCollFetched = performedActions[2];
        expect(actionCollFetched.type).to.equal(COLLECTION_FETCHED);
        expect(actionCollFetched.meta).to.deep.equal(expectedMeta);
        expect(actionCollFetched.payload).to.deep.equal(expectedPayload.data);

        const successAction = performedActions[3];
        expect(successAction.type).to.equal(LOAD_SUCCESS);

        expect(successAction.meta).to.deep.equal(expectedMeta);
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });

  it('produces valid actions for create success', done => {
    const schema = 'schema_test';
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
      tag: '',
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
        expect(actionObjCreated.meta).to.deep.equal(expectedMeta);
        expect(actionObjCreated.payload).to.deep.equal(expectedPayload.data[0]);

        const actionCollStatus = performedActions[1];
        expect(actionCollStatus.type).to.equal(COLLECTION_STATUS);
        expect(actionCollStatus.meta).to.deep.equal({ ...expectedMeta, broadcast: true });
        const expectedCollStatusPayload = {
          validationStatus: validationStatus.INVALID,
          busyStatus: busyStatus.IDLE,
        };
        expect(actionCollStatus.payload).to.deep.equal(expectedCollStatusPayload);

        const successAction = performedActions[2];
        expect(successAction.type).to.equal(CREATE_SUCCESS);

        expect(successAction.meta).to.deep.equal(expectedMeta);
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });

  it('produces valid actions for update request', done => {
    const schema = 'schema_test';
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
      tag: '',
    };

    const mockSuccessAction = {
      type: UPDATE_REQUEST,
      meta: expectedMeta,
      payload: expectedPayload,
    };

    const store = mockStore({});
    store.dispatch(actionPromise(mockSuccessAction))
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(3);

        const actionCollStatusBusy = performedActions[0];
        expect(actionCollStatusBusy.type).to.equal(COLLECTION_STATUS);
        expect(actionCollStatusBusy.meta)
          .to.deep.equal({ ...expectedMeta, tag: '', broadcast: true });
        const expectedCollStatusBusyPayload = {
          busyStatus: busyStatus.BUSY,
          validationStatus: validationStatus.INVALID,
        };
        expect(actionCollStatusBusy.payload).to.deep.equal(expectedCollStatusBusyPayload);

        const actionObjUpdating = performedActions[1];
        expect(actionObjUpdating.type).to.equal(OBJECT_UPDATING);
        expect(actionObjUpdating.meta).to.deep.equal(expectedMeta);
        expect(actionObjUpdating.payload).to.deep.equal(expectedPayload.data[0]);

        const actionUpdateRequest = performedActions[2];
        expect(actionUpdateRequest.type).to.equal(UPDATE_REQUEST);
        expect(actionUpdateRequest.meta).to.deep.equal(expectedMeta);
        expect(actionUpdateRequest.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });

  it('produces valid actions for update success', done => {
    const schema = 'schema_test';
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
      tag: '',
    };

    const mockSuccessAction = {
      type: UPDATE_SUCCESS,
      meta: expectedMeta,
      payload: expectedPayload,
    };

    const store = mockStore({});
    store.dispatch(actionPromise(mockSuccessAction))
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(3);

        const actionObjUpdated = performedActions[0];
        expect(actionObjUpdated.type).to.equal(OBJECT_UPDATED);
        expect(actionObjUpdated.meta).to.deep.equal(expectedMeta);
        expect(actionObjUpdated.payload).to.deep.equal(expectedPayload.data[0]);

        const actionCollStatus = performedActions[1];
        expect(actionCollStatus.type).to.equal(COLLECTION_STATUS);
        expect(actionCollStatus.meta).to.deep.equal({ ...expectedMeta, broadcast: true });
        const expectedCollStatusPayload = {
          busyStatus: busyStatus.IDLE,
        };
        expect(actionCollStatus.payload).to.deep.equal(expectedCollStatusPayload);

        const successAction = performedActions[2];
        expect(successAction.type).to.equal(UPDATE_SUCCESS);

        expect(successAction.meta).to.deep.equal(expectedMeta);
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });

  it('produces valid actions for delete request', done => {
    const schema = 'schema_test';
    const deletedItem = {
      type: schema,
      id: '1',
    };

    const expectedPayload = { data: deletedItem };

    const expectedMeta = {
      source: middlewareJsonApiSource,
      schema,
      tag: '',
    };
    const mockSuccessAction = {
      type: REMOVE_REQUEST,
      meta: expectedMeta,
      payload: expectedPayload,
    };

    const store = mockStore({});
    store.dispatch(actionPromise(mockSuccessAction))
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(3);

        const actionCollRequest = performedActions[0];
        expect(actionCollRequest.type).to.equal(COLLECTION_STATUS);
        expect(actionCollRequest.meta).to.deep.equal({ ...expectedMeta, broadcast: true });
        const expectedCollStatusPayload = {
          validationStatus: validationStatus.INVALID,
          busyStatus: busyStatus.BUSY,
        };
        expect(actionCollRequest.payload).to.deep.equal(expectedCollStatusPayload);

        const actionObjDeleting = performedActions[1];
        expect(actionObjDeleting.type).to.equal(OBJECT_REMOVING);
        expect(actionObjDeleting.meta).to.deep.equal(expectedMeta);

        const successAction = performedActions[2];
        expect(successAction.type).to.equal(REMOVE_REQUEST);
        expect(successAction.meta).to.deep.equal(expectedMeta);
      }).then(done).catch(done);
  });

  it('produces valid actions for delete success', done => {
    const schema = 'schema_test';
    const deletedItem = {
      type: schema,
      id: '1',
    };

    const expectedPayload = { data: deletedItem };

    const expectedMeta = {
      source: middlewareJsonApiSource,
      schema,
      tag: '',
    };
    const mockSuccessAction = {
      type: REMOVE_SUCCESS,
      meta: expectedMeta,
      payload: expectedPayload,
    };

    const store = mockStore({});
    store.dispatch(actionPromise(mockSuccessAction))
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(3);

        const actionObjDeleted = performedActions[0];
        expect(actionObjDeleted.type).to.equal(OBJECT_REMOVED);
        expect(actionObjDeleted.meta).to.deep.equal(expectedMeta);

        const actionCollStatus = performedActions[1];
        expect(actionCollStatus.type).to.equal(COLLECTION_STATUS);
        expect(actionCollStatus.meta).to.deep.equal({ ...expectedMeta, broadcast: true });
        const expectedCollStatusPayload = {
          validationStatus: validationStatus.INVALID,
          busyStatus: busyStatus.IDLE,
        };
        expect(actionCollStatus.payload).to.deep.equal(expectedCollStatusPayload);

        const successAction = performedActions[2];
        expect(successAction.type).to.equal(REMOVE_SUCCESS);
        expect(successAction.meta).to.deep.equal(expectedMeta);
      }).then(done).catch(done);
  });

  it('produces valid actions for included data in payload', done => {
    const schema = 'schema_test';
    const includedSchema = 'included_schema';
    const tag = 'tag_test';
    const expectedPayload = {
      data: [
        {
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
        },
      ],
      included: [
        {
          type: includedSchema,
          id: '100',
          attributes: {
            name: 'Test100',
          },
        }, {
          type: includedSchema,
          id: '101',
          attributes: {
            name: 'Test101',
          },
        },
      ],
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
        expect(performedActions).to.have.length(6);

        const actionObjIncludedFetched = performedActions[0];
        expect(actionObjIncludedFetched.type).to.equal(OBJECT_FETCHED);
        expect(actionObjIncludedFetched.meta)
          .to.deep.equal({ ...expectedMeta, schema: includedSchema });
        expect(actionObjIncludedFetched.payload).to.deep.equal(expectedPayload.included[0]);

        const actionObjFetched = performedActions[2];
        expect(actionObjFetched.type).to.equal(OBJECT_FETCHED);
        expect(actionObjFetched.meta).to.deep.equal(expectedMeta);
        expect(actionObjFetched.payload).to.deep.equal(expectedPayload.data[0]);

        const actionCollFetched = performedActions[4];
        expect(actionCollFetched.type).to.equal(COLLECTION_FETCHED);
        expect(actionCollFetched.meta).to.deep.equal({ ...expectedMeta, broadcast: false });
        expect(actionCollFetched.payload).to.deep.equal(expectedPayload.data);

        const successAction = performedActions[5];
        expect(successAction.type).to.equal(LOAD_SUCCESS);

        expect(successAction.meta).to.deep.equal(expectedMeta);
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });

  it('ignores other actions', done => {
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

  it('ignores actions with other sources', done => {
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
      source: 'json',
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
        expect(performedActions).to.have.length(1);

        const actionObjFetched = performedActions[0];
        expect(actionObjFetched.type).to.equal(LOAD_SUCCESS);
      }).then(done).catch(done);
  });

  it('ignores load request actions without proper tag', done => {
    const schema = 'schema_test';
    const tag = undefined;
    const expectedMeta = {
      source: middlewareJsonApiSource,
      schema,
      tag,
    };

    const mockRequestAction = {
      type: LOAD_REQUEST,
      meta: expectedMeta,
    };

    const store = mockStore({});
    store.dispatch(actionPromise(mockRequestAction))
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(1);

        const actionObjFetched = performedActions[0];
        expect(actionObjFetched.type).to.equal(LOAD_REQUEST);
      }).then(done).catch(done);
  });

  it('ignores load success actions without proper tag', done => {
    const schema = 'schema_test';
    const tag = undefined;
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

    const mockRequestAction = {
      type: LOAD_SUCCESS,
      meta: expectedMeta,
      payload: expectedPayload,
    };

    const store = mockStore({});
    store.dispatch(actionPromise(mockRequestAction))
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(1);

        const actionObjFetched = performedActions[0];
        expect(actionObjFetched.type).to.equal(LOAD_SUCCESS);
      }).then(done).catch(done);
  });

  it('exception if action doesn\'t have meta', done => {
    const schema = 'schema_test';
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

    const mockSuccessAction = {
      type: LOAD_SUCCESS,
      payload: expectedPayload,
    };

    const store = mockStore({});
    expect(() => store.dispatch(actionPromise(mockSuccessAction))).to.throw('Meta is undefined.');
    done();
  });

  it('exception if action doesn\'t have source', done => {
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
      schema,
      tag,
    };

    const mockSuccessAction = {
      type: LOAD_SUCCESS,
      meta: expectedMeta,
      payload: expectedPayload,
    };

    const store = mockStore({});
    expect(() => store.dispatch(actionPromise(mockSuccessAction))).to.throw('Source is undefined.');
    done();
  });

  it('exception if action doesn\'t have schema', done => {
    const tag = 'tag_test';
    const schema = 'schema_test';
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
      tag,
    };

    const mockSuccessAction = {
      type: LOAD_SUCCESS,
      meta: expectedMeta,
      payload: expectedPayload,
    };

    const store = mockStore({});
    expect(() => store.dispatch(actionPromise(mockSuccessAction))).to.throw('Schema is invalid.');
    done();
  });

  it('exception if action doesn\'t have payload with data property', done => {
    const tag = 'tag_test';
    const schema = 'schema_test';
    const expectedPayload = {};

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
    expect(() => store.dispatch(actionPromise(mockSuccessAction)))
      .to.throw('Payload Data is invalid, expecting payload.data.');
    done();
  });
});
