# API Reference

The redux-io defines a set of actions, reducers, selectors, middleware and helper functions for easier managing
of data in redux state. This section documents the complete redux-io API.

### Reducers

* [resource(schema, initialState = {})](resouce.md)
* [storage(schema, initialState = {})](storage.md)
* [collection(schema, tag = '', settings = {}, initialState = \[\])](collection.md)
* [one(schema, tag = '', settings = {}, initialValue = '')](one.md)

### Action creators

* [create(config, schema, item = null)](create.md)
* [find(schema, tag = '', params = {}, options = {})](find.md)
* [update(config, schema, item)](update.md)
* [remove(config, schema, item)](remove.md)
* [next(collection, appendMode = true)](next.md)
* [created(payload, schema)](created.md)
* [loaded(payload, schema)](loaded.md)
* [updated(payload, schema)](updated.md)
* [removed(payload, schema)](removed.md)
* [clear(schema, tag = '')](clear.md)
* [invalidate(schema)](invalidate.md)
* [checkExipration()](checkExpiration.md)

### Selectors

* [getCollection(collection, state, schema = '')](getCollection.md)
* [getOne(one, state, schema = '')](getOne.md)

### Middleware & Initialization

* [apiStateMiddleware](middleware.md)
* [enableRio(reducer)](enableRio.md)

### Helper functions

* [isValid(rioObject)](isValid.md)
* [isError(rioObject)](isError.md)
* [isBusy(rioObject)](isBusy.md)
* [isInitialized(rioObject)](isInitialized.md)
* [shouldRefresh(rioObject)](shouldRefresh.md)
* [isExpired(rioObject)](isExpired.md)
* [cloneStatus(sourceObject, destinationObject, markChange = false)](cloneStatus.md)

### RIO API

* [rio](rio.md)
    * [registerSchema(config)](rio.md#registerSchema)
    * [getSchema(schema)](rio.md#getSchema)
    * [clear()](rio.md#clear)

### Importing

Every function described above is a top-level export, except `rio` that has default export. You can import any of them like this:

#### ES6

```js
import rio, { find, storage } from '@shoutem/redux-io'
```
