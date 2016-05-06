'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _index = require('./index');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (schema) {
  var tag = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

  if (!_lodash2.default.isString(schema)) {
    throw new Error('Schema is invalid.');
  }
  if (!_lodash2.default.isString(tag)) {
    throw new Error('Tag isn\'t string.');
  }

  return {
    type: _index.COLLECTION_CLEAR,
    meta: {
      schema: schema,
      tag: tag
    }
  };
};