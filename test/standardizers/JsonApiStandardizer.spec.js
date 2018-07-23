import _ from 'lodash';
import { expect } from 'chai';
import JsonApiStandardizer from '../../src/standardizers/JsonApiStandardizer';

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
    const standardizer = new JsonApiStandardizer();
    const result = standardizer.transform(originalItem);
    expect(result.schema).to.be.deep.equal(schema);
    expect(result.object).to.be.deep.equal(transformedItem);
  });

  it('inverse transformation item', () => {
    const standardizer = new JsonApiStandardizer();
    const result = standardizer.inverse(transformedItem, schema);
    expect(result).to.be.deep.equal(originalItem);
  });
});
