### `storage(schema, initialState={})`
Storage is generic storage reducer that enables the creation of typed storage reducers that are handling specific
OBJECT_ type actions. Holds map of objects, where `key` is object id and `value` instance of an object. You should hold
all objects of one schema in one storage. On fetch and create storage will always merge new object into existing map,
overwriting possible existing object.

###### Arguments
`schema` (String): Type of data that is stored in the map. Based on schema `storage` will be held responsible for
handling dispatched actions from `redux-api-state`.

`initialState` (Object): If you are passing custom initial state, you should create a map where `key` is object id
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
