# API Reference

The redux-io defines a set of actions, reducers, selectors, middleware and helper functions for easier managing of data in redux state. This section documents the complete redux-io API.

## Reducers

* [resource\(schema, initialState = {}\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/resouce.md)
* [storage\(schema, initialState = {}\)](storage-schema-initialstate.md)
* [collection\(schema, tag = '', settings = {}, initialState = \[\]\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/collection.md)
* [one\(schema, tag = '', settings = {}, initialValue = ''\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/one.md)

## Action creators

* [create\(config, schema, item = null\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/create.md)
* [find\(schema, tag = '', params = {}, options = {}\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/find.md)
* [update\(config, schema, item\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/update.md)
* [remove\(config, schema, item\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/remove.md)
* [next\(collection, appendMode = true\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/next.md)
* [crated\(payload, schema\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/created.md)
* [loaded\(payload, schema\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/loaded.md)
* [updated\(payload, schema\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/updated.md)
* [removed\(payload, schema\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/removed.md)
* [clear\(schema, tag = ''\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/clear.md)
* [invalidate\(schema\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/invalidate.md)
* [checkExipration\(\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/checkExpiration.md)

## Selectors

* [getCollection\(collection, state, schema = ''\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/getCollection.md)
* [getOne\(one, state, schema = ''\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/getOne.md)

## Middleware & Initialization

* [apiStateMiddleware](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/middleware.md)
* [enableRio\(reducer\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/enableRio.md)

## Helper functions

* [isValid\(rioObject\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/isValid.md)
* [isError\(rioObject\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/isError.md)
* [isBusy\(rioObject\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/isBusy.md)
* [isInitialized\(rioObject\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/isInitialized.md)
* [shouldRefresh\(rioObject\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/shouldRefresh.md)
* [isExpired\(rioObject\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/isExpired.md)
* [cloneStatus\(sourceObject, destinationObject, markChange = false\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/cloneStatus.md)

## RIO API

* [rio](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/rio.md)
  * [registerSchema\(config\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/rio.md#registerSchema)
  * [getSchema\(schema\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/rio.md#getSchema)
  * [clear\(\)](https://github.com/shoutem/redux-io/tree/d07e4568e1af7c2fd89072d223bed8fd407657dd/docs/api/rio.md#clear)

## Importing

Every function described above is a top-level export, except `rio` that has default export. You can import any of them like this:

### ES6

```javascript
import rio, { find, storage } from '@shoutem/redux-io'
```

