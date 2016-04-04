'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.collectionImmutable = exports.collection = exports.storageImmutable = exports.storage = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.find = find;
exports.create = create;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _immutable = require('immutable');

var _immutable2 = _interopRequireDefault(_immutable);

var _reduxApiMiddleware = require('redux-api-middleware');

var _middleware = require('./middleware');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var stateOperations = {
  plain: {
    set: function set(state, id, item) {
      return _extends({}, state, _defineProperty({}, id, item));
    },
    createMap: function createMap() {
      return {};
    },
    createList: function createList() {
      var list = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
      return list;
    }
  },
  immutable: {
    set: function set(state, id, item) {
      return state.set(item.id, _immutable2.default.fromJS(item));
    },
    createMap: function createMap() {
      return new _immutable2.default.Map();
    },
    createList: function createList() {
      var list = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
      return _immutable2.default.fromJS(list);
    }
  }
};

// createStorage is responsible for creating plain or
// immutable version of generic storage reducer. Generic storage
// reducer enables creating typed storage reducers that are
// handling specific OBJECT type actions.
function createStorage(ops) {
  return function (schema) {
    var initialState = arguments.length <= 1 || arguments[1] === undefined ? ops.createMap() : arguments[1];
    return function () {
      var state = arguments.length <= 0 || arguments[0] === undefined ? initialState : arguments[0];
      var action = arguments[1];

      if (_lodash2.default.get(action, 'meta.schema') !== schema) {
        return state;
      }
      var item = action.payload;
      switch (action.type) {
        case _middleware.OBJECT_FETCHED:
        case _middleware.OBJECT_CREATED:
          return ops.set(state, item.id, item);
        default:
          return state;
      }
    };
  };
}

var storage = exports.storage = createStorage(stateOperations.plain);
var storageImmutable = exports.storageImmutable = createStorage(stateOperations.immutable);

// createCollection is responsible for creating plain or
// immutable version of generic collection reducer. Generic collection
// reducer enables creating typed & named collection reducers that are
// handling specific COLLECTION type actions with specific collection
// name.
function createCollection(ops) {
  return function (schema, tag) {
    var initialState = arguments.length <= 2 || arguments[2] === undefined ? ops.createList() : arguments[2];
    return function () {
      var state = arguments.length <= 0 || arguments[0] === undefined ? initialState : arguments[0];
      var action = arguments[1];

      if (_lodash2.default.get(action, 'meta.schema') !== schema) {
        return state;
      }

      // Every collection should invalidate state no matter the name
      // of collection and return initial state.
      if (action.type === _middleware.COLLECTION_INVALIDATE) {
        return ops.createList();
      }

      // Only if tag in action is same as for collection
      if (_lodash2.default.get(action, 'meta.tag') !== tag) {
        return state;
      }

      switch (action.type) {
        case _middleware.COLLECTION_FETCHED:
          return ops.createList(action.payload.map(function (item) {
            return item.id;
          }));
        default:
          return state;
      }
    };
  };
}

var collection = exports.collection = createCollection(stateOperations.plain);
var collectionImmutable = exports.collectionImmutable = createCollection(stateOperations.immutable);

function find(config, schema) {
  var tag = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];

  return _defineProperty({}, _reduxApiMiddleware.CALL_API, _extends({
    method: 'GET'
  }, config, {
    types: [_middleware.LOAD_REQUEST, {
      type: _middleware.LOAD_SUCCESS,
      meta: {
        source: _middleware.middlewareJsonApiSource,
        schema: schema,
        tag: tag
      }
    }, _middleware.LOAD_ERROR]
  }));
}

function create(config, schema, item) {
  return _defineProperty({}, _reduxApiMiddleware.CALL_API, _extends({
    method: 'POST'
  }, config, {
    body: JSON.stringify({
      data: item
    }),
    types: [_middleware.CREATE_REQUEST, {
      type: _middleware.CREATE_SUCCESS,
      meta: {
        source: _middleware.middlewareJsonApiSource,
        schema: schema
      }
    }, _middleware.CREATE_ERROR]
  }));
}