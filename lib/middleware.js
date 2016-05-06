'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.middlewareJsonApiSource = exports.OBJECT_REMOVED = exports.OBJECT_CREATED = exports.OBJECT_UPDATED = exports.OBJECT_FETCHED = exports.COLLECTION_INVALIDATE = exports.COLLECTION_FETCHED = exports.REMOVE_ERROR = exports.REMOVE_SUCCESS = exports.REMOVE_REQUEST = exports.UPDATE_ERROR = exports.UPDATE_SUCCESS = exports.UPDATE_REQUEST = exports.LOAD_ERROR = exports.LOAD_SUCCESS = exports.LOAD_REQUEST = exports.CREATE_ERROR = exports.CREATE_SUCCESS = exports.CREATE_REQUEST = undefined;

var _actionHandlers;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var CREATE_REQUEST = exports.CREATE_REQUEST = '@@redux_api_state/CREATE_REQUEST';
var CREATE_SUCCESS = exports.CREATE_SUCCESS = '@@redux_api_state/CREATE_SUCCESS';
var CREATE_ERROR = exports.CREATE_ERROR = '@@redux_api_state/CREATE_ERROR';

var LOAD_REQUEST = exports.LOAD_REQUEST = '@@redux_api_state/LOAD_REQUEST';
var LOAD_SUCCESS = exports.LOAD_SUCCESS = '@@redux_api_state/LOAD_SUCCESS';
var LOAD_ERROR = exports.LOAD_ERROR = '@@redux_api_state/LOAD_ERROR';

var UPDATE_REQUEST = exports.UPDATE_REQUEST = '@@redux_api_state/UPDATE_REQUEST';
var UPDATE_SUCCESS = exports.UPDATE_SUCCESS = '@@redux_api_state/UPDATE_SUCCESS';
var UPDATE_ERROR = exports.UPDATE_ERROR = '@@redux_api_state/UPDATE_ERROR';

var REMOVE_REQUEST = exports.REMOVE_REQUEST = '@@redux_api_state/REMOVE_REQUEST';
var REMOVE_SUCCESS = exports.REMOVE_SUCCESS = '@@redux_api_state/REMOVE_SUCCESS';
var REMOVE_ERROR = exports.REMOVE_ERROR = '@@redux_api_state/REMOVE_ERROR';

var COLLECTION_FETCHED = exports.COLLECTION_FETCHED = '@@redux_api_state/COLLECTION_FETCHED';
var COLLECTION_INVALIDATE = exports.COLLECTION_INVALIDATE = '@@redux_api_state/COLLECTION_INVALIDATE';

var OBJECT_FETCHED = exports.OBJECT_FETCHED = '@@redux_api_state/OBJECT_FETCHED';
var OBJECT_UPDATED = exports.OBJECT_UPDATED = '@@redux_api_state/OBJECT_UPDATED';
var OBJECT_CREATED = exports.OBJECT_CREATED = '@@redux_api_state/OBJECT_CREATED';
var OBJECT_REMOVED = exports.OBJECT_REMOVED = '@@redux_api_state/OBJECT_REMOVED';

var middlewareJsonApiSource = exports.middlewareJsonApiSource = '@@redux_api_state/json_api';

var makeCollectionAction = function makeCollectionAction(sourceAction, actionType, data, schema) {
  var tag = arguments.length <= 4 || arguments[4] === undefined ? '' : arguments[4];

  if (!actionType) {
    throw new Error('Action type is not valid.');
  }
  if (!data) {
    throw new Error('Data is not valid.');
  }
  if (!schema) {
    throw new Error('Schema is not valid.');
  }
  if (tag === undefined || tag === null) {
    throw new Error('Tag is not valid.');
  }

  return {
    type: actionType,
    payload: data,
    meta: _extends({}, sourceAction.meta, {
      schema: schema,
      tag: tag
    })
  };
};

