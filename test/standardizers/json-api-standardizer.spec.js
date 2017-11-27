import _ from 'lodash';
import { expect } from 'chai';
import { transform, inverse } from '../../src/standardizers/json-api-standardizer';

const originalItem = {
  id: 1,
  type: 'app.test',
  attributes: {
    address: 'address1',
    numOfPeople: 22,
  },
  relationships: {
    owners: {
      data: [
        {
          id: 1,
          type: 'app.owner',
        },
        {
          id: 2,
          type: 'app.owner',
        },
      ],
    },
    parent: {
      data: {
        id: 'a',
        type: 'app.owner',
      },
    },
  },
};
const transformedItem = {
  id: 1,
  type: 'app.test',
  attributes: {
    address: 'address1',
    numOfPeople: 22,
  },
  relationships: {
    owners: {
      data: [
        {
          id: 1,
          type: 'app.owner',
        },
        {
          id: 2,
          type: 'app.owner',
        },
      ],
    },
    parent: {
      data: {
        id: 'a',
        type: 'app.owner',
      },
    },
  },
};
const schema = {
  relationships: {
    owners: { type: 'app.owner' },
    parent: { type: 'app.owner' },
  },
  type: 'app.test',
};

describe('standardizer', () => {
  it('transform item', () => {
    const result = transform(originalItem);
    expect(result.schema).to.be.deep.equal(schema);
    expect(result.object).to.be.deep.equal(transformedItem);
  });

  it('inverse transformation item', () => {
    const result = inverse(transformedItem, schema);
    expect(result).to.be.deep.equal(originalItem);
  });
});
