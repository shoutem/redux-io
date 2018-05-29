# redux-io

[![npm version](https://badge.fury.io/js/%40shoutem%2Fredux-io.svg)](https://badge.fury.io/js/%40shoutem%2Fredux-io)

`redux-io` is library for **data management of network data** in `redux` and ease of data use in `react`. Consists of middleware, reducers, action creators and helpers that provide:

* [**JSON-API**](http://jsonapi.org/) support
* **normalized** data in `redux` state
* **async** CRUD operations with `redux` actions
* **optimistic** updates of redux state
* **denormalizing** data selectors for easier use in `react`
* **data caching** and supported compatibility with `reselect`
* **simple** and **expandable** network resource configuration
* data **status**, **error** handling and **monitoring** operations
* \[SOON\] JSON payloads with normalizr schemas

## Motivation

Redux is a great library, but it’s not a framework. It’s based on simple concepts that enable the freedom to build, but without clear patterns. **How are you going to manage network data and organize it in store state, make async requests, normalize data, handle errors, cache data and monitor data status?** At Shoutem we developed platform based on `react` ecosystem in which we use `redux` for managing data. We learned a lot about problems and discovered practices that give answers to above questions. All that was used in development of `redux-io` library to enable powerful data management.

## Getting started

### Install

```text
$ npm install --save @shoutem/redux-io
```

or

```text
$ yarn add @shoutem/redux-io
```

### Usage

Let imagine we want to fetch data from server when user clicks on button and render received data in component. For start we create a component with button that has an `onPress` handler.

#### `AuthorList.js`

```javascript
class AuthorList extends Component {
  ...
  handleLoadClick() {
    const { dispatch, loadAuthors } = this.props;
    dispatch(loadAuthors());  
  }
  ... 
}
```

On click `AuthorList` dispatches action `loadAuthors` that defines how to fetch [author data](http://jsonapiplayground.reyesoft.com/v2/authors) from server. Function `find` returns thunk action that we configured to fetch data from `endpoint` .

#### `actions.js`

```javascript
import { find } from '@shoutem/redux-io';

export function loadAuthors() {
  const config = {
    schema: "authors",
    request: {
      endpoint: 'http://jsonapiplayground.reyesoft.com/v2/authors',
    },
  };

  return find(config);
}
```

Action describes how to fetch authors but we need to configure `redux-io` to properly run it. Our middleware rely on `redux-thunk` and `redux-api-middleware` to enable async flows and fetching data.

#### `main.js`

```javascript
import { applyMiddleware, compose, createStore } from 'redux';
import { apiMiddleware } from 'redux-api-middleware';
import { apiStateMiddleware } from '@shoutem/redux-io';
import thunk from 'redux-thunk';
import reducer from './reducers';

const store = createStore(
  reducer,
  applyMiddleware(thunk, apiMiddleware, apiStateMiddleware)
);
```

To store received data and data metadata we don't need to implement our own custom reducers. Instead we use predefined `storage` and `collection` reducers, one to keep normalized object instances, and other to keep objects index.

#### `reducer.js`

```javascript
import { combineReducers } from 'redux';
import { storage, collection } from '@shoutem/redux-io';

export default combineReducers({
  authors: combineReducers({  
    storage: storage('authors'),
    all: collection('authors'),
  }),
});
```

Back to `AuthorList` component we want to render list of authors. We will use selectors to denormalize data from our reducers and pass it as props to component.

#### `AuthorList.js`

```javascript
import { connect } from 'react-redux';
import { getCollection } from '@shoutem/redux-io';

...
function mapStateToProps(state) {
  return {
    authors: getCollection(state.authors.all, state),   
  };
}
...

export default connect(mapStateToProps, mapDispatchToProps)(AuthorList);
```

## Documentation

* [API Reference](https://github.com/shoutem/redux-io/tree/develop/docs/api)

## Tests

```text
$ npm install && npm test
```

## Acknowledgements

The package is based on concepts from Željko Rumenjak, Vedran Ivanac and Luka Bracanovic.

