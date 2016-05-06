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

// Action creator used to fetch data from api (GET). Config arg is based on CALL_API
// configuration from redux-api-middleware, allowing full customization expect types
// part of configuration. Find function expects schema name of data which correspond
// with storage reducer with same schema value to listen for received data. Tag arg
// is optional, but when used allows your collections with same tag value to respond
// on received data.

exports.default = function (config, schema) {
  var tag = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];

  if (!_lodash2.default.isObject(config)) {
    throw new TypeError('Config isn\'t object.');
  }
  if (!_lodash2.default.isString(schema) || _lodash2.default.isEmpty(schema)) {
    throw new Error('Schema is invalid.');
  }
  if (!_lodash2.default.isString(tag)) {
    throw new Error('Tag isn\'t string.');
  }

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
};