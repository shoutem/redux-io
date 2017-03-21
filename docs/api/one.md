### `one(schema, tag = '', settings = {}, initialValue = '')`
One is generic reducer that enables creating typed and named one reducers that are handling
`REFERENCE_*` type actions with defined `schema` and `tag`. Reducer holds single value referencing single object in state.
One is defined with `schema` and `tag`. Use it for normalized state to keep single reference to object instance
(for which you use [storage](collection.md) reducer). With `tag` you can define multiple and various references on same
data schema.

```javascript
selectedTodo: "1",
activeUser: "1002",
...
```

###### Arguments
`schema` (String): Type of data that is stored in the map. Based on schema and tag `one` will be held responsible
for handling dispatched actions from `redux-io`.

`tag` (String): Defines along `schema` reducer's responsibility to process `redux-io` actiona. Tag enable to have
multiple collections for same schema. It's important if you want to have normalized state and instances in one place,
but different collections of data. By default it's empty string `''` and mostly use in cases when we want to hold all
keys of object in state.

`settings` (Object): optional status data used to define behaviour of reducer.
``` { expirationTime: seconds } ```

`initialValue` (String|Number|Object): Reference to single object in state. Corresponds to object `id`.

###### Returns
(*Function*): A reducer that invokes on action with equal `schema` and `tag`.

###### Example

```javascript
import { combineReducers } from 'redux';
import { one } from '@shoutem/redux-io';

const todoSchema = 'data.todos'
const userSchema = 'data.users'

export default combineReducers({
  selectedTodo: one(todoSchema, 'selected');
  activeUser: one(userSchema, 'active');  
});

```
