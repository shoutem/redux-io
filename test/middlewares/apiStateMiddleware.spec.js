import _ from 'lodash';
import { expect } from 'chai';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import sinon from 'sinon';
import rio, {
  LOAD_REQUEST,
  LOAD_SUCCESS,
  LOAD_ERROR,
  CREATE_REQUEST,
  CREATE_SUCCESS,
  CREATE_ERROR,
  UPDATE_REQUEST,
  UPDATE_SUCCESS,
  UPDATE_ERROR,
  REMOVE_REQUEST,
  REMOVE_SUCCESS,
  REMOVE_ERROR,
  OBJECT_CREATED,
  OBJECT_FETCHED,
  OBJECT_UPDATING,
  OBJECT_UPDATED,
  OBJECT_REMOVING,
  OBJECT_REMOVED,
  REFERENCE_FETCHED,
  REFERENCE_STATUS,
  apiStateMiddleware,
  JSON_API_RESOURCE,
  ReduxApiStateDenormalizer,
  invalidate,
} from '../../src';
import {
  validationStatus,
  busyStatus,
  STATUS,
} from '../../src/status';

describe('Json api middleware', () => {
  let mockStore = configureMockStore([thunk, apiStateMiddleware]);
  const actionPromise = action => dispatch => (
    new Promise((resolve) => {
      resolve();
    }).then(dispatch(action))
  );

  beforeEach(() => {
    sinon.spy(console, 'error');
    const denormalizer = new ReduxApiStateDenormalizer();
    rio.setDenormalizer(denormalizer);
  });

  afterEach(() => {
    mockStore = configureMockStore([thunk, apiStateMiddleware]);
    console.error.restore();
  });

  it('produces valid actions for fetch request', done => {
    const schema = 'schema_test';
    const tag = 'tag_test';
    const expectedMeta = {
      source: JSON_API_RESOURCE,
      schema,
      tag,
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

        const batchedActions = performedActions[0].payload;

        const actionCollStatus = batchedActions[0];
        expect(actionCollStatus.type).to.equal(REFERENCE_STATUS);
        expect(actionCollStatus.meta).to.deep.equal(expectedMeta);
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
      source: JSON_API_RESOURCE,
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
        expect(performedActions).to.have.length(2);

        const batchedActions = performedActions[0].payload;

        const actionObjFetched = batchedActions[0];
        expect(actionObjFetched.type).to.equal(OBJECT_FETCHED);
        expect(actionObjFetched.meta).to.deep.equal({ ...expectedMeta, transformation: {} });
        expect(actionObjFetched.payload).to.deep.equal(expectedPayload.data[0]);

        const actionCollFetched = batchedActions[2];
        expect(actionCollFetched.type).to.equal(REFERENCE_FETCHED);
        expect(actionCollFetched.meta).to.deep.equal(expectedMeta);
        expect(actionCollFetched.payload).to.deep.equal(expectedPayload.data);

        const successAction = performedActions[1];
        expect(successAction.type).to.equal(LOAD_SUCCESS);
        expect(successAction.meta).to.deep.equal(expectedMeta);
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });

  it('produces valid actions for fetch error', done => {
    const schema = 'schema_test';
    const tag = 'tag_test';
    const expectedMeta = {
      source: JSON_API_RESOURCE,
      schema,
      tag,
    };

    const mockErrorAction = {
      type: LOAD_ERROR,
      meta: expectedMeta,
    };

    const store = mockStore({});
    store.dispatch(actionPromise(mockErrorAction))
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(2);

        const batchedActions = performedActions[0].payload;

        const actionCollStatus = batchedActions[0];
        expect(actionCollStatus.type).to.equal(REFERENCE_STATUS);
        expect(actionCollStatus.meta).to.deep.equal(expectedMeta);
        const expectedCollStatusPayload = {
          busyStatus: busyStatus.IDLE,
          validationStatus: validationStatus.INVALID,
          error: true,
        };
        expect(actionCollStatus.payload).to.deep.equal(expectedCollStatusPayload);

        const requestAction = performedActions[1];
        expect(requestAction.type).to.equal(LOAD_ERROR);
        expect(requestAction.meta).to.deep.equal(expectedMeta);
      }).then(done).catch(done);
  });

  it('produces valid actions for create request', done => {
    const schema = 'schema_test';
    const tag = 'tag_test';
    const expectedMeta = {
      source: JSON_API_RESOURCE,
      schema,
      tag,
    };

    const mockSuccessAction = {
      type: CREATE_REQUEST,
      meta: expectedMeta,
    };

    const store = mockStore({});
    store.dispatch(actionPromise(mockSuccessAction))
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(2);

        const batchedActions = performedActions[0].payload;

        const actionCollStatus = batchedActions[0];
        expect(actionCollStatus.type).to.equal(REFERENCE_STATUS);
        expect(actionCollStatus.meta).to.deep.equal({ ...expectedMeta, tag: '*'  });
        const expectedCollStatusPayload = {
          busyStatus: busyStatus.BUSY,
          validationStatus: validationStatus.INVALID
        };
        expect(actionCollStatus.payload).to.deep.equal(expectedCollStatusPayload);

        const requestAction = performedActions[1];
        expect(requestAction.type).to.equal(CREATE_REQUEST);
        expect(requestAction.meta).to.deep.equal(expectedMeta);
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
      source: JSON_API_RESOURCE,
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
        expect(performedActions).to.have.length(2);

        const batchedActions = performedActions[0].payload;

        const actionObjCreated = batchedActions[0];
        expect(actionObjCreated.type).to.equal(OBJECT_CREATED);
        expect(actionObjCreated.meta).to.deep.equal({ ...expectedMeta, transformation: {} });
        expect(actionObjCreated.payload).to.deep.equal(expectedPayload.data[0]);

        const actionCollStatus = batchedActions[1];
        expect(actionCollStatus.type).to.equal(REFERENCE_STATUS);
        expect(actionCollStatus.meta).to.deep.equal({ ...expectedMeta, tag: '*' });
        const expectedCollStatusPayload = {
          validationStatus: validationStatus.INVALID,
          busyStatus: busyStatus.IDLE,
        };
        expect(actionCollStatus.payload).to.deep.equal(expectedCollStatusPayload);

        const successAction = performedActions[1];
        expect(successAction.type).to.equal(CREATE_SUCCESS);
        expect(successAction.meta).to.deep.equal(expectedMeta);
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });

  it('produces valid actions for create error', done => {
    const schema = 'schema_test';
    const expectedMeta = {
      source: JSON_API_RESOURCE,
      schema,
    };

    const mockErrorAction = {
      type: CREATE_ERROR,
      meta: expectedMeta,
    };

    const store = mockStore({});
    store.dispatch(actionPromise(mockErrorAction))
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(2);

        const batchedActions = performedActions[0].payload;

        const actionCollStatus = batchedActions[0];
        expect(actionCollStatus.type).to.equal(REFERENCE_STATUS);
        expect(actionCollStatus.meta).to.deep.equal({ ...expectedMeta, tag: '*' });
        const expectedCollStatusPayload = {
          busyStatus: busyStatus.IDLE,
          validationStatus: validationStatus.INVALID,
        };
        expect(actionCollStatus.payload).to.deep.equal(expectedCollStatusPayload);

        const requestAction = performedActions[1];
        expect(requestAction.type).to.equal(CREATE_ERROR);
        expect(requestAction.meta).to.deep.equal(expectedMeta);
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
      source: JSON_API_RESOURCE,
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
        expect(performedActions).to.have.length(2);

        const batchedActions = performedActions[0].payload;

        const actionCollStatusBusy = batchedActions[0];
        expect(actionCollStatusBusy.type).to.equal(REFERENCE_STATUS);
        expect(actionCollStatusBusy.meta)
          .to.deep.equal({ ...expectedMeta, tag: '*' });
        const expectedCollStatusBusyPayload = {
          busyStatus: busyStatus.BUSY,
          validationStatus: validationStatus.INVALID,
        };
        expect(actionCollStatusBusy.payload).to.deep.equal(expectedCollStatusBusyPayload);

        const actionObjUpdating = batchedActions[1];
        expect(actionObjUpdating.type).to.equal(OBJECT_UPDATING);
        expect(actionObjUpdating.meta).to.deep.equal({ ...expectedMeta, transformation: {} });
        expect(actionObjUpdating.payload).to.deep.equal(expectedPayload.data[0]);

        const actionUpdateRequest = performedActions[1];
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
      source: JSON_API_RESOURCE,
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
        expect(performedActions).to.have.length(2);

        const batchedActions = performedActions[0].payload;

        const actionObjUpdated = batchedActions[0];
        expect(actionObjUpdated.type).to.equal(OBJECT_UPDATED);
        expect(actionObjUpdated.meta).to.deep.equal({ ...expectedMeta, transformation: {} });
        expect(actionObjUpdated.payload).to.deep.equal(expectedPayload.data[0]);

        const actionCollStatus = batchedActions[1];
        expect(actionCollStatus.type).to.equal(REFERENCE_STATUS);
        expect(actionCollStatus.meta).to.deep.equal({ ...expectedMeta, tag: '*' });
        const expectedCollStatusPayload = {
          busyStatus: busyStatus.IDLE,
          validationStatus: validationStatus.INVALID,
        };
        expect(actionCollStatus.payload).to.deep.equal(expectedCollStatusPayload);

        const successAction = performedActions[1];
        expect(successAction.type).to.equal(UPDATE_SUCCESS);

        expect(successAction.meta).to.deep.equal(expectedMeta);
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });

  it('produces valid actions for update error', done => {
    const schema = 'schema_test';
    const expectedMeta = {
      source: JSON_API_RESOURCE,
      schema,
    };

    const mockErrorAction = {
      type: UPDATE_ERROR,
      meta: expectedMeta,
    };

    const store = mockStore({});
    store.dispatch(actionPromise(mockErrorAction))
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(2);

        const batchedActions = performedActions[0].payload;

        const actionCollStatus = batchedActions[0];
        expect(actionCollStatus.type).to.equal(REFERENCE_STATUS);
        expect(actionCollStatus.meta).to.deep.equal({ ...expectedMeta, tag: '*' });
        const expectedCollStatusPayload = {
          busyStatus: busyStatus.IDLE,
          validationStatus: validationStatus.INVALID,
        };
        expect(actionCollStatus.payload).to.deep.equal(expectedCollStatusPayload);

        const requestAction = performedActions[1];
        expect(requestAction.type).to.equal(UPDATE_ERROR);
        expect(requestAction.meta).to.deep.equal(expectedMeta);
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
      source: JSON_API_RESOURCE,
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
        expect(performedActions).to.have.length(2);

        const batchedActions = performedActions[0].payload;

        const actionCollRequest = batchedActions[0];
        expect(actionCollRequest.type).to.equal(REFERENCE_STATUS);
        expect(actionCollRequest.meta).to.deep.equal({ ...expectedMeta, tag: '*' });
        const expectedCollStatusPayload = {
          validationStatus: validationStatus.INVALID,
          busyStatus: busyStatus.BUSY,
        };
        expect(actionCollRequest.payload).to.deep.equal(expectedCollStatusPayload);

        const actionObjDeleting = batchedActions[1];
        expect(actionObjDeleting.type).to.equal(OBJECT_REMOVING);
        expect(actionObjDeleting.meta).to.deep.equal({ ...expectedMeta, transformation: {} });

        const successAction = performedActions[1];
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
      source: JSON_API_RESOURCE,
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
        expect(performedActions).to.have.length(2);

        const batchedActions = performedActions[0].payload;

        const actionObjDeleted = batchedActions[0];
        expect(actionObjDeleted.type).to.equal(OBJECT_REMOVED);
        expect(actionObjDeleted.meta).to.deep.equal({ ...expectedMeta, transformation: {} });

        const actionCollStatus = batchedActions[1];
        expect(actionCollStatus.type).to.equal(REFERENCE_STATUS);
        expect(actionCollStatus.meta).to.deep.equal({ ...expectedMeta, tag: '*' });
        const expectedCollStatusPayload = {
          validationStatus: validationStatus.INVALID,
          busyStatus: busyStatus.IDLE,
        };
        expect(actionCollStatus.payload).to.deep.equal(expectedCollStatusPayload);

        const successAction = performedActions[1];
        expect(successAction.type).to.equal(REMOVE_SUCCESS);
        expect(successAction.meta).to.deep.equal(expectedMeta);
      }).then(done).catch(done);
  });

  it('produces valid actions for delete error', done => {
    const schema = 'schema_test';
    const expectedMeta = {
      source: JSON_API_RESOURCE,
      schema,
    };

    const mockErrorAction = {
      type: REMOVE_ERROR,
      meta: expectedMeta,
    };

    const store = mockStore({});
    store.dispatch(actionPromise(mockErrorAction))
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(2);

        const batchedActions = performedActions[0].payload;

        const actionCollStatus = batchedActions[0];
        expect(actionCollStatus.type).to.equal(REFERENCE_STATUS);
        expect(actionCollStatus.meta).to.deep.equal({ ...expectedMeta, tag: '*' });
        const expectedCollStatusPayload = {
          busyStatus: busyStatus.IDLE,
          validationStatus: validationStatus.INVALID,
        };
        expect(actionCollStatus.payload).to.deep.equal(expectedCollStatusPayload);

        const requestAction = performedActions[1];
        expect(requestAction.type).to.equal(REMOVE_ERROR);
        expect(requestAction.meta).to.deep.equal(expectedMeta);
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
      source: JSON_API_RESOURCE,
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
        expect(performedActions).to.have.length(2);

        const batchedActions = performedActions[0].payload;

        const actionObjIncludedFetched = batchedActions[0];
        expect(actionObjIncludedFetched.type).to.equal(OBJECT_FETCHED);
        expect(actionObjIncludedFetched.meta).to.deep.equal({
          ...expectedMeta,
          schema: includedSchema,
          transformation: {},
        });
        expect(actionObjIncludedFetched.payload).to.deep.equal(expectedPayload.included[0]);

        const actionObjFetched = batchedActions[2];
        expect(actionObjFetched.type).to.equal(OBJECT_FETCHED);
        expect(actionObjFetched.meta).to.deep.equal({ ...expectedMeta, transformation: {} });
        expect(actionObjFetched.payload).to.deep.equal(expectedPayload.data[0]);

        const actionCollFetched = batchedActions[4];
        expect(actionCollFetched.type).to.equal(REFERENCE_FETCHED);
        expect(actionCollFetched.meta).to.deep.equal({ ...expectedMeta });
        expect(actionCollFetched.payload).to.deep.equal(expectedPayload.data);

        const successAction = performedActions[1];
        expect(successAction.type).to.equal(LOAD_SUCCESS);
        expect(successAction.meta).to.deep.equal(expectedMeta);
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });

  it('produces valid actions for meta data in payload', done => {
    const schema = 'schema_test';
    const tag = 'tag_test';
    const expectedPayload = {
      meta: { count: 50 },
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
    };
    const expectedMeta = {
      source: JSON_API_RESOURCE,
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
        expect(performedActions).to.have.length(2);

        const batchedActions = performedActions[0].payload;

        const actionObjFetched = batchedActions[0];
        expect(actionObjFetched.type).to.equal(OBJECT_FETCHED);
        expect(actionObjFetched.meta).to.deep.equal({ ...expectedMeta, transformation: {} });
        expect(actionObjFetched.payload).to.deep.equal(expectedPayload.data[0]);

        const actionCollFetched = batchedActions[2];
        expect(actionCollFetched.type).to.equal(REFERENCE_FETCHED);
        expect(actionCollFetched.meta).to.deep.equal({ ...expectedMeta });
        expect(actionCollFetched.payload).to.deep.equal(expectedPayload.data);

        const actionMeta= batchedActions[3];
        expect(actionMeta.type).to.equal(REFERENCE_STATUS);
        expect(actionMeta.meta).to.deep.equal({ ...expectedMeta });
        expect(actionMeta.payload).to.deep.equal({ meta: expectedPayload.meta });

        const successAction = performedActions[1];
        expect(successAction.type).to.equal(LOAD_SUCCESS);
        expect(successAction.meta).to.deep.equal(expectedMeta);
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });

  it('produces valid actions for empty meta data in payload', done => {
    const schema = 'schema_test';
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
    };
    const expectedMeta = {
      source: JSON_API_RESOURCE,
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
        expect(performedActions).to.have.length(2);

        const batchedActions = performedActions[0].payload;

        const actionObjFetched = batchedActions[0];
        expect(actionObjFetched.type).to.equal(OBJECT_FETCHED);
        expect(actionObjFetched.meta).to.deep.equal({ ...expectedMeta, transformation: {} });
        expect(actionObjFetched.payload).to.deep.equal(expectedPayload.data[0]);

        const actionCollFetched = batchedActions[2];
        expect(actionCollFetched.type).to.equal(REFERENCE_FETCHED);
        expect(actionCollFetched.meta).to.deep.equal({ ...expectedMeta });
        expect(actionCollFetched.payload).to.deep.equal(expectedPayload.data);

        const actionMeta= batchedActions[3];
        expect(actionMeta).to.equal(undefined);

        const successAction = performedActions[1];
        expect(successAction.type).to.equal(LOAD_SUCCESS);
        expect(successAction.meta).to.deep.equal(expectedMeta);
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });

  it('produces valid actions for links data in payload', done => {
    const schema = 'schema_test';
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
      links: {
          self: 'self url',
          next: 'next url',
          prev: 'last url',
        },
    };
    const expectedMeta = {
      source: JSON_API_RESOURCE,
      schema,
      tag,
    };

    const mockSuccessAction = {
      type: LOAD_SUCCESS,
      meta: expectedMeta,
      payload: expectedPayload,
    };

    const expectedLinks = {
      ...expectedPayload.links,
      last: null
    };
    const store = mockStore({});
    store.dispatch(actionPromise(mockSuccessAction))
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(2);

        const batchedActions = performedActions[0].payload;

        const actionObjFetched = batchedActions[0];
        expect(actionObjFetched.type).to.equal(OBJECT_FETCHED);
        expect(actionObjFetched.meta).to.deep.equal({ ...expectedMeta, transformation: {} });
        expect(actionObjFetched.payload).to.deep.equal(expectedPayload.data[0]);

        const actionCollFetched = batchedActions[2];
        expect(actionCollFetched.type).to.equal(REFERENCE_FETCHED);
        expect(actionCollFetched.meta).to.deep.equal({ ...expectedMeta });
        expect(actionCollFetched.payload).to.deep.equal(expectedPayload.data);

        const actionLinks= batchedActions[3];
        expect(actionLinks.type).to.equal(REFERENCE_STATUS);
        expect(actionLinks.meta).to.deep.equal({ ...expectedMeta });
        expect(actionLinks.payload).to.deep.equal({ links: expectedLinks });

        const successAction = performedActions[1];
        expect(successAction.type).to.equal(LOAD_SUCCESS);
        expect(successAction.meta).to.deep.equal(expectedMeta);
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });

  it('produces valid actions for empty links data in payload', done => {
    const schema = 'schema_test';
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
    };
    const expectedMeta = {
      source: JSON_API_RESOURCE,
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
        expect(performedActions).to.have.length(2);

        const batchedActions = performedActions[0].payload;

        const actionObjFetched = batchedActions[0];
        expect(actionObjFetched.type).to.equal(OBJECT_FETCHED);
        expect(actionObjFetched.meta).to.deep.equal({ ...expectedMeta, transformation: {} });
        expect(actionObjFetched.payload).to.deep.equal(expectedPayload.data[0]);

        const actionCollFetched = batchedActions[2];
        expect(actionCollFetched.type).to.equal(REFERENCE_FETCHED);
        expect(actionCollFetched.meta).to.deep.equal({ ...expectedMeta });
        expect(actionCollFetched.payload).to.deep.equal(expectedPayload.data);

        const actionLinks= batchedActions[3];
        expect(actionLinks).to.equal(undefined);

        const successAction = performedActions[1];
        expect(successAction.type).to.equal(LOAD_SUCCESS);
        expect(successAction.meta).to.deep.equal(expectedMeta);
        expect(successAction.payload).to.deep.equal(expectedPayload);
      }).then(done).catch(done);
  });

  it('produces valid transformation meta data for fetch success', done => {
    const schema = 'schema_test';
    const tag = 'tag_test';
    const expectedPayload = {
      data: [{
        type: schema,
        id: '1',
        attributes: {
          name: 'Test1',
        },
        relationships: {
          author: {
            data: {
              id: '42',
              type: 'people',
            },
          },
          places: {
            data: [
              {
                id: '1',
                type: 'place',
              },
              {
                id: '2',
                type: 'place',
              },
            ],
          },
        },
      }, {
        type: schema,
        id: '2',
        attributes: {
          name: 'Test2',
        },
        relationships: {
          owner: {
            data: {
              id: 'A',
              type: 'Mike',
            },
          },
        },
      }],
    };
    const expectedMeta = {
      source: JSON_API_RESOURCE,
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

        const batchedAction = performedActions[0];

        const actionFirstObjFetched = batchedAction.payload[0];
        expect(actionFirstObjFetched.type).to.equal(OBJECT_FETCHED);
        const transformationFirstObj = {
          relationships: {
            author: { type: 'people' },
            places: { type: 'place' },
          },
          type: 'schema_test',
        };
        const expectedMetaFirstObject = {
          ...expectedMeta,
          transformation: transformationFirstObj,
        };
        expect(actionFirstObjFetched.meta).to.deep.equal(expectedMetaFirstObject);
        expect(actionFirstObjFetched.payload).to.deep.equal(expectedPayload.data[0]);

        const actionSecondObjFetched = batchedAction.payload[1];
        expect(actionSecondObjFetched.type).to.equal(OBJECT_FETCHED);
        const transformationSecondObj = {
          relationships: {
            owner: { type: 'Mike' },
          },
          type: 'schema_test',
        };
        const expectedMetaSecondObject = {
          ...expectedMeta,
          transformation: transformationSecondObj,
        };
        expect(actionSecondObjFetched.meta).to.deep.equal(expectedMetaSecondObject);
        expect(actionSecondObjFetched.payload).to.deep.equal(expectedPayload.data[1]);
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
      source: JSON_API_RESOURCE,
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
      source: JSON_API_RESOURCE,
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
      source: JSON_API_RESOURCE,
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

  it('writes error to console and ignores action if it doesn\'t have meta', done => {
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
    store.dispatch(actionPromise(mockSuccessAction)).then(() => {
      const performedActions = store.getActions();
      expect(performedActions).to.have.length(1);

      const requestAction = performedActions[0];
      expect(requestAction.type).to.equal(LOAD_SUCCESS);

      expect(console.error.calledOnce).to.be.true;
      expect(console.error.calledWith('Meta is undefined.')).to.be.true;
    }).then(done).catch(done);
  });

  it('writes error to console and ignores action if it doesn\'t have source', done => {
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
    store.dispatch(actionPromise(mockSuccessAction)).then(() => {
      const performedActions = store.getActions();
      expect(performedActions).to.have.length(1);

      const requestAction = performedActions[0];
      expect(requestAction.type).to.equal(LOAD_SUCCESS);

      expect(console.error.calledOnce).to.be.true;
      expect(console.error.calledWith('Source is undefined.')).to.be.true;
    }).then(done).catch(done);
  });

  it('writes error to console and ignores action if action doesn\'t have schema', done => {
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
      source: JSON_API_RESOURCE,
      tag,
    };

    const mockSuccessAction = {
      type: LOAD_SUCCESS,
      meta: expectedMeta,
      payload: expectedPayload,
    };

    const store = mockStore({});
    store.dispatch(actionPromise(mockSuccessAction)).then(() => {
      const performedActions = store.getActions();
      expect(performedActions).to.have.length(1);

      const requestAction = performedActions[0];
      expect(requestAction.type).to.equal(LOAD_SUCCESS);

      expect(console.error.calledOnce).to.be.true;
      expect(console.error.calledWith('Action.meta.schema is undefined.')).to.be.true;
    }).then(done).catch(done);
  });

  it('writes error to console and ignores action if action have no payload', done => {
    const tag = 'tag_test';
    const schema = 'schema_test';

    const expectedMeta = {
      source: JSON_API_RESOURCE,
      schema,
      tag,
    };

    const mockSuccessAction = {
      type: LOAD_SUCCESS,
      meta: expectedMeta,
    };

    const store = mockStore({});
    store.dispatch(actionPromise(mockSuccessAction)).then(() => {
      const performedActions = store.getActions();
      expect(performedActions).to.have.length(1);

      const requestAction = performedActions[0];
      expect(requestAction.type).to.equal(LOAD_SUCCESS);

      expect(console.error.calledOnce).to.be.true;
      expect(console.error.calledWith('Response should contain payload.')).to.be.true;
    }).then(done).catch(done);
  });

  it('writes error to console and ignores action if action response is json-api without payload.data', done => {
    const tag = 'tag_test';
    const schema = 'schema_test';

    const expectedPayload = {};

    const expectedMeta = {
      source: JSON_API_RESOURCE,
      schema,
      tag,
    };

    const mockSuccessAction = {
      type: LOAD_SUCCESS,
      meta: expectedMeta,
      payload: expectedPayload,
    };

    const store = mockStore({});
    store.dispatch(actionPromise(mockSuccessAction)).then(() => {
      const performedActions = store.getActions();
      expect(performedActions).to.have.length(1);

      const requestAction = performedActions[0];
      expect(requestAction.type).to.equal(LOAD_SUCCESS);

      expect(console.error.calledOnce).to.be.true;
      expect(console.error.calledWith(`${JSON_API_RESOURCE} response should contain payload.data.`)).to.be.true;
    }).then(done).catch(done);
  });

  it('ignores action if action doesn\'t have appropriate standardizer for such source type', done => {
    const tag = 'tag_test';
    const schema = 'schema_test';
    const expectedPayload = {
      name: 'Car',
      description: 'Slow and fast at the same time',
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
    store.dispatch(actionPromise(mockSuccessAction)).then(() => {
      const performedActions = store.getActions();
      expect(performedActions).to.have.length(1);

      const requestAction = performedActions[0];
      expect(requestAction.type).to.equal(LOAD_SUCCESS);

      expect(console.error.calledOnce).to.be.false;
    }).then(done).catch(done);
  });

  it('ignores obsolete updated action', done => {
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
      source: JSON_API_RESOURCE,
      schema,
      tag: '',
    };

    const mockUpdateRequestActionFirst = {
      type: UPDATE_REQUEST,
      meta: {
        ...expectedMeta,
        timestamp: 1,
      },
      payload: expectedPayload,
    };
    const mockUpdateSuccessActionFirst = {
      type: UPDATE_SUCCESS,
      meta: {
        ...expectedMeta,
        timestamp: 1,
      },
      payload: expectedPayload,
    };

    const mockUpdateRequestActionSecond = {
      type: UPDATE_REQUEST,
      meta: {
        ...expectedMeta,
        timestamp: 2,
      },
      payload: expectedPayload,
    };
    const mockUpdateSuccessActionSecond = {
      type: UPDATE_SUCCESS,
      meta: {
        ...expectedMeta,
        timestamp: 2,
      },
      payload: expectedPayload,
    };

    const store = mockStore({});
    _.delay(() => store.dispatch(actionPromise(mockUpdateRequestActionFirst)).then(() => {
      const performedActions = store.getActions();
      store.clearActions();
      expect(performedActions).to.have.lengthOf(2);
    }), 0);
    _.delay(() => store.dispatch(actionPromise(mockUpdateRequestActionSecond)).then(() => {
      const performedActions = store.getActions();
      store.clearActions();
      expect(performedActions).to.have.lengthOf(2);
    }), 50);
    _.delay(() => store.dispatch(actionPromise(mockUpdateSuccessActionFirst)).then(() => {
      const performedActions = store.getActions();
      store.clearActions();
      expect(performedActions).to.have.lengthOf(1);
    }), 100);
    _.delay(() => store.dispatch(actionPromise(mockUpdateSuccessActionSecond)).then(() => {
      const performedActions = store.getActions();
      store.clearActions();
      expect(performedActions).to.have.lengthOf(2);
    }).then(done).catch(done), 150);
  });

  it('ignores obsolete loaded action', done => {
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
      source: JSON_API_RESOURCE,
      schema,
      tag: '',
    };

    const mockUpdateRequestActionFirst = {
      type: UPDATE_REQUEST,
      meta: {
        ...expectedMeta,
        timestamp: 1,
      },
      payload: expectedPayload,
    };
    const mockUpdateSuccessActionFirst = {
      type: UPDATE_SUCCESS,
      meta: {
        ...expectedMeta,
        timestamp: 1,
      },
      payload: expectedPayload,
    };

    const mockUpdateRequestActionSecond = {
      type: UPDATE_REQUEST,
      meta: {
        ...expectedMeta,
        timestamp: 3,
      },
      payload: expectedPayload,
    };
    const mockUpdateSuccessActionSecond = {
      type: UPDATE_SUCCESS,
      meta: {
        ...expectedMeta,
        timestamp: 3,
      },
      payload: expectedPayload,
    };

    const mockFindRequestActionFirst = {
      type: LOAD_REQUEST,
      meta: {
        ...expectedMeta,
        timestamp: 2,
      },
    };
    const mockFindSuccessActionFirst = {
      type: LOAD_SUCCESS,
      meta: {
        ...expectedMeta,
        timestamp: 2,
      },
      payload: expectedPayload,
    };

    const mockFindRequestActionSecond = {
      type: LOAD_REQUEST,
      meta: {
        ...expectedMeta,
        timestamp: 4,
      },
    };
    const mockFindSuccessActionSecond = {
      type: LOAD_SUCCESS,
      meta: {
        ...expectedMeta,
        timestamp: 4,
      },
      payload: expectedPayload,
    };

    const store = mockStore({});

    _.delay(() => store.dispatch(actionPromise(mockUpdateRequestActionFirst)).then(() => {
      const performedActions = store.getActions();
      store.clearActions();
      expect(performedActions).to.have.lengthOf(2);
    }), 0);
    _.delay(() => store.dispatch(actionPromise(mockUpdateSuccessActionFirst)).then(() => {
      const performedActions = store.getActions();
      store.clearActions();
      expect(performedActions).to.have.lengthOf(2);
    }), 50);
    _.delay(() => store.dispatch(actionPromise(mockFindRequestActionFirst)).then(() => {
      const performedActions = store.getActions();
      store.clearActions();
      expect(performedActions).to.have.lengthOf(2);
    }), 100);
    _.delay(() => store.dispatch(actionPromise(mockUpdateRequestActionSecond)).then(() => {
      const performedActions = store.getActions();
      store.clearActions();
      expect(performedActions).to.have.lengthOf(2);
    }), 150);
    _.delay(() => store.dispatch(actionPromise(mockFindSuccessActionFirst)).then(() => {
      const performedActions = store.getActions();
      store.clearActions();
      expect(performedActions).to.have.lengthOf(1);
    }), 200);
    _.delay(() => store.dispatch(actionPromise(mockUpdateSuccessActionSecond)).then(() => {
      const performedActions = store.getActions();
      store.clearActions();
      expect(performedActions).to.have.lengthOf(2);
    }), 250);
    _.delay(() => store.dispatch(actionPromise(mockFindRequestActionSecond)).then(() => {
      const performedActions = store.getActions();
      store.clearActions();
      expect(performedActions).to.have.lengthOf(2);
    }), 300);
    _.delay(() => store.dispatch(actionPromise(mockFindSuccessActionSecond)).then(() => {
      const performedActions = store.getActions();
      store.clearActions();
      expect(performedActions).to.have.lengthOf(2);
    }).then(done).catch(done), 350);
  });

  it('produces valid actions for action without content (204)', done => {
    const schema = 'schema_test';

    const expectedMeta = {
      source: JSON_API_RESOURCE,
      schema,
      tag: '',
      response: { status: 204 },
    };

    const mockSuccessAction = {
      type: CREATE_SUCCESS,
      meta: expectedMeta,
    };

    const store = mockStore({});
    store.dispatch(actionPromise(mockSuccessAction))
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(2);

        const batchedActions = performedActions[0].payload;

        const actionCollStatus = batchedActions[0];
        expect(actionCollStatus.type).to.equal(REFERENCE_STATUS);
        expect(actionCollStatus.meta).to.deep.equal({ ...expectedMeta, tag: '*' });
        const expectedCollStatusPayload = {
          validationStatus: validationStatus.INVALID,
          busyStatus: busyStatus.IDLE,
        };
        expect(actionCollStatus.payload).to.deep.equal(expectedCollStatusPayload);

        const successAction = performedActions[1];
        expect(successAction.type).to.equal(CREATE_SUCCESS);
        expect(successAction.meta).to.deep.equal(expectedMeta);
        expect(successAction.payload).to.be.undefined;
      }).then(done).catch(done);
  });

  describe('handling of action with error flag', () => {
    it('on LOAD_REQUEST', done => {
      const schema = 'schema_test';
      const tag = 'tag_test';
      const expectedMeta = {
        source: JSON_API_RESOURCE,
        schema,
        tag,
      };

      const mockErrorAction = {
        type: LOAD_REQUEST,
        meta: expectedMeta,
        error: true,
      };

      const store = mockStore({});
      store.dispatch(actionPromise(mockErrorAction))
        .then(() => {
          const performedActions = store.getActions();
          expect(performedActions).to.have.length(2);

          const batchedActions = performedActions[0].payload;

          const actionCollStatus = batchedActions[0];
          expect(actionCollStatus.type).to.equal(REFERENCE_STATUS);
          expect(actionCollStatus.meta).to.deep.equal(expectedMeta);
          const expectedCollStatusPayload = {
            busyStatus: busyStatus.IDLE,
            validationStatus: validationStatus.INVALID,
            error: true,
          };
          expect(actionCollStatus.payload).to.deep.equal(expectedCollStatusPayload);

          const requestAction = performedActions[1];
          expect(requestAction.type).to.equal(LOAD_REQUEST);
          expect(requestAction.meta).to.deep.equal(expectedMeta);
        }).then(done).catch(done);
    });
    it('on LOAD_REQUEST', done => {
      const schema = 'schema_test';
      const tag = 'tag_test';
      const expectedMeta = {
        source: JSON_API_RESOURCE,
        schema,
        tag,
      };

      const mockErrorAction = {
        type: LOAD_ERROR,
        meta: expectedMeta,
        error: true,
      };

      const store = mockStore({});
      store.dispatch(actionPromise(mockErrorAction))
        .then(() => {
          const performedActions = store.getActions();
          expect(performedActions).to.have.length(2);

          const batchedActions = performedActions[0].payload;

          const actionCollStatus = batchedActions[0];
          expect(actionCollStatus.type).to.equal(REFERENCE_STATUS);
          expect(actionCollStatus.meta).to.deep.equal(expectedMeta);
          const expectedCollStatusPayload = {
            busyStatus: busyStatus.IDLE,
            validationStatus: validationStatus.INVALID,
            error: true,
          };
          expect(actionCollStatus.payload).to.deep.equal(expectedCollStatusPayload);

          const requestAction = performedActions[1];
          expect(requestAction.type).to.equal(LOAD_ERROR);
          expect(requestAction.meta).to.deep.equal(expectedMeta);
        }).then(done).catch(done);
    });
    it('on REMOVE_REQUEST', done => {
      const schema = 'schema_test';
      const deletedItem = {
        type: schema,
        id: '1',
      };

      const expectedPayload = { data: deletedItem };

      const expectedMeta = {
        source: JSON_API_RESOURCE,
        schema,
        tag: '',
      };
      const mockErrorAction = {
        type: REMOVE_REQUEST,
        meta: expectedMeta,
        payload: expectedPayload,
        error: true,
      };

      const store = mockStore({});
      store.dispatch(actionPromise(mockErrorAction))
        .then(() => {
          const performedActions = store.getActions();
          expect(performedActions).to.have.length(2);

          const batchedActions = performedActions[0].payload;

          const actionCollRequest = batchedActions[0];
          expect(actionCollRequest.type).to.equal(REFERENCE_STATUS);
          expect(actionCollRequest.meta).to.deep.equal({ ...expectedMeta, tag: '*' });
          const expectedCollStatusPayload = {
            validationStatus: validationStatus.INVALID,
            busyStatus: busyStatus.IDLE,
          };
          expect(actionCollRequest.payload).to.deep.equal(expectedCollStatusPayload);

          const successAction = performedActions[1];
          expect(successAction.type).to.equal(REMOVE_REQUEST);
          expect(successAction.meta).to.deep.equal(expectedMeta);
        }).then(done).catch(done);
    });
    it('on REMOVE_ERROR', done => {
      const schema = 'schema_test';
      const deletedItem = {
        type: schema,
        id: '1',
      };

      const expectedPayload = { data: deletedItem };

      const expectedMeta = {
        source: JSON_API_RESOURCE,
        schema,
        tag: '',
      };
      const mockErrorAction = {
        type: REMOVE_ERROR,
        meta: expectedMeta,
        payload: expectedPayload,
        error: true,
      };

      const store = mockStore({});
      store.dispatch(actionPromise(mockErrorAction))
        .then(() => {
          const performedActions = store.getActions();
          expect(performedActions).to.have.length(2);

          const batchedActions = performedActions[0].payload;

          const actionCollRequest = batchedActions[0];
          expect(actionCollRequest.type).to.equal(REFERENCE_STATUS);
          expect(actionCollRequest.meta).to.deep.equal({ ...expectedMeta, tag: '*' });
          const expectedCollStatusPayload = {
            validationStatus: validationStatus.INVALID,
            busyStatus: busyStatus.IDLE,
          };
          expect(actionCollRequest.payload).to.deep.equal(expectedCollStatusPayload);

          const successAction = performedActions[1];
          expect(successAction.type).to.equal(REMOVE_ERROR);
          expect(successAction.meta).to.deep.equal(expectedMeta);
        }).then(done).catch(done);
    });
    it('on CREATE_REQUEST', done => {
      const schema = 'schema_test';
      const tag = 'tag_test';
      const expectedMeta = {
        source: JSON_API_RESOURCE,
        schema,
        tag,
      };

      const mockErrorAction = {
        type: CREATE_REQUEST,
        meta: expectedMeta,
        error: true,
      };

      const store = mockStore({});
      store.dispatch(actionPromise(mockErrorAction))
        .then(() => {
          const performedActions = store.getActions();
          expect(performedActions).to.have.length(2);

          const batchedActions = performedActions[0].payload;

          const actionCollStatus = batchedActions[0];
          expect(actionCollStatus.type).to.equal(REFERENCE_STATUS);
          expect(actionCollStatus.meta).to.deep.equal({ ...expectedMeta, tag: '*' });
          const expectedCollStatusPayload = {
            busyStatus: busyStatus.IDLE,
            validationStatus: validationStatus.INVALID,
          };
          expect(actionCollStatus.payload).to.deep.equal(expectedCollStatusPayload);

          const requestAction = performedActions[1];
          expect(requestAction.type).to.equal(CREATE_REQUEST);
          expect(requestAction.meta).to.deep.equal(expectedMeta);
        }).then(done).catch(done);
    });
    it('on CREATE_ERROR', done => {
      const schema = 'schema_test';
      const tag = 'tag_test';
      const expectedMeta = {
        source: JSON_API_RESOURCE,
        schema,
        tag,
      };

      const mockErrorAction = {
        type: CREATE_ERROR,
        meta: expectedMeta,
        error: true,
      };

      const store = mockStore({});
      store.dispatch(actionPromise(mockErrorAction))
        .then(() => {
          const performedActions = store.getActions();
          expect(performedActions).to.have.length(2);

          const batchedActions = performedActions[0].payload;

          const actionCollStatus = batchedActions[0];
          expect(actionCollStatus.type).to.equal(REFERENCE_STATUS);
          expect(actionCollStatus.meta).to.deep.equal({ ...expectedMeta, tag: '*' });
          const expectedCollStatusPayload = {
            busyStatus: busyStatus.IDLE,
            validationStatus: validationStatus.INVALID,
          };
          expect(actionCollStatus.payload).to.deep.equal(expectedCollStatusPayload);

          const requestAction = performedActions[1];
          expect(requestAction.type).to.equal(CREATE_ERROR);
          expect(requestAction.meta).to.deep.equal(expectedMeta);
        }).then(done).catch(done);
    });
    it('on UPDATE_REQUEST', done => {
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
        source: JSON_API_RESOURCE,
        schema,
        tag: '',
      };

      const mockErrorAction = {
        type: UPDATE_REQUEST,
        meta: expectedMeta,
        payload: expectedPayload,
        error: true,
      };

      const store = mockStore({});
      store.dispatch(actionPromise(mockErrorAction))
        .then(() => {
          const performedActions = store.getActions();
          expect(performedActions).to.have.length(2);

          const batchedActions = performedActions[0].payload;

          const actionCollStatusBusy = batchedActions[0];
          expect(actionCollStatusBusy.type).to.equal(REFERENCE_STATUS);
          expect(actionCollStatusBusy.meta)
            .to.deep.equal({ ...expectedMeta, tag: '*' });
          const expectedCollStatusBusyPayload = {
            busyStatus: busyStatus.IDLE,
            validationStatus: validationStatus.INVALID,
          };
          expect(actionCollStatusBusy.payload).to.deep.equal(expectedCollStatusBusyPayload);

          const actionUpdateRequest = performedActions[1];
          expect(actionUpdateRequest.type).to.equal(UPDATE_REQUEST);
          expect(actionUpdateRequest.meta).to.deep.equal(expectedMeta);
          expect(actionUpdateRequest.payload).to.deep.equal(expectedPayload);
        }).then(done).catch(done);
    });
    it('on UPDATE_ERROR', done => {
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
        source: JSON_API_RESOURCE,
        schema,
        tag: '',
      };

      const mockErrorAction = {
        type: UPDATE_ERROR,
        meta: expectedMeta,
        payload: expectedPayload,
        error: true,
      };

      const store = mockStore({});
      store.dispatch(actionPromise(mockErrorAction))
        .then(() => {
          const performedActions = store.getActions();
          expect(performedActions).to.have.length(2);

          const batchedActions = performedActions[0].payload;

          const actionCollStatusBusy = batchedActions[0];
          expect(actionCollStatusBusy.type).to.equal(REFERENCE_STATUS);
          expect(actionCollStatusBusy.meta)
            .to.deep.equal({ ...expectedMeta, tag: '*' });
          const expectedCollStatusBusyPayload = {
            busyStatus: busyStatus.IDLE,
            validationStatus: validationStatus.INVALID,
          };
          expect(actionCollStatusBusy.payload).to.deep.equal(expectedCollStatusBusyPayload);

          const actionUpdateRequest = performedActions[1];
          expect(actionUpdateRequest.type).to.equal(UPDATE_ERROR);
          expect(actionUpdateRequest.meta).to.deep.equal(expectedMeta);
          expect(actionUpdateRequest.payload).to.deep.equal(expectedPayload);
        }).then(done).catch(done);
    });
  });

  describe('Modification check cache', () => {
    it('set modified flag on rio actions', done => {
      const denormalizer = new ReduxApiStateDenormalizer();
      const invalidateModificationCache = sinon.spy(denormalizer, 'invalidateModificationCache');

      rio.setDenormalizer(denormalizer);

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
        source: JSON_API_RESOURCE,
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
          expect(invalidateModificationCache.called).to.be.true;
        }).then(done).catch(done);
    });

    it('set modified flag on internal rio action', done => {
      const denormalizer = new ReduxApiStateDenormalizer();
      const invalidateModificationCache = sinon.spy(denormalizer, 'invalidateModificationCache');

      rio.setDenormalizer(denormalizer);

      const schema = 'schema_test';
      const mockInvaliateAction = invalidate(schema);

      const store = mockStore({});
      store.dispatch(actionPromise(mockInvaliateAction))
        .then(() => {
          expect(invalidateModificationCache.called).to.be.true;
        }).then(done).catch(done);
    });

    it('ignore modified flag on 3rd party action', done => {
      const denormalizer = new ReduxApiStateDenormalizer();
      const invalidateModificationCache = sinon.spy(denormalizer, 'invalidateModificationCache');

      rio.setDenormalizer(denormalizer);

      const mockAction = {
        type: 'A',
      }

      const store = mockStore({});
      store.dispatch(actionPromise(mockAction))
        .then(() => {
          expect(invalidateModificationCache.called).to.be.false;
        }).then(done).catch(done);
    });
  });
});
