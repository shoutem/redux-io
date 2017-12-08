import _ from 'lodash';
import { expect } from 'chai';
import { normalizeItem, normalizeCollection, shouldNormalize } from '../../src';
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
  relationships: {
    owners: { type: 'app.owner' },
    parent: { type: 'app.owner' },
  },
};

describe('json-normalizer with defined schema', () => {
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

  it('normalize item with external schema', () => {
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
      createStatus()
    );

    const normalizedItem = normalizeItem(denormalizedItem, transformation);
    expect(normalizedItem).to.be.deep.equal(expectedNormalizedItem);
  });

  it('normalize item with external schema priority', () => {
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
        transformation:  {
          relationships: {
            test: { type: 'test2' },
          },
        }
      }
    );

    const normalizedItem = normalizeItem(denormalizedItem, transformation);
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
          relationships: {
            owners: { type: 'app.owner' },
            parent: { type: 'app.owner' },
            children: { type: 'app.owner' },
          },
        },
      }
    );

    const normalizedItem = normalizeItem(denormalizedItem);
    expect(normalizedItem).to.be.deep.equal(expectedNormalizedItem);
  });

  it('normalize item with null relationship data', () => {
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
      parent: null,
    };
    denormalizedItem[STATUS] = updateStatus(
      createStatus(),
      {
        transformation: {
          relationships: {
            owners: { type: 'app.owner' },
            parent: { type: 'app.owner' },
          },
        },
      }
    );

    const expectedNormalizedItemWithNoParent = _.cloneDeep(expectedNormalizedItem);
    expectedNormalizedItemWithNoParent.relationships.parent.data = null;

    const normalizedItem = normalizeItem(denormalizedItem);
    expect(normalizedItem).to.be.deep.equal(expectedNormalizedItemWithNoParent);
  });

  it('normalize item with empty array relationship data', () => {
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
      parent: [],
    };
    denormalizedItem[STATUS] = updateStatus(
      createStatus(),
      {
        transformation: {
          relationships: {
            owners: { type: 'app.owner' },
            parent: { type: 'app.owner' },
          },
        },
      }
    );

    const expectedNormalizedItemWithNoParent = _.cloneDeep(expectedNormalizedItem);
    expectedNormalizedItemWithNoParent.relationships.parent.data = [];

    const normalizedItem = normalizeItem(denormalizedItem);
    expect(normalizedItem).to.be.deep.equal(expectedNormalizedItemWithNoParent);
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
            relationships: {
              owners: { type: 'app.owner' },
              parent: { type: 'app.owner' },
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
    delete normalizedList[STATUS];
    normalizedList.map(x => delete x[STATUS]);
    expect(normalizedList).to.be.deep.equal(expectedNormalizedList);
  });
});


describe('json-normalizer with no explicit schema', () => {
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

    const normalizedItem = normalizeItem(denormalizedItem);
    expect(normalizedItem).to.be.deep.equal(expectedNormalizedItem);
  });

  it('normalize item with empty array relationship data', () => {
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
      parent: [],
    };

    const expectedNormalizedItemWithNoParent = _.cloneDeep(expectedNormalizedItem);
    expectedNormalizedItemWithNoParent.relationships.parent.data = [];

    const normalizedItem = normalizeItem(denormalizedItem);
    expect(normalizedItem).to.be.deep.equal(expectedNormalizedItemWithNoParent);
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

    const normalizedList = normalizeCollection(denormalizedList);
    const expectedNormalizedList = [
      Object.assign({}, expectedNormalizedItem),
      Object.assign({}, expectedNormalizedItem),
      Object.assign({}, expectedNormalizedItem),
    ];
   
    expect(normalizedList).to.be.deep.equal(expectedNormalizedList);
  });
});
