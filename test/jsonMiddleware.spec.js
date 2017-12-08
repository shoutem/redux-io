import _ from 'lodash';
import { expect } from 'chai';
import { normalize, schema, denormalize } from 'normalizr';
import { normalize as jsonApiNormalize } from '../src/normalizer';

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
  it('normalize data', () => {
    const result = normalize(originalData, articleSchema);
    expect(result).to.be.deep.equal(normalizedData);
  });

  it('normalize data to json-api', () => {
    const result = normalize(originalData, articleSchema);
    expect(result).to.be.deep.equal(normalizedData);

    const article = result.entities.articles['123'];

    const articleJsonApi = jsonApiNormalize(article);
    console.log(JSON.stringify(articleJsonApi));

    const expectedArticleJsonApi = { 
      id: '123',
      type: 'articles',
      attributes: {
        title: 'My awesome blog post',
      },
      relationships: {
        author: {
          data: {
            id: '1',
            type: 'users',
          },
        },
        comments: {
          data: [{
            id: '324',
            type: 'comments',
          }],
        },
      },
    };
    expect(articleJsonApi).to.be.deep.equal(expectedArticleJsonApi);
  });


  it('normalize payload to json-api payload', () => {
    const result = normalize(originalData, articleSchema);
    expect(result).to.be.deep.equal(normalizedData);

    const article = result.entities.articles['123'];

    const articleJsonApi = jsonApiNormalize(article);
    console.log(JSON.stringify(articleJsonApi));

    const expectedArticleJsonApi = { 
      id: '123',
      type: 'articles',
      attributes: {
        title: 'My awesome blog post',
      },
      relationships: {
        author: {
          data: {
            id: '1',
            type: 'users',
          },
        },
        comments: {
          data: [{
            id: '324',
            type: 'comments',
          }],
        },
      },
    };
    expect(articleJsonApi).to.be.deep.equal(expectedArticleJsonApi);
  });

  it('denormalize', () => {
    const result = denormalize('123', articleSchema, _.pick(normalizedData.entities, 'articles'));
    expect(result).to.be.deep.equal(denormalizedData);
  });
});