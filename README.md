redux-api-state
====================

Library for easy data managing between api and redux store. Comes with action creators, reducers, and middleware.

## Table of contents

1. [Introduction](#introduction)
  - [A simple example](#a-simple-example)
2. [Installation](#installation)
3. [Usage](#usage)
  - [Defining the API call](#defining-the-api-call)
  - [Defining the store reducers](#defining-the-store-reducers)
  - [Actions without API calls](#actions-without-api-calls)
5. [History](#history)
6. [Tests](#tests)
7. [License](License)
8. [Acknowledgements](Acknowledgements)

## Introduction

Library consists of middleware, reducers and action creators that enable simple handling of data in CRUD operations
with API. Library uses [redux-api-middleware](http://www.test.com) for async api calls. Action creators and middleware
are wrapping redux-api-middleware, allowing you to have same experience as with using redux-api-middleware. Read more
about using [redux-api-middleware](http://www.test.com).

All you need to do is use `find` or `create` action creators to dispatch API calls, and use `storage` and `collection`
reducers to handle data in the redux state.

### A simple example

For example, you have [json-api](http://jsonapi.org/) API endpoint that enables you to fetch items of type `acme.items`.
You want to get most popular items, so endpoint `http://api.test.com/items?sort=relevance` returns you list of items sorted by popularity:

```json
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

First you want to configure where fetched data will be placed in your state. Use `storage` as a normal reducer to define
where in your state are instances of objects , and 'collection' reducer to set place in the state for list holding ids
of items that are popular. You are probably asking why do you need those two reducers, but idea is to keep data in redux
state normalized. Normalization instances needs to be in one place in the state. However, you can reference it from
mutliple parts in the state.

```js
import { storage, collection } from `redux-api-state`;

combineReducers({
  items: storage('acme.items'),
  popularItems: collection('acme.items', 'popularItems'),
})
```

After that, you only need to dispatch `find` action to fetch popular items from API. Find action is based on
redux-api-middleware, and only needs to additional params `schema`, and `tag`. Schema defines in which `storage` will
fetched data end up, and `tag` defines which `collection` will fetch ids of objects.

```js
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
2. Make GET request on http://api.test.com/items?sort=relevance
3. If request is successful dispatch SUCCESS action

You can see that it is by `redux-api-middleware` [lifecycle](www.test.com). After which redux-api-state will listen on
SUCCESS action and will act as:

1. Validate SUCCESS action
2. Unpack payload
3. For each item in data will dispatch OBJECT_FETCHED
4. Storage reducer will listen for OBJECT_FETCH and add it into map in state
5. Dispatch COLLECTION_FETCHED
6. Collection reducer will listen for COLLECTION_FETCHED and add items id into list
7. Call next(action) for success action from redux-api-middleware

Storage reducer only adds an item if action is valid and schema value is equal to the action's schema. Collection
reducer performs the same, but checks also `tag` value. That enable us to have multiple collections of objects, but only
one storage with instances of objects. Here is the state after app finished fetching:

```js
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

## Installation

`redux-api-state` is available on [npm](https://www.npmjs.com/package/redux-api-state).

```
$ npm install redux-api-state --save
```

**Apply it to the store after redux-api-middleware**. For more information (for example, on how to add several
middlewares), consult the [Redux documentation](http://redux.js.org).

```js
import { apiMiddleware } from 'redux-api-middleware';
import { apiStateMiddleware } from 'redux-api-state';

...
applyMiddleware(apiMiddleware, apiStateMiddleware)(store);
...
```

## Usage

### Defining the API call

#### `find(config, schema, tag='')`
Action creator used to fetch data from api (GET). Config argument is based on CALL_API configuration from
redux-api-middleware, allowing full customization expect types part of the configuration. Find function expects
schema name of data which correspond with storage reducer with same schema value. Tag argument is optional, but when
used allows your collection with same tag value to respond to the received data.
##### `config`
An object that is based on redux-api-middleware [CALL_API] configuration. You can configure it as you like, but `types`
will be overwritten by `find`.
##### `schema`
Type of data you are fetching must be defined in api endpoint json-api as a data type. It must correspond with `storage`
`schema` argument so `redux-api-state` can place fetched data into the right location in the redux state.
##### `tag`
Use it to connect action with `collection` reducer. Ids of fetched data will be placed in collections with the same `tag`
value. The tag should be unique per `collection`. The tag is an optional argument, for cases when you don't need
collection in the state.

#### `create(config, schema, item)`
Action creator used to create an item on api (POST). Config argument is based on CALL_API configuration from
redux-api-middleware, allowing full customization expect types part of the configuration. Create function expects
schema name of data which correspond with storage reducer with the same schema value. Item argument holds the object that
you want to create on api. The tag is not needed because all collections with the same schema will be invalidated upon
the successful action of creating an item on api.
##### `config`
An object that is based on redux-api-middleware [CALL_API] configuration. You can configure it as you like, but `types`
will be overwritten by `find`.
##### `schema`
Type of data you are fetching must be defined in the api endpoint json-api as a data type. Must correspond with `storage`
`schema` argument so `redux-api-state` can place fetched data into the right location in the redux state.
##### `item`
Plain JS object you wish to create on API endpoint.

### Defining the store reducers
#### `storage(schema, initialState={})`
Storage is generic storage reducer that enables the creation of typed storage reducers that are handling specific
OBJECT_ type actions. Holds map of objects, where `key` is object id and `value` instance of an object. You should hold
all objects of one schema in one storage. On fetch and create storage will always merge new object into existing map,
overwriting possible existing object.
##### `schema`
Type of data that is stored in the map. Based on schema `storage` will be held responsible for handling dispatched
actions from `redux-api-state`.
##### `initialState`
If you are passing custom initial state, you should create a map where `key` is object id and `value` instance of
an object.

#### `collection(schema, tag, initialState=[])`
Collection is generic collection reducer that enables creating typed & named collection reducers that are handling
specific
COLLECTION_ type actions with a specific tag. Holds list of object ids. You should hold all ids of one schema with the
unique tag in one collection. On fetch collection will always overwrite existing state with data in action, and on
create it will reset state to initial state (empty list).
##### `schema`
Type of data which ids are stored in the list. Based on schema `collection` will be held responsible for handling
dispatched actions from `redux-api-state`.
##### `tag`
The tag is a custom string that defines `collection` responsibility of handling action dispatched from
`redux-api-state`. Only if schema and tag are equal as in the dispatched action, `collection` will process action.
Tag value pairs action creators like `find` with `collection`.
##### `initialState`
If you are passing custom initial state, you should create list holding ids of objects.

### Custom api calls

Write your custom api calls...

### Actions without API calls
You can use actions that bypass redux-api-middleware and api calls. It's appropriate if you already have data and need to
put them into state via `storage` and `collection` reducers.

#### `loaded(payload, tag = '')`
Action creator used to store payload not fetched with `find` action creator. Loaded expects payload to be the json-api data type.
Its `data.type` is later used as `schema` in corespondention with storage and/or collection reducers. 
Tag argument is optional, but when used allows your collection with same tag value to respond to the received data.
##### `payload`
Required argument which is an object of the json-api type where its type would be used as `schema` meta parameter in
LOAD_SUCCESS and OBJECT_FETCHED action types.
##### `tag`
Use it to connect action with `collection` reducer. Ids of fetched data will be placed in collections with the same `tag`
value. The tag should be unique per `collection`. The tag is an optional argument, for cases when you don't need
collection in the state.

## Reference

### Exports

The following objects are exported by `redux-api-state`.

#### `apiStateMiddleware`

The Redux api state middleware itself.

#### `storage(schema, initialState={})`

A reducer for storing object instances of the specific schema.

#### `collection(schema, tag, initialState=[])`

A reducer for holding object ids for specific schema and tag.

#### `find(config, schema, tag='')`

Action creator for fetching data from API. Based on redux-api-middleware `CALL_API`.

#### `create(config, schema, item)`

Action creator for creating data on API. Based on redux-api-middleware `CALL_API`.

####  `loaded(payload, tag = '')`

Action creator for passing payload directly to redux-api-state, without API calls.

## Tests

```
$ npm install && npm test
```

## License

MIT

## Acknowledgements

The package is based on ideas from [Željko Rumenjak](https://github.com/zrumenjak).
