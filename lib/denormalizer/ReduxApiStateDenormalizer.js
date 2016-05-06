'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

exports.createSchemasMap = createSchemasMap;

var _ReduxDenormalizer2 = require('./ReduxDenormalizer');

var _ReduxDenormalizer3 = _interopRequireDefault(_ReduxDenormalizer2);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Created getStore for ReduxDenormalizer by using storageMap to find relationships.
 * @param store
 * @param storeSchemasPaths
 * @returns {{}}
 */
function createSchemasMap(store, storeSchemasPaths) {
  var storage = {};

  _lodash2.default.forEach(storeSchemasPaths, function (path, schema) {
    return storage[schema] = _lodash2.default.get(store, path);
  });

  return storage;
}
/**
 * Returns provided data in denormalized form
 */

var ReduxApiStateDenormalizer = function (_ReduxDenormalizer) {
  _inherits(ReduxApiStateDenormalizer, _ReduxDenormalizer);

  /**
   * ReduxDenormalizer has two modes Find and Provide.
   * ReduxApiStateDenormalizer uses
   *  FindStorage mode
   *    If getStore and storeSchemasPaths are set.
   *    getStore and storeSchemasPaths are used to create generic function
   *    to provide latest storage for relationships resolving
   *  ProvideStorage mode
   *    If there is no getStore and storeSchemasPaths.
   *    Denormalization functions require storage to resolve relationships
   *
   * Storage map gives location of schema saved in storage.
   *
   * @param getStore - returns latest store
   * @param storeSchemasPaths - { schema: pathInStoreToSchema }
   */

  function ReduxApiStateDenormalizer(getStore, storeSchemasPaths) {
    _classCallCheck(this, ReduxApiStateDenormalizer);

    if (getStore && storeSchemasPaths) {
      var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ReduxApiStateDenormalizer).call(this, function () {
        return createSchemasMap(getStore(), storeSchemasPaths);
      }));
      // FindStorage mode

    } else {
      var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ReduxApiStateDenormalizer).call(this));
      // ProvideStorage mode

    }
    return _possibleConstructorReturn(_this);
  }

  /**
   *
   * Denormalize id for given schema.
   * Storage is needed in ProvideStorage mode.
   *
   * @param id
   * @param schema
   * @param storage
   * @returns {{}}
   */


  _createClass(ReduxApiStateDenormalizer, [{
    key: 'denormalizeItem',
    value: function denormalizeItem(id, schema, storage) {
      return _get(Object.getPrototypeOf(ReduxApiStateDenormalizer.prototype), 'denormalizeItem', this).call(this, { id: id, type: schema }, storage);
    }

    /**
     * Denormalize collection for given schema
     * Storage is needed in ProvideStorage mode.
     *
     * @param collection
     * @param schema
     * @param storage
     * @returns {{}}
     */

  }, {
    key: 'denormalizeCollection',
    value: function denormalizeCollection(collection, schema, storage) {
      var _this2 = this;

      return collection.map(function (id) {
        return _this2.denormalizeItem(id, schema, storage);
      });
    }
  }]);

  return ReduxApiStateDenormalizer;
}(_ReduxDenormalizer3.default);

exports.default = ReduxApiStateDenormalizer;