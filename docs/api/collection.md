### `collection(schema, tag = '', settings = {}, initialState = [])`
Collection is generic reducer that enables creating typed and named collection reducers that are handling
`REFERENCE_*` type actions with defined `schema` and `tag`. Reducer holds array of object `ids`, where
index defines order of objects. Every collection is defined with `schema` and `tag`. Use it for normalized state
to keep references to object instances (for which you use [storage](collection.md) reducer). With `tag` you can define
multiple and various references on same data schema.

```javascript
pinnedTodos: [3, 1],
allTodos: [1, 2, 3, 4, 5, ...],
users: [ 1002, 1005],
...
```

###### Arguments
`schema` (String): Type of data that is stored in the map. Based on schema and tag `collection` will be held responsible
for handling dispatched actions from `redux-io`.

`tag` (String): Defines along `schema` reducer's responsibility to process `redux-io` actiona. Tag enable to have
multiple collections for same schema. It's important if you want to have normalized state and instances in one place,
but different collections of data. By default it's empty string `''` and mostly use in cases when we want to hold all
keys of object in state.

`settings` (Object): optional status data used to define behaviour of reducer.
``` { expirationTime: seconds } ```

`initialState` (Object): If you are passing custom initial state, you should create an array with object `id`.

###### Returns
(*Function*): A reducer that invokes on action with equal `schema` and `tag`.

###### Example

```javascript
import { combineReducers } from 'redux';
import { collection } from '@shoutem/redux-io';

const todoSchema = 'data.todos'
const userSchema = 'data.users'

export default combineReducers({
  pinnedTodos: collection(todoSchema, 'pinned');
  allTodos: collection(todoSchema);
  users: collection(userSchema);
});

```
