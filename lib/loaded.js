'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _middleware = require('./middleware');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (payload, schema) {
  var tag = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];

  if (!_lodash2.default.isPlainObject(payload)) {
    throw new Error('Invalid payload type.');
  }
  if (!_lodash2.default.isArray(payload.data) && !_lodash2.default.isPlainObject(payload.data)) {
    throw new Error('Missing payload data property.');
  }
  if (!_lodash2.default.isString(schema)) {
    throw new Error('Schema is invalid.');
  }
  if (!_lodash2.default.isString(tag)) {
    throw new Error('Tag isn\'t string.');
  }

  return {
    type: _middleware.LOAD_SUCCESS,
    payload: payload,
    meta: {
      source: _middleware.middlewareJsonApiSource,
      schema: schema,
      tag: tag
    }
  };
};