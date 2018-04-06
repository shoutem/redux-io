### `storage(schema, initialState={})`
Storage is generic storage reducer that enables creation of typed storage reducers that are handling specific
`OBJECT_*` type actions. It holds map of objects, where `key` is object id and `value` instance of an object. You should
hold all objects of one `schema` in one storage. On `find` and `create` actions storage will always merge new object into
existing map, overwriting possible existing object.

```javascript
todos : {
  1: {
    id: 1,
    type: "data.todos",
    title: "Buy new shoes",
    author:"1003"
  },
  2: {
    id: 2,
    type: "data.todos",
    title: "Run 5K",
    author:"1004"
  },
  3: { ... },
  ...
}
```

###### Arguments
`schema` (String): Type of data that is stored in the map. Based on schema `storage` will be held responsible for
handling dispatched actions from `redux-io`.

`initialState` (Object): If you are passing custom initial state, you should create a map where `key` is object `id`
and `value` instance of an object.

###### Returns
(*Function*): A reducer that invokes on action with same `schema`.

###### Example

```javascript
import { combineReducers } from 'redux';
import { storage } from '@shoutem/redux-io';

export default combineReducers({
  todos: storage('data.todos');
});

```
