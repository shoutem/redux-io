'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _reduxApiMiddleware = require('redux-api-middleware');

var _middleware = require('./middleware');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// Action creator used to delete item on api (DELETE). Config arg is based on CALL_API
// configuration from redux-api-middleware, allowing full customization expect types
// part of configuration. Delete function expects schema name of data which correspond
// with storage reducer with same schema value to listen for deleted data. Item arg
// holds object that you want to pass to api. Tag is not needed because all collection
// with configured schema value as in argument of delete will be invalidated upon successful
// action of deleting item on api.

exports.default = function (config, schema, item) {
  if (!_lodash2.default.isObject(config)) {
    throw new TypeError('Config isn\'t object.');
  }
  if (!_lodash2.default.isString(schema) || _lodash2.default.isEmpty(schema)) {
    throw new Error('Schema is invalid.');
  }
  if (!_lodash2.default.isObject(item)) {
    throw new Error('Item isn\'t object.');
  }
  return _defineProperty({}, _reduxApiMiddleware.CALL_API, _extends({
    method: 'DELETE'
  }, config, {
    types: [_middleware.REMOVE_REQUEST, {
      type: _middleware.REMOVE_SUCCESS,
      meta: {
        source: _middleware.middlewareJsonApiSource,
        schema: schema,
        item: item
      }
    }, _middleware.REMOVE_ERROR]
  }));
};