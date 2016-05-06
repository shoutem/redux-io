'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.COLLECTION_CLEAR = undefined;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _middleware = require('./middleware');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var COLLECTION_CLEAR = exports.COLLECTION_CLEAR = '@@redux_api_state/COLLECTION_CLEAR';

// collection is generic collection reducer that enables creating
// typed & named collection reducers that are handling specific
// COLLECTION_ type actions with specific collection name.

exports.default = function (schema, tag) {
  var initialState = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];
  return function () {
    var state = arguments.length <= 0 || arguments[0] === undefined ? initialState : arguments[0];
    var action = arguments[1];

    if (_lodash2.default.get(action, 'meta.schema') !== schema) {
      return state;
    }

    // Every collection should invalidate state no matter the name
    // of collection and return initial state.
    if (action.type === _middleware.COLLECTION_INVALIDATE) {
      return [];
    }

    // Only if the tag in the action is the same as the one on the collection reducer
    if (_lodash2.default.get(action, 'meta.tag') !== tag) {
      return state;
    }

    switch (action.type) {
      case _middleware.COLLECTION_FETCHED:
        return action.payload.map(function (item) {
          return item.id;
        });
      case COLLECTION_CLEAR:
        return [];
      default:
        return state;
    }
  };
};