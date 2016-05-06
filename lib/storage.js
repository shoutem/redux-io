'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _middleware = require('./middleware');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// storage is generic storage reducer that enables creation
// of typed storage reducers that are handling specific
// OBJECT_ type actions.

exports.default = function (schema) {
  var initialState = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
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
      case _middleware.OBJECT_UPDATED:
        return _extends({}, state, _defineProperty({}, item.id, item));
      case _middleware.OBJECT_REMOVED:
        {
          var newState = _extends({}, state);
          delete newState[item.id];
          return newState;
        }
      default:
        return state;
    }
  };
};