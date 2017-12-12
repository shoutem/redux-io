import _ from 'lodash';
import { expect } from 'chai';
import { normalize, schema, denormalize } from 'normalizr';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import sinon from 'sinon';
import { normalize as jsonApiNormalize } from '../../src/normalizer';
import { jsonMiddleware } from '../../src/middlewares';
import { JsonSerializer } from '../../src/serialization';
import rio, {
  JSON_API_SOURCE,
  LOAD_SUCCESS,
} from '../../src';

const originalData = {
  id: '123',
  author: {
    id: '1',
    name: 'Paul'
  },
  title: 'My awesome blog post',
  comments: [{
    id: '324',
    commenter: {
      id: '2',
      name: 'Nicole'
    },
  }],
};

const expectedJsonApiPayload = {
  data: {
    id: '123',
    type: 'articles',
    relationships: {
      author: {
        data: {
          id: '1',
          type: 'users'
        }
      },
      comments: {
        data: [
          {
            id: '324',
            type: 'comments'
          }
        ]
      }
    },
    attributes: {
      title: 'My awesome blog post'
    }
  },
  included: [
    {
      id: '1',
      type: 'users',
      attributes: {
        name: 'Paul'
      }
    },
    {
      id: '2',
      type: 'users',
      attributes: {
        name: 'Nicole'
      }
    },
    {
      id: '324',
      type: 'comments',
      relationships: {
        commenter: {
          data: {
            id: '2',
            type: 'users'
          }
        }
      }
    }
  ]
};

const userSchema = new schema.Entity('users');
const commentSchema = new schema.Entity(
  'comments',
  {
    commenter: userSchema,
  },
);
const articleSchema = new schema.Entity(
  'articles',
  { 
    author: userSchema,
    comments: [ commentSchema ]
  },
);

describe('json middleware', () => {
  let mockStore = configureMockStore([thunk, jsonMiddleware]);
  const actionPromise = action => dispatch => (
    new Promise((resolve) => {
      resolve();
    }).then(dispatch(action))
  );

  beforeEach(() => {
    sinon.spy(console, 'error');
  });

  afterEach(() => {
    mockStore = configureMockStore([jsonMiddleware]);
    console.error.restore();
  });

  it('changes json playload to json-api', done => {
    const schema = 'schema_test';
    const tag = 'tag_test';

    rio.registerResource({
      schema,
      request: {
        endpoint: '',
        headers: {},
      },
      serializer: new JsonSerializer(articleSchema),
    });
    
    const meta = {
      source: 'json',
      schema,
      tag,
    };

    const mockSuccessAction = {
      type: LOAD_SUCCESS,
      meta,
      payload: originalData,
    };

    const expectedMeta = {
      source: JSON_API_SOURCE,
      schema,
      tag,
    };

    const store = mockStore({});
    store.dispatch(actionPromise(mockSuccessAction))
      .then(() => {
        const performedActions = store.getActions();
        expect(performedActions).to.have.length(1);

        const successAction = performedActions[0];

        expect(successAction.type).to.equal(LOAD_SUCCESS);
        expect(successAction.meta).to.deep.equal(expectedMeta);
        expect(successAction.payload).to.deep.equal(expectedJsonApiPayload);
      }).then(done).catch(done);
  });
});