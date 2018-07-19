# READ ME

[![npm version](https://badge.fury.io/js/%40shoutem%2Fredux-io.svg)](https://badge.fury.io/js/%40shoutem%2Fredux-io)

## redux-io

`redux-io` is library for data management of network data in `redux` and ease of data use in `react`. Consists of middleware, reducers, action creators and helpers that provide:

* [JSON-API](http://jsonapi.org/)
* normalized data in `redux`
* async CRUD operations with `redux` actions
* optimistic updates of redux
* denormalizing data for easier use in `react`
* data caching and supported compatibility with `reselect`
* simple and expandable network resource configuration
* data status, error handling and monitoring operations
* \[SOON\] JSON payloads with normalizr schemas

### Motivation

Redux is a great library, but it’s not a framework. It’s based on simple concepts that enable the freedom to build, but without clear patterns. But how are you going to manage network data and organize it in store, make async requests, normalize data, handle errors, cache data, monitor data statuses? At Shoutem we developed platform based on `react` ecosystem in which we use `redux` for managing data. We learned a lot about problems and discovered practices that give answers to above questions. All that is used in development of `redux-io` library that we use everyday and enables us powerful data management.

### Documentation

* [API Reference](https://github.com/shoutem/redux-io/tree/develop/docs/api)

### Getting started

Install `redux-io`:

```text
$ npm install --save @shoutem/redux-io
```

Import middlewares `apiMiddleware`, `apiStateMiddleware` and add them to your `createStore` in `applyMiddleware` function from `redux`. We are internally using \[`redux-api-middleware@2.0.0-beta.1`\] \([https://github.com/agraboso/redux-api-middleware/tree/next](https://github.com/agraboso/redux-api-middleware/tree/next)\) as library for async network requests, so that is the reason you need to add both middlewares respectively.

Example:

```javascript
import { applyMiddleware, compose, createStore } from 'redux';
import { apiMiddleware } from 'redux-api-middleware';
import { apiStateMiddleware } from '@shoutem/redux-io';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk';
import reducer from './reducers'

const logger = createLogger();

const store = createStore(
  reducer,
  applyMiddleware(thunk, apiMiddleware, apiStateMiddleware, logger)
);
```

And you are ready to start organizing state, configuring network resources, manage data with actions and use them in react components. Next section gives short intro in usage of redux-io in most common use cases.

### Usage

For example, you have [json-api](http://jsonapi.org/) API endpoint that enables you to fetch items of type `acme.items`. You want to get most popular items, so endpoint `http://api.test.com/items?sort=relevance` returns you list of items sorted by popularity:

```javascript
{
  "data": [
    {
      "type": "acme.items",
      "id": "1",
      "attributes": {
        "name": "Rocket",
      }
    },
    {
      "type": "acme.items",
      "id": "2",
      "attributes": {
        "name": "Helmet",
      }
    },
    ...
  ]
}
```

First you want to configure where fetched data will be placed in your state. Use `storage` as a normal reducer to define where in your state are instances of objects, and `collection` reducer to set place in the state for list holding ids of items that are popular. You are probably asking why do you need those two reducers, but idea is to keep data in redux state normalized. Normalization instances needs to be in one place in the state. However, you can reference it from mutliple parts in the state.

```javascript
import { storage, collection } from `redux-api-state`;

combineReducers({
  items: storage('acme.items'),
  popularItems: collection('acme.items', 'popularItems'),
})
```

After that, you only need to dispatch `find` action to fetch popular items from API. Find action is based on redux-api-middleware, and only needs to additional params `schema`, and `tag`. Schema defines in which `storage` will fetched data end up, and `tag` defines which `collection` will fetch ids of objects.

```javascript
import { find } from `redux-api-state`;

const config = {
  endpoint: 'http://api.test.com/items?sort=relevance',
  headers: {
    'Content-Type': 'application/vnd.api+json',
  },
};

dispatch(find(config, 'acme.items', 'popularItems'));
```

Upon dispatch, `find` will configure action by redux-api-middleware specification, and redux-api-middleware will

1. Dispatch REQUEST action
2. Make GET request on [http://api.test.com/items?sort=relevance](http://api.test.com/items?sort=relevance)
3. If request is successful dispatch SUCCESS action

You can see that it is by `redux-api-middleware` [lifecycle](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/www.test.com). After which redux-api-state will listen on SUCCESS action and will act as:

1. Validate SUCCESS action
2. Unpack payload
3. For each item in data will dispatch OBJECT\_FETCHED
4. Storage reducer will listen for OBJECT\_FETCH and add it into map in state
5. Dispatch COLLECTION\_FETCHED
6. Collection reducer will listen for COLLECTION\_FETCHED and add items id into list
7. Call next\(action\) for success action from redux-api-middleware

Storage reducer only adds an item if action is valid and schema value is equal to the action's schema. Collection reducer performs the same, but checks also `tag` value. That enable us to have multiple collections of objects, but only one storage with instances of objects. Here is the state after app finished fetching:

```javascript
state: {
  items: {
    1: {
      "type": "acme.items",
      "id": "1",
      "attributes": {
        "name": "Rocket",
      }
    },
    2: {
      "type": "acme.items",
      "id": "2",
      "attributes": {
        "name": "Helmet",
      }
    },
  },
  popularItems: [1, 2, 3, ... ],
}
```

### Tests

```text
$ npm install && npm test
```

### Acknowledgements

The package is based on concepts from [Željko Rumenjak](https://github.com/zrumenjak).

