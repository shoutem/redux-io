'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.middlewareJsonApiSource = exports.OBJECT_CREATED = exports.COLLECTION_INVALIDATE = exports.CREATE_ERROR = exports.CREATE_SUCCESS = exports.CREATE_REQUEST = exports.OBJECT_FETCHED = exports.COLLECTION_FETCHED = exports.LOAD_ERROR = exports.LOAD_SUCCESS = exports.LOAD_REQUEST = undefined;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var LOAD_REQUEST = exports.LOAD_REQUEST = Symbol('LOAD_REQUEST');
var LOAD_SUCCESS = exports.LOAD_SUCCESS = Symbol('LOAD_SUCCESS');
var LOAD_ERROR = exports.LOAD_ERROR = Symbol('LOAD_ERROR');
var COLLECTION_FETCHED = exports.COLLECTION_FETCHED = Symbol('COLLECTION_FETCHED');
var OBJECT_FETCHED = exports.OBJECT_FETCHED = Symbol('OBJECT_FETCHED');

var CREATE_REQUEST = exports.CREATE_REQUEST = Symbol('CREATE_REQUEST');
var CREATE_SUCCESS = exports.CREATE_SUCCESS = Symbol('CREATE_SUCCESS');
var CREATE_ERROR = exports.CREATE_ERROR = Symbol('CREATE_ERROR');
var COLLECTION_INVALIDATE = exports.COLLECTION_INVALIDATE = Symbol('COLLECTION_INVALIDATE');
var OBJECT_CREATED = exports.OBJECT_CREATED = Symbol('OBJECT_CREATED');

var middlewareJsonApiSource = exports.middlewareJsonApiSource = 'json_api';

var makeCollectionAction = function makeCollectionAction(actionType, data, schema) {
  var tag = arguments.length <= 3 || arguments[3] === undefined ? '' : arguments[3];
  return {
    type: actionType,
    payload: data,
    meta: {
      schema: schema,
      tag: tag
    }
  };
};

var makeObjectAction = function makeObjectAction(actionType, item, schema) {
  return {
    type: actionType,
    payload: item,
    meta: {
      schema: schema
    }
  };
};

exports.default = function (store) {
  return function (next) {
    return function (action) {
      // Check for meta object in action
      if (action.meta === undefined) {
        return next(action);
      }

      var meta = action.meta;
      // Check for source, this middleware only understand json_api source
      if (meta.source === undefined || meta.source !== middlewareJsonApiSource) {
        return next(action);
      }
      // Check that schema is defined
      if (meta.schema === undefined) {
        return next(action);
      }

      // Validate payload
      if (!_lodash2.default.has(action, 'payload.data')) {
        return next(action);
      }

      // Always work with arrays
      var data = [].concat(action.payload.data);
      var schema = meta.schema;

      var dispatch = store.dispatch;
      if (action.type === LOAD_SUCCESS) {
        // Validate action meta has tag value
        var tag = meta.tag;
        if (tag === undefined) {
          return next(action);
        }

        data.map(function (item) {
          return dispatch(makeObjectAction(OBJECT_FETCHED, item, schema));
        });
        dispatch(makeCollectionAction(COLLECTION_FETCHED, data, schema, tag));
      }

      if (action.type === CREATE_SUCCESS) {
        data.map(function (item) {
          return dispatch(makeObjectAction(OBJECT_CREATED, item, schema));
        });
        dispatch(makeCollectionAction(COLLECTION_INVALIDATE, data, schema));
      }

      return next(action);
    };
  };
};