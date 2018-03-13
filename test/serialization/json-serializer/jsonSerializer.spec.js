import _ from 'lodash';
import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import { normalize, schema, denormalize } from 'vedrani-json-api-normalizr';
import { normalize as jsonApiNormalize } from '../../../src/normalizer';
import { JsonSerializer } from '../../../src/serialization';
import issuesData from './issuesData';
import expectedIssuesData from './expectedIssuesData';
import expectedDeserializedIssuesData from './expectedDeserializedIssuesData';

const originalArticleData = {
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

const normalizedArticleData = {
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

const articleUserSchema = new schema.Entity('users');
const articleCommentSchema = new schema.Entity(
  'comments',
  {
    commenter: articleUserSchema,
  },
);
const articleSchema = new schema.Entity(
  'articles',
  {
    author: articleUserSchema,
    comments: [ articleCommentSchema ]
  },
);

describe('jsonSerializer', () => {
  it('normalize data with normalizr', () => {
    const result = normalize(originalArticleData, articleSchema);
    expect(result).to.be.deep.equal(normalizedArticleData);
  });

  it('serilize data to json-api', () => {
    const result = normalize(originalArticleData, articleSchema);
    expect(result).to.be.deep.equal(normalizedArticleData);

    const article = result.entities.articles['123'];

    const articleJsonApi = jsonApiNormalize(article);

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

  it('denormlize with normalizr', () => {
    const result = denormalize('123', articleSchema, _.pick(normalizedArticleData.entities, 'articles'));

    const denormalizedData = {
      id: '123',
      author: '1',
      title: 'My awesome blog post',
      comments: ['324'],
    };

    expect(result).to.be.deep.equal(denormalizedData);
  });
});

export const userSchema = new schema.Entity('users');
export const labelSchema = new schema.Entity('labels');
export const milestoneSchema = new schema.Entity('milestones', {
  creator: userSchema
});
export const issueSchema = new schema.Entity('issues', {
  assignee: userSchema,
  assignees: [ userSchema ],
  labels: [ labelSchema ],
  milestone: milestoneSchema,
  user: userSchema,
});
export const pullRequestSchema = new schema.Entity('pullRequests', {
  assignee: userSchema,
  assignees: [ userSchema ],
  labels: [ labelSchema ],
  milestone: milestoneSchema,
  user: userSchema,
});
export const issueOrPullRequestSchema = new schema.Array({
  issues: issueSchema,
  pullRequests: pullRequestSchema
}, (entity) => entity.pull_request ? 'pullRequests' : 'issues');

// https://api.github.com/repos/paularmstrong/normalizr/issues
describe('jsonSerializer with Github issues API', () => {
  it('normalize data with normalizr', () => {
    const result = normalize(issuesData, issueOrPullRequestSchema);

    // use it to refresh expected normalizr normalized data
    //const out = JSON.stringify(result, null, 2);
    //fs.writeFileSync(path.resolve(__dirname, './expectedIssuesData.json'), out);

    expect(result).to.be.deep.equal(expectedIssuesData);
  });

  it('deserilize data to json-api', () => {
    const serializer = new JsonSerializer(issueOrPullRequestSchema);
    const result = serializer.deserialize(issuesData);

    // use it to refresh expected seriazlied data
    // const out = JSON.stringify(result, null, 2);
    // fs.writeFileSync(path.resolve(__dirname, './expectedDeserializedIssuesData.json'), out);

    // TODO: verify expectedDeserializedIssuesData (deductive relationships)
    expect(result).to.be.deep.equal(expectedDeserializedIssuesData);
  });

/*
  it('denormlize with normalizr', () => {
    const result = denormalize('123', articleSchema, _.pick(normalizedArticleData.entities, 'articles'));

    const denormalizedData = {
      id: '123',
      author: '1',
      title: 'My awesome blog post',
      comments: ['324'],
    };

    expect(result).to.be.deep.equal(denormalizedData);
  });
  */
});
