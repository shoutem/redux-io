import _ from 'lodash';
import { expect } from 'chai';
import { normalize, schema, denormalize } from 'normalizr';
import configureMockStore from 'redux-mock-store';
import sinon from 'sinon';
import { normalize as jsonApiNormalize } from '../../src/normalizer';
import { jsonMiddleware } from '../../src/middlewares';

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

const normalizedData = {
  result: {
    id: '123',
    type: 'articles',
  },
  entities: {
    articles: { 
      '123': { 
        id: '123',
        type: 'articles',
        author: {
          id: '1',
          type: 'users',
        },
        title: 'My awesome blog post',
        comments: [{
          id: '324',
          type: 'comments',
        }],
      },
    },
    users: {
      '1': { id: '1', type: 'users', name: 'Paul' },
      '2': { id: '2', type: 'users', name: 'Nicole' },
    },
    comments: {
      '324': {
        id: '324',
        type:'comments',
        commenter: {
          id: '2',
          type: 'users',
        },
      },
    }
  }
};

const denormalizedData = {
  id: '123',
  author: '1',
  title: 'My awesome blog post',
  comments: ['324'],
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
  let mockStore = configureMockStore([jsonMiddleware]);
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

  it('changes json playload to json-api', () => {
    // TODO: write test
  });
});