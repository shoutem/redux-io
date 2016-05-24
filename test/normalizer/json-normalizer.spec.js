import _ from 'lodash';
import { expect } from 'chai';
import { normalizeItem, normalizeCollection } from '../../src';
import {
  STATUS,
  createStatus,
  updateStatus,
} from '../../src/status';

const expectedNormalizedItem = {
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
const transformation = {
  relationshipProperties: {
    owners: 'owners',
    parent: 'parent',
  },
};

describe('json-normalizer', () => {
  it('normalize item', () => {
    const denormalizedItem = {
      id: 1,
      type: 'app.test',
      address: 'address1',
      numOfPeople: 22,
      owners: [
        {
          id: 1,
          type: 'app.owner',
          name: 'a',
        },
        {
          id: 2,
          type: 'app.owner',
          name: 'b',
        },
      ],
      parent: {
        id: 'a',
        type: 'app.owner',
        name: 'c',
      },
    };
    denormalizedItem[STATUS] = updateStatus(
      createStatus(),
      {
        transformation,
      }
    );

    const normalizedItem = normalizeItem(denormalizedItem);
    expect(normalizedItem).to.be.deep.equal(expectedNormalizedItem);
  });

  it('normalize item with missing relationship data', () => {
    const denormalizedItem = {
      id: 1,
      type: 'app.test',
      address: 'address1',
      numOfPeople: 22,
      owners: [
        {
          id: 1,
          type: 'app.owner',
          name: 'a',
        },
        {
          id: 2,
          type: 'app.owner',
          name: 'b',
        },
      ],
      parent: {
        id: 'a',
        type: 'app.owner',
        name: 'c',
      },
    };
    denormalizedItem[STATUS] = updateStatus(
      createStatus(),
      {
        transformation: {
          relationshipProperties: {
            owners: 'owners',
            parent: 'parent',
            children: 'children',
          },
        },
      }
    );

    const normalizedItem = normalizeItem(denormalizedItem);
    expect(normalizedItem).to.be.deep.equal(expectedNormalizedItem);
  });

  it('normalize collection', () => {
    const denormalizedItem = {
      id: 1,
      type: 'app.test',
      address: 'address1',
      numOfPeople: 22,
      owners: [
        {
          id: 1,
          type: 'app.owner',
          name: 'a',
        },
        {
          id: 2,
          type: 'app.owner',
          name: 'b',
        },
      ],
      parent: {
        id: 'a',
        type: 'app.owner',
        name: 'c',
      },
    };
    const denormalizedList = [
      Object.assign({}, denormalizedItem),
      Object.assign({}, denormalizedItem),
      Object.assign({}, denormalizedItem),
    ];

    denormalizedList.map(item => (
      item[STATUS] = updateStatus(
        createStatus(),
        {
          transformation: {
            relationshipProperties: {
              owners: 'owners',
              parent: 'parent',
            },
          },
        }
      )
    ));

    const normalizedList = normalizeCollection(denormalizedList);
    const expectedNormalizedList = [
      Object.assign({}, expectedNormalizedItem),
      Object.assign({}, expectedNormalizedItem),
      Object.assign({}, expectedNormalizedItem),
    ];
    expect(normalizedList).to.be.deep.equal(expectedNormalizedList);
  });
});