var makeObjectAction = function makeObjectAction(sourceAction, actionType, item) {
  if (!actionType) {
    throw new Error('Action type is not valid.');
  }
  if (!item) {
    throw new Error('Data is not valid.');
  }
  if (!_lodash2.default.get(item, 'type')) {
    throw new Error('Schema is not valid.');
  }

  return {
    type: actionType,
    payload: item,
    meta: _extends({}, sourceAction.meta, {
      schema: _lodash2.default.get(item, 'type')
    })
  };
};

var actionHandlers = (_actionHandlers = {}, _defineProperty(_actionHandlers, LOAD_SUCCESS, function (action, data, dispatch) {
  var _action$meta = action.meta;
  var schema = _action$meta.schema;
  var tag = _action$meta.tag;
  // Validate action meta has a tag value

  if (tag === undefined || tag === null) {
    return;
  }
  data.map(function (item) {
    return dispatch(makeObjectAction(action, OBJECT_FETCHED, item));
  });
  // TODO: once when we support findOne action and single reducer, COLLECTION_FETCHED
  // should trigger only for collections
  dispatch(makeCollectionAction(action, COLLECTION_FETCHED, data, schema, tag));
}), _defineProperty(_actionHandlers, CREATE_SUCCESS, function (action, data, dispatch) {
  data.map(function (item) {
    return dispatch(makeObjectAction(action, OBJECT_CREATED, item));
  });
  var schema = action.meta.schema;
  dispatch(makeCollectionAction(action, COLLECTION_INVALIDATE, data, schema));
}), _defineProperty(_actionHandlers, UPDATE_SUCCESS, function (action, data, dispatch) {
  data.map(function (item) {
    return dispatch(makeObjectAction(action, OBJECT_UPDATED, item));
  });
  var schema = action.meta.schema;
  dispatch(makeCollectionAction(action, COLLECTION_INVALIDATE, data, schema));
}), _defineProperty(_actionHandlers, REMOVE_SUCCESS, function (action, data, dispatch) {
  dispatch(makeObjectAction(action, OBJECT_REMOVED, action.meta.item));
  var schema = action.meta.schema;
  dispatch(makeCollectionAction(action, COLLECTION_INVALIDATE, data, schema));
}), _actionHandlers);

var isValidAction = function isValidAction(action) {
  if (!actionHandlers[action.type]) {
    return false;
  }
  // Check for meta object in action
  if (action.meta === undefined) {
    throw new Error('Meta is undefined.');
  }
  var meta = action.meta;
  // Check if source exists
  if (meta.source === undefined) {
    throw new Error('Source is undefined.');
  }
  // Source exists but this middleware is not responsible for other source variants
  // only for json_api
  if (meta.source !== middlewareJsonApiSource) {
    return false;
  }
  // Check that schema is defined
  if (!meta.schema) {
    throw new Error('Schema is invalid.');
  }
  // Validate payload
  if (action.type !== REMOVE_SUCCESS && !_lodash2.default.has(action, 'payload.data')) {
    throw new Error('Payload Data is invalid, expecting payload.data.');
  }

  return true;
};

var getData = function getData(payload) {
  var data = payload && payload.data || [];
  return [].concat(data);
};
var getIncluded = function getIncluded(payload) {
  return _lodash2.default.has(payload, 'included') ? payload.included : [];
};

exports.default = function (store) {
  return function (next) {
    return function (action) {
      // Validate action, if not valid pass
      if (!isValidAction(action)) {
        return next(action);
      }

      var dispatch = store.dispatch;

      // First dispatch included objects
      var included = getIncluded(action.payload);
      included.map(function (item) {
        return dispatch(makeObjectAction(action, OBJECT_FETCHED, item));
      });

      // Find handler for supported action type to make appropriate logic
      var data = getData(action.payload);
      actionHandlers[action.type](action, data, dispatch);

      // After middleware handled action pass input action to next
      return next(action);
    };
  };
};