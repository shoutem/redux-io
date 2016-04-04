'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.COLLECTION_INVALIDATE = exports.OBJECT_CREATED = exports.CREATE_ERROR = exports.CREATE_SUCCESS = exports.CREATE_REQUEST = exports.COLLECTION_FETCHED = exports.OBJECT_FETCHED = exports.LOAD_ERROR = exports.LOAD_SUCCESS = exports.LOAD_REQUEST = exports.create = exports.find = exports.collectionImmutable = exports.collection = exports.storageImmutable = exports.storage = exports.jsonApiMiddleware = undefined;

var _reducers = require('./reducers');

Object.defineProperty(exports, 'storage', {
  enumerable: true,
  get: function get() {
    return _reducers.storage;
  }
});
Object.defineProperty(exports, 'storageImmutable', {
  enumerable: true,
  get: function get() {
    return _reducers.storageImmutable;
  }
});
Object.defineProperty(exports, 'collection', {
  enumerable: true,
  get: function get() {
    return _reducers.collection;
  }
});
Object.defineProperty(exports, 'collectionImmutable', {
  enumerable: true,
  get: function get() {
    return _reducers.collectionImmutable;
  }
});
Object.defineProperty(exports, 'find', {
  enumerable: true,
  get: function get() {
    return _reducers.find;
  }
});
Object.defineProperty(exports, 'create', {
  enumerable: true,
  get: function get() {
    return _reducers.create;
  }
});

var _middleware = require('./middleware');

Object.defineProperty(exports, 'LOAD_REQUEST', {
  enumerable: true,
  get: function get() {
    return _middleware.LOAD_REQUEST;
  }
});
Object.defineProperty(exports, 'LOAD_SUCCESS', {
  enumerable: true,
  get: function get() {
    return _middleware.LOAD_SUCCESS;
  }
});
Object.defineProperty(exports, 'LOAD_ERROR', {
  enumerable: true,
  get: function get() {
    return _middleware.LOAD_ERROR;
  }
});
Object.defineProperty(exports, 'OBJECT_FETCHED', {
  enumerable: true,
  get: function get() {
    return _middleware.OBJECT_FETCHED;
  }
});
Object.defineProperty(exports, 'COLLECTION_FETCHED', {
  enumerable: true,
  get: function get() {
    return _middleware.COLLECTION_FETCHED;
  }
});
Object.defineProperty(exports, 'CREATE_REQUEST', {
  enumerable: true,
  get: function get() {
    return _middleware.CREATE_REQUEST;
  }
});
Object.defineProperty(exports, 'CREATE_SUCCESS', {
  enumerable: true,
  get: function get() {
    return _middleware.CREATE_SUCCESS;
  }
});
Object.defineProperty(exports, 'CREATE_ERROR', {
  enumerable: true,
  get: function get() {
    return _middleware.CREATE_ERROR;
  }
});
Object.defineProperty(exports, 'OBJECT_CREATED', {
  enumerable: true,
  get: function get() {
    return _middleware.OBJECT_CREATED;
  }
});
Object.defineProperty(exports, 'COLLECTION_INVALIDATE', {
  enumerable: true,
  get: function get() {
    return _middleware.COLLECTION_INVALIDATE;
  }
});

var _middleware2 = _interopRequireDefault(_middleware);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.jsonApiMiddleware = _middleware2.default;