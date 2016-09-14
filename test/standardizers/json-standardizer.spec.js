import _ from 'lodash';
import { expect } from 'chai';
import { Schema, arrayOf } from 'normalizr';
import { transform, inverse } from '../../src/standardizers/json-standardizer';

const transformationDescription = {
  relationshipProperties: {
    owners: 'owners',
    parent: 'parent',
  },
};

const article = new Schema('shoutem.articles');
const user = new Schema('shoutem.users');
const car = new Schema('shoutem.cars');

article.define({
  author: user,
  contributors: arrayOf(user)
});

user.define({
  myCar: car,
});

const originalItem = {
  id: 1,
  title: 'Some Article',
  author: {
    id: 7,
    name: 'Dan',
    myCar: {
      id: 2,
      name: "Merc"
    }
  },
  contributors: [{
    id: 10,
    name: 'Abe',
    myCar: {
      id: 3,
      name: "BMW"
    }
  }, {
    id: 15,
    name: 'Fred',
    myCar: {
      id: 4,
      name: "Porc"
    }
  }]
};

const transformedItem = {
  "data": [{
    "id": 1,
    "title": "Some Article",
    "author": 7,
    "contributors": [10, 15],
    "type": "shoutem.articles"
  }],
  "included": [{
    "id": 7,
    "name": "Dan",
    "myCar": 2,
    "type": "shoutem.users"
  }, {
    "id": 10,
    "name": "Abe",
    "myCar": 3,
    "type": "shoutem.users"
  }, {
    "id": 15,
    "name": "Fred",
    "myCar": 4,
    "type": "shoutem.users"
  }, {
    "id": 2,
    "name": "Merc",
    "type": "shoutem.cars"
  }, {
    "id": 3,
    "name": "BMW",
    "type": "shoutem.cars"
  }, {
    "id": 4,
    "name": "Porc",
    "type": "shoutem.cars"
  }]
};

describe('standardizer', () => {
  it('transform item', () => {
    const result = transform(originalItem, article);
    console.log(JSON.stringify(result.transformedObject));
    //expect(result.transformationDescription).to.be.deep.equal(transformationDescription);
    expect(result.transformedObject).to.be.deep.equal(transformedItem);
  });

  /*
  it('inverse transformation item', () => {
    const result = inverse(transformedItem, transformationDescription);
    expect(result).to.be.deep.equal(originalItem);
  });
  */
});
