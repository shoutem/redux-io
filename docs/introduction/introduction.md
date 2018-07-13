# Beginner tutorial

### Objective

Objective of this tutorial is to cover basic `redux-io` concepts through simple library app example. Example cover creation of simple web application that manages authors and their books.  You can find this [example on CodeSandbox](https://codesandbox.io/s/n308m1l89l), this is an online editor that lets you play with examples online.

### The initial setup

First, let's create empty react project with [create-react-app](https://github.com/facebook/create-react-app).

```
$ npx create-react-app my-library-app
```

Run following command in terminal to add `redux-io` to project along `redux`.

```text
$ npm install --save @shoutem/redux-io react-redux redux
```

For sake of tutorial add other packages that will help us with building simple web app. Note that this packages are only needed for tutorial.

```text
$ npm install --save lodash object-diff redux-form redux-logger redux-thunk
```

To start app run

```
$ npm run start
```

Ok, so we are ready to start building library app.

### Configure redux-io

We initialized project and installed `redux-io` but before we start using it we need to configure it. We need to configure redux store and:

- add middlewares to redux store with `applyMiddleware`
- create root reducer with applied `enableRio` higher order function

Create a file `configureStore.js` with following code:

```jsx
import { createStore, applyMiddleware } from "redux";
import { apiMiddleware } from "redux-api-middleware";
import { apiStateMiddleware } from "@shoutem/redux-io";
import thunk from "redux-thunk";
import logger from "redux-logger";
import rootReducer from "./reducers";

export default function configureStore() {
  return createStore(
    rootReducer,
    applyMiddleware(thunk, apiMiddleware, apiStateMiddleware, logger)
  );
}

```

In file we defined function `configureStore` that returns instance of redux store. We passed middlewares and root reducer (we still need to define it in next steps) to `createStore`. Note that in `applyMiddleware` we passed middlewares `apiMiddleware`, `apiStateMiddleware` after `thunk` . It is important to keep them in that order to keep `redux-io` working properly.

`redux-io` internally use  [`redux-api-middleware`](https://github.com/agraboso/redux-api-middleware) library for doing async API requests with `fetch`. It basically provides parameterized [RSAA](https://github.com/agraboso/redux-api-middleware#redux-standard-api-calling-actions) redux actions, process them with middleware and adds additional features:

-  `apiMiddleware` - makes fetch requests to API based on RSAA actions
-  `apiStateMiddleware` - listens for RSAA actions and process them

To create redux store we also need to pass reducer, so next step is to create `reducers.js` file and define reducer:

```jsx
import { combineReducers } from 'redux';
import { enableRio } from '@shoutem/redux-io';

const mainReducer = combineReducers({
  // TODO: define reducers
});

// compose reducer with rio capability
export default enableRio(mainReducer);

```

You can define [reducers](https://redux.js.org/basics/reducers) in any way that `redux` suggest, there is no restrictions, only important part is to compose it with `enableRio(reducer, options = {})`. It enables `redux-io` capabilities to properly denormalize and cache data, to batch multiple actions and configure library.

Last step in configuration is connect `redux` store with `react` in `index.js` file:

```jsx
import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import configureStore from "./configureStore";

const store = configureStore();

const App = () => (
  <Provider store={store}>
    <div>
      <p>Example from redux-io documentation</p>
    </div>
  </Provider>
);

render(<App />, document.getElementById("root"));
```

Now we are ready to implement managing of authors in our library app. 

### Let's fetch some authors

For this tutorial we use [jazer.io](https://docs.jazer.io/getting-started/index.html) database-as-a-service that supports [json:api](http://jsonapi.org/) standard. On jazer we already defined `library` project and created `authors` resource so we can start immediatly with making requests to API. Documentation about managing resources on jazer.io can be found [here](https://docs.jazer.io/resources/index.html). Note: `redux-io` is currently primarily focused on `json:api` standard.

In next couple of steps we will define `redux` actions, reducers and selectors for handling `author` resource and connect it to `react` components where we will render fetched authors in simple table using `react-bootstrap`.

First let's define `actions.js` with registration of `authors` resource and definition of `loadAuthors` actions:

```javascript
import rio, { find } from '@shoutem/redux-io';

// jazer.io provides access data for each request for security reasons
const API_KEY = '$2a$11$c2LBX1o1xuelGO5lY5bmcuuFKqDHnjRMd.1Eit/fPRT.cwV6vu/ve';
const APPLICATION_ID = '5b082d2c2c387e4de3ee43c4';

// register author resource by defining schema, endpoint and headers
rio.registerResource({
  schema: 'authors',
  request: {
    endpoint: 'https://api.jazer.io/resources/authors{/authorId}',
    headers: {
      Accept: 'application/vnd.api+json',
      'api-key': API_KEY,
      'application-id': APPLICATION_ID,
    },
  },
});

// redux action for loading all authors 
export function loadAuthors() {
  return find('authors');
}
```

Here we did a couple of things, we described our `authors` resource with `schema` name and definition of `request` url and headers. `redux-io` has default export  `rio` which is singleton object representing `redux-io` as library. One of methods is `registerResource` that expects definition of resource which we can later reference in other cases just by providing `schema` string. 

Also we defined `loadAuthors` function that encapsulates `find('authors')` action creator for convinient usage in other parts of app. `find` action creator in background defines integration with `redux-api-middleware` and `redux-io` internals by returning thunk function ready for dispatching. Dispatched action will result in fetch request to server and actions that will in the end result in storing authors into redux state.   In this example we will not bother with other arguments of `find` and leave it for other sections of documentation.

But before we dispatch action, let's define reducers that will listen for appropriate actions and store fetched authors into redux state. Modify file `reducers.js` with:

```javascript
...
import { enableRio, storage, collection } from '@shoutem/redux-io';

const mainReducer = combineReducers({
  authors: combineReducers({
    storage: storage('authors'),
    all: collection('authors'),
  }),
});
...
```

Here we imported `storage` and `collection` reducer creators from `redux-io` and created reducers for schema `authors`.  You are probably thinking why do we need two reducers and where is all the reducer code? Answer is simple, `json:api` enables us to work with normalized data, so for each schema we want to have in state we define those reducers or more. 

- `storage` 
  - Map of objects with defined `schema` and `id` as key
  - One instance of object
- `collection` 
  - Array of `ids` of `schema`
  - Allow multiple references to same object in storage
  - Define order of references (e.g. most popular authors, authors with most books, ...)

That allows us to keep one instance of object in state and in the same time multiple references to object. Idea is to have one `storage` per `schema` and one or multiple `collections` per `schema`. Each `collection` can also have `tag` to support multiple arrays of references of same `schema`, but about that later. 

Ok, now we have defined `authors` resource, action and reducers. Let's create React components that will render authors and trigger fetching authors from server and see how will it integrate with `redux-io` and stuff we just implemented.

First create `Main` component in `Main.js` that just serves as shell component for rendering Tabs:

```javascript
import React from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import { AuthorFragment } from './fragments';

export default function Main() {
  return (
    <Tabs>
      <Tab eventKey={1} title="Authors">
        <AuthorFragment />
      </Tab>
    </Tabs>
  );
}
```

In `index.js` add `Main` component as child of `<App>`:

```javascript
// ...
import Main from "./Main";
// ...
    <div>
      <p>Example from redux-io documentation</p>
      <Main />
    </div>
// ...

```

Now we are ready to implement  `AuthorFragment` component that we are missing in `Main.js` file. Create `fragments` directory and in it `AuthorFragments.js` file with following code:

```Jsx
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { loadAuthors } from '../actions';
import { getAuthors } from '../selectors';

export class AuthorFragment extends Component {
  componentDidMount() {
    this.props.loadAuthors();
  }

  render() {
    const { authors } = this.props;
      
    return <div>{JSON.stringify(authors)}</div>;
  }
}

function mapStateToProps(state) {
  return {
    authors: getAuthors(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    loadAuthors: () => dispatch(loadAuthors()),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AuthorFragment);
```

As you see we first focused on connecting component with redux and redux-io. Let's first explain what we done, and in next step we will implement `AuthorTable` and render table consisting of author rows. We use `connect`  HOC to connect component to redux and pass `getAuthors` and `loadAuthors` to props. Idea is to dispatch `loadAuthors` once component finishes mounting, and via `getAuthors` selectors pass `authors` to `AuthorFragment` props.

We didn't yet implement `getAuthors`, so let's do it and along way explain why it is cool to use `redux-io` selectors. Create file `selectors.js` with following snippet:

```jsx
import { getCollection } from '@shoutem/redux-io';

export function getAuthors(state) {
  const { authors } = state;
  return getCollection(authors.all, state);
}
```

 As you can see, `getAuthors` just encapsulates call to `getCollection(collection, state, schema=null)`. We think it is good idea to encapsulate specifics about authors substate behind function especially in bigger and complex projects with modular arhitecture. But let's back to `getCollection` and what it does:

- Automatically denormalizes data in redux state - along with denormalized references
- Flattens `json:api` object structure
- Cache data - same reference if data is unchanged
- Status data (busy, error, valid status)
- Accepts collection state or array of `ids` with `schema`

What will it do is denormalize `authors` data and extend it for easier usage in `react` components. 

Now that we have data fetching and selecting resolved let's implement table and render authors. Create directory `components` and in it file `AuthorTable.js` with following code:

```jsx
import React from 'react';
import { Table } from 'react-bootstrap';
import _ from 'lodash';
import AuthorTableRow from './AuthorTableRow';

export default function AuthorTable({ authors }) {
  return (
    <Table striped bordered condensed hover>
      <thead>
        <tr>
          <th>Name</th>
          <th>Genre</th>
          <th style={{ width: '130px' }} />
        </tr>
      </thead>
      <tbody>
        {_.map(authors, author => (
          <AuthorTableRow
            key={author.id}
            author={author}
          />
        ))}
      </tbody>
    </Table>
  );
}

```

And in same directory a file `AuthorTableRow.js` with implementation of author table row:

```jsx
import React, { Component } from 'react';
import { Button, ButtonGroup, Glyphicon } from 'react-bootstrap';

export default class AuthorTableRow extends Component {
  constructor(props) {
    super(props);
    
    // TODO: Add function for author delete and edit 
  }
  
  render() {
    const { author } = this.props;
    const { name, genre, profileUrl } = author;
    return (
      <tr>
        <td>{name}</td>
        <td>{genre}</td>
        <td>
          <ButtonGroup>
            <Button disabled={!profileUrl}>
              <a href={profileUrl} target="_blank">
                <Glyphicon glyph="user" />
              </a>
            </Button>
          </ButtonGroup>
        </td>
      </tr>
    );
  }
}
```

In `AuthorsFragment.js` replace render of stringified `authors` with `AuthorTable`:

```jsx
// ...
import { AuthorTable } from '../components';

// ...
render() {
  const { authors } = this.props;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        margin: '10px',
      }}
    >
      <AuthorTable authors={authors} />
    </div>
  );
}
```

As you can see, `authors` list is flattened and can be used in a same way as any other fetched resource. But that is not all, in this tutorial I would like to show you how can you monitor data status and based on it trigger data fetch or render loader icon.

Let's go back to `AuthorsFragment.js` and add button for refreshing data:

```jsx
// ...
import { shouldLoad, invalidate, isBusy } from '@shoutem/redux-io';
import { Button, Glyphicon } from 'react-bootstrap';

// ...
constructor(props) {
  super(props);

  this.handleRefreshClick = this.handleRefreshClick.bind(this);
}

// ...
componentWillReceiveProps(nextProps) {
  if (shouldLoad(nextProps, this.props, 'authors')) {
    this.props.loadAuthors();
  }
}

handleRefreshClick() {
  this.props.invalidateAuthors();
}

render() {
  const { authors } = this.props;

  return (
    <div style={...}>
      <Button onClick={this.handleRefreshClick}>
        {isBusy(authors) && <Glyphicon glyph="refresh" />}
        {!isBusy(authors) && "Refresh"}
      </Button>
      <AuthorTable authors={authors} />
    </div>
  );
}

// ...
function mapDispatchToProps(dispatch) {
  return {
    loadAuthors: () => dispatch(loadAuthors()),
    invalidateAuthors: () => dispatch(invalidate('authors')),
  };
}
```

We add button that will render title `Refresh` or icon `refresh` based on returned boolean value of  `isBusy` function called with `authors` argument. List of `authors` is result of denoralization with `getCollection` and holds status data about `authors` collection in app, one of status data is `busy` flag that is active when `redux-io` has an active request for schema `author`.

Other functionality that we added is manual invalidation of data. Invalidation happens automatically for every mutable operation on resource, but we will talk about it later. Here I want to show you interesting feature that status data embeded with `authors` list enables. Button has an click handler `this.handleRefreshClick` that will trigger dispatch of `invalidate('authors')` action. Invalidation action changes status data of all collections defined with `authors` schema, so when we use `redux-io` helper `shouldLoad` it will return `true` value meaning data needs to be loaded and we will dispatch `loadAuthors`. Once `authors` are fetched, data again will be valid and `getAuthors` will automatically return new instance of denormalized data from redux store.

Great, we finished section explaining how to fetch resource from server and render it. Along way we passed all parts that needs to exist to create unidirectional circle from dispatching action, fetching data, storing data in redux store, denormalizing it with selectors and rendering it in table.

But that is only fetching of data, surely `redux-io` provides more. Absolutely, we still need to explain how to create new authors, update them or delete them. 

### New authors are born

We saw how to fetch existing authors and how to refresh data, now let's create new author. Most work will be with UI becuase we need to implement modal screen that will be opened once user click on Create button. Modal needs to contain form that will on submit collect data and pass it to callback. Only when callback is called will we use `redux-io` to send request for creating new user on server. We will start with mocking UI and adding functionality on redux side to focus on `redux-io` and after that implement UI.

First step is to extend our resource definition and encapsulate `create` action for easier usage in `react`, so let's add code in `actions.js`:

```jsx
import rio, { find, create } from '@shoutem/redux-io';

rio.registerResource({
  // ...
  // In next version this will be redundant due to JsonApiResource
  actions: {
    create: {
      request: {
        headers: {
          'Content-Type': 'application/vnd.api+json',
        },
      },
    },
  },
});

// ...
export function createAuthor(values) {
  const item = {
    type: 'authors',
    ...values,
  };

  return create('authors', item);
}
```

Function `createAuthor` accepts `values` and creates `item` that will be normalized based on `authors` schema as part of `create` action. We also extended our resource with `actions.create.request.headers` where  `json:api` requires specific header. In future versions of `redux-io` this will be redundant due to idea of `jsonApiResource` that will already have such config.

Now we have `createAuthor` action creator, so we can dispatch it with mocked values in `AuthorFragment.js`:

```jsx
import { loadAuthors, createAuthor } from '../actions';

// ...
render() {
  const { authors, createAuthor } = this.props;

  return (
    <div style={...}>
      // ...
      <Button bsStyle="primary" onClick={createAuthor}>
        <Glyphicon glyph="plus" /> Create
      </Button>
    </div>
  );
}

// ...
function mapDispatchToProps(dispatch) {
  return {
    // ...
    createAuthor: () => dispatch(createAuthor({
      name: 'test',
      genre: 'test',
      profileUrl: 'http://www.test.com',  
    })),
  };
}
```

It would be great to have nice UI for creating author, so let's use `Modal` component from `react-bootstrap` and form implementation from `redux-form`.

Create file `AuthorModal.js` in `components` directory with following code:

```jsx
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button, Modal } from 'react-bootstrap';
import { submit } from 'redux-form';
import AuthorForm from './AuthorForm';

export class AuthorModal extends Component {
  constructor(props) {
    super(props);

    this.handleSaveClick = this.handleSaveClick.bind(this);
  }

  handleSaveClick() {
    const { submitForm } = this.props;
    submitForm();
  }

  render() {
    const { show, onClose, onSave } = this.props;

    return (
      <Modal show={show} onHide={onClose}>
        <Modal.Header closeButton>
          <Modal.Title>Create author</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AuthorForm onSubmit={onSave} />
        </Modal.Body>
        <Modal.Footer>
          <Button bsStyle="danger" onClick={onClose}>
            Cancel
          </Button>
          <Button bsStyle="success" onClick={this.handleSaveClick}>
            Create
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

function mapDispatchToProps(dispatch) {
  return {
    submitForm: () => dispatch(submit('author')),
  };
}

export default connect(null, mapDispatchToProps)(AuthorModal);

```

We are managing is modal visible or not from outside by passing `show` prop. User can submit form by clicking on Create on modal. There are few specifics about `redux-form` in a way how to submit form outside `reduxForm`, but it is not in focus of this tutorial. Only important part is that on `onSubmit` we pass form values to parent.

Next step is to implement `AuthorForm.js` with actual form implementation:

```jsx
import React, { Component } from 'react';
import { FieldGroup } from '../form';
import { reduxForm } from 'redux-form';

export class AuthorForm extends Component {
  render() {
    const { handleSubmit } = this.props;

    return (
      <form onSubmit={handleSubmit}>
        <FieldGroup
          name="name"
          component="input"
          type="text"
          label="Text"
          placeholder="Enter authors name"
        />
        <FieldGroup
          name="genre"
          component="input"
          type="text"
          label="Genre"
          placeholder="Enter authors genres"
        />
        <FieldGroup
          name="profileUrl"
          component="input"
          type="text"
          label="Profile url"
          placeholder="Enter author profile url"
        />
      </form>
    );
  }
}

export default reduxForm({
  form: 'author',
})(AuthorForm);
```

We use `FieldGroup` from `form.js` as helper for binding `redux-form` to `react-bootstrap` form controls. Add `form.js` file with following code:

```jsx
import React from 'react';
import {
  FormGroup,
  ControlLabel,
  FormControl,
  HelpBlock,
} from 'react-bootstrap';
import { Field } from 'redux-form';

function renderFormControl({ type, placeholder, input }) {
  return <FormControl type={type} placeholder={placeholder} {...input} />;
}

export function FieldGroup({ id, label, help, ...props }) {
  return (
    <FormGroup controlId={id}>
      <ControlLabel>{label}</ControlLabel>
      <Field {...props} component={renderFormControl} />
      {help && <HelpBlock>{help}</HelpBlock>}
    </FormGroup>
  );
}
```

Also if you already used `redux-form` or this is your first time you need to add `formReducer` to your store, so modify `reducers.js`:

```jsx
import { reducer as formReducer } from 'redux-form';

const mainReducer = combineReducers({
  // ...
  form: formReducer,
});
```

So after a couple of copy/paste we are ready to remove test object on dispatching `createAuthor` from `AuthorFragment.js` and connect it to `AuthorForm` submit. We also need to manage modal visibility status.

```jsx
// ...
import { AuthorTable, AuthorModal } from '../components';

// ...
  constructor(props) {
    super(props);

    // ...
    this.handleCreateClick = this.handleCreateClick.bind(this);
    this.handleModalSave = this.handleModalSave.bind(this);
    this.handleModalClose = this.handleModalClose.bind(this);

    this.state = {
      showAuthorModal: false,
    };
  }

// ...
   handleCreateClick() {
     this.setState({
       showAuthorModal: true,
     });
   }
   
   handleModalSave(values) {
    this.props.createAuthor(values);

    this.setState({
      showAuthorModal: false,
    });
  }

  handleModalClose() {
    this.setState({
      showAuthorModal: false,
    });
  }
  
  render() {
    const { showAuthorModal } = this.state;
    
    return (
      <div style={...}>
        // ...
        <Button
          bsStyle="primary"
          style={{
            width: "100px",
          }}
          onClick={this.handleCreateClick}
        >
          <Glyphicon glyph="plus" /> Create
        </Button>
        <AuthorModal
          show={showAuthorModal}
          onSave={this.handleModalSave}
          onClose={this.handleModalClose}
        />
        // ...
      </div>
    );
  }
}

// ...
function mapDispatchToProps(dispatch) {
  return {
    // ...
    createAuthor: author => dispatch(createAuthor(author)),
    // ...
  };
}
```

Great we have everything ready to create users through UI. As you can see most work was to implement UI components, `redux-io` part was just adding a couple of code lines.

### Update authors life steps

What if we want to update author and change name or link to profile, no problem. We can do it easily by extending `AuthorModal`  to support editing of author object. But let's first implement update with `redux-io`, so let's add code in `actions.js`:

```jsx
import rio, { find, create, update } from '@shoutem/redux-io';

rio.registerResource({
  // ...
  actions: {
    // ...
    update: {
      request: {
        headers: {
          'Content-Type': 'application/vnd.api+json',
        },
      },
    },
  },
});

// ...
export function updateAuthor(authorId, patchValues) {
  const item = {
    type: 'authors',
    id: authorId,
    ...patchValues,
  };

  return update('authors', item, { authorId });
}
```

Same as for creating author, just instead of `create` we use `update` action creator. You will notice that we pass flat `patchValues` because `update` will normalize object for us.

In `AuthorModal` we need to support passing of existing `author` object via props to form initial values, modify modal title and confirm button text. On form submit we need to differentiate creation of new author or modifiying existing:

```jsx
// ...
import diff from 'object-diff';

export class AuthorModal extends Component {
  constructor(props) {
    super(props);

    // ...
    this.handleSubmitForm = this.handleSubmitForm.bind(this);
  }

  // ...
  handleSubmitForm(values) {
    const { onSave, author } = this.props;

    if (!author) {
      return onSave(values);
    }

    const changedValues = diff(author, values);
    onSave(changedValues);
  }

  render() {
    const { author, show, onClose } = this.props;
    
    const title = author ? 'Edit author' : 'Create author';
    const confirmBtnText = author ? 'Save' : 'Create';

    return (
      <Modal show={show} onHide={onClose}>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AuthorForm onSubmit={this.handleSubmitForm} initialValues={author} />
        </Modal.Body>
        <Modal.Footer>
          <Button bsStyle="danger" onClick={onClose}>
            Cancel
          </Button>
          <Button bsStyle="success" onClick={this.handleSaveClick}>
            {confirmBtnText}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
```

Now when `AuthorModal` supports editing, in `AuthorFragment` we need to handle selected author from `AuthorTable` and open modal with selected author:

```jsx
// ...
import { loadAuthors, updateAuthor, createAuthor } from '../actions';

export class AuthorFragment extends Component {
  constructor(props) {
    super(props);

    // ...
    this.handleEditClick = this.handleEditClick.bind(this);
      
    this.state = {
      selectedAuthor: null,
      showAuthorModal: false,
    };
  }
  
  // ...
  handleEditClick(authorId) {
    const { authors } = this.props;
    const author = _.find(authors, { id: authorId });

    this.setState({
      selectedAuthor: author,
      showAuthorModal: true,
    });
  }

  // ...
  handleModalSave(values) {
    const { selectedAuthor } = this.state;

    if (!selectedAuthor) {
      this.props.createAuthor(values);
    } else if (!_.isEmpty(values)) {
      this.props.updateAuthor(selectedAuthor.id, values);
    }

    this.setState({
      selectedAuthor: null,
      showAuthorModal: false,
    });
  }

  handleModalClose() {
    this.setState({
      selectedAuthor: null,
      showAuthorModal: false,
    });
  }

  render() {
    // ...
    const { selectedAuthor, showAuthorModal } = this.state;

    return (
      <div
        style={...}
      >
        // ...
        <AuthorTable
          // ...
          onEditClick={this.handleEditClick}
        />
        // ...
        <AuthorModal
          // ...
          author={selectedAuthor}
          // ...
        />
      </div>
    );
  }
}

// ...
function mapDispatchToProps(dispatch) {
  return {
    // ...
    updateAuthor: (authorId, values) =>
      dispatch(updateAuthor(authorId, values)),
  };
}
```

We are still missing `AuthorTable` implementation of edit button that would render for each author row and on click pass `authorId`. In `AuthorTableRow.js` add following code:

```jsx
// ...
export default class AuthorTableRow extends Component {
  constructor(props) {
    //...
    this.handleEditClick = this.handleEditClick.bind(this);
  }

  handleEditClick() {
    const { author, onEditClick } = this.props;
    const { id: authorId } = author;

    onEditClick(authorId);
  }

  render() {
    // ...
    return (
      <tr>
        // ...
        <td>
          <ButtonGroup>
            // ...
            <Button onClick={this.handleEditClick}>
              <Glyphicon glyph="pencil" />
            </Button>
            // ...
```

And in `AuthorTable.js` just connect `onEditClick` with props:

```jsx
// ...
export default function AuthorTable({ authors, onEditClick }) {
  return (
    <Table striped bordered condensed hover>
      // ...
      <tbody>
        {_.map(authors, author => (
          <AuthorTableRow
            // ...
            onEditClick={onEditClick}
          />
          // ...
```

And that's it. We can now easily modify author fields. Last thing that left with managing authors in our library is deleting authors.

### Delete authors, but their work lives

Similiar to create and update feature, deleting authors will require creating `deleteAuthor` action and connecting it with delete button in table row. First let's add `redux-io` functionality in `action.js`:

```jsx
import rio, { find, create, update, remove } from '@shoutem/redux-io';

// ...
export function deleteAuthor(authorId) {
  const item = {
    type: 'authors',
    id: authorId,
  };

  return remove('authors', item, { authorId });
}

```

Extend `AuthorTableRow.js` with delete button:

```jsx
import React, { Component } from 'react';
import { Button, ButtonGroup, Glyphicon } from 'react-bootstrap';

export default class AuthorTableRow extends Component {
  constructor(props) {
    // ...
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
  }
    
  // ...
  handleDeleteClick() {
    const { author, onDeleteClick } = this.props;
    const { id: authorId } = author;

    onDeleteClick(authorId);
  }
  
  render() {
    // ...
    return (
      <tr>
        // ...
        <td>
          <ButtonGroup>
            // ...
            <Button onClick={this.handleDeleteClick}>
              <Glyphicon glyph="trash" />
            </Button>
            // ...
```

And in `AuthorTable.js` just connect `onDeleteClick` with props:

```jsx
// ...
export default function AuthorTable({ authors, onEditClick, onDeleteClick }) {
  return (
    <Table striped bordered condensed hover>
      // ...
      <tbody>
        {_.map(authors, author => (
          <AuthorTableRow
            // ...
            onDeleteClick={onDeleteClick}
          />
          // ...
```

Now we just need to call `deleteAuthor` in `AuthorFragment.js` with following code changes:

```jsx
// ...
import { loadAuthors, deleteAuthor, updateAuthor, createAuthor } from '../actions';

export class AuthorFragment extends Component {
  constructor(props) {
    super(props);

    // ...
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
    // ...
  }
  
  // ...
  handleDeleteClick(authorId) {
    this.props.deleteAuthor(authorId);
  }

  render() {
    // ...
    return (
      <div
        style={...}
      >
        // ...
        <AuthorTable
          // ...
          onDeleteClick={this.handleDeleteClick}
        />
      </div>
    );
  }
}

// ...
function mapDispatchToProps(dispatch) {
  return {
    // ...
    deleteAuthor: authorId => dispatch(deleteAuthor(authorId)),
  };
}
```

Great, so now we have a whole functionality for managing users. Next step is to explain how to implement relationships between authors and their books.

### Books are authors children

// TODO: Write documentation about books and redux-io relationships.

