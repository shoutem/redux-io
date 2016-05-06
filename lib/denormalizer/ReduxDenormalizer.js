'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _denormalizer = require('denormalizer');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function getStorage(getStore, storagePath) {
  var store = getStore();

  if (!storagePath) {
    return store;
  }

  return _lodash2.default.get(getStore(), storagePath);
}

/**
 * Returns provided data in denormalized form
 */

var ReduxDenormalizer = function (_ObjectDenormalizer) {
  _inherits(ReduxDenormalizer, _ObjectDenormalizer);

  /**
   * ReduxDenormalizer has two modes:
   *  1st - FindStorage mode
   *    Provide getStore and storagePath dynamically get latest storage
   *  2nd - ProvideStorage mode
   *    There is no getStore and storagePath,
   *    denormalization functions require storage to resolve relationships
   *
   * @param getStore - function to get current store
   * @param storagePath - path to storage object in store
   */

  function ReduxDenormalizer(getStore, storagePath) {
    _classCallCheck(this, ReduxDenormalizer);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ReduxDenormalizer).call(this, {}));
    // storage reference will be updated every time denormalizing
    // Object denormalizer requires normalizedData object when initialising


    if (!getStore && !storagePath) {
      _this.provideStorageMode = true;
    } else {
      _this.provideStorageMode = false;
      if (!_lodash2.default.isFunction(getStore)) {
        throw Error('Invalid getStore, must be function.');
      }
      if (storagePath && !_lodash2.default.isString(storagePath)) {
        throw Error('Invalid storagePath, must be string.');
      }
    }

    _this.getStore = getStore;
    _this.storagePath = storagePath;
    return _this;
  }

  /**
   * Returns denormalized item
   * Storage is needed in ProvideStorage mode.
   *
   * @returns {{}}
   */


  _createClass(ReduxDenormalizer, [{
    key: 'denormalizeItem',
    value: function denormalizeItem(item, storage) {
      // Check if ReduxDenormalizer is in ProvideStorage mode and if it is,
      // check if storage is provided. ProvideStorage mode requires storage!
      if (this.provideStorageMode && !storage) {
        throw Error('Invalid storage, ProvideStorage mode requires storage object');
      }

      _get(Object.getPrototypeOf(ReduxDenormalizer.prototype), 'setNormalizedData', this).call(this, storage || getStorage(this.getStore, this.storagePath));
      return _get(Object.getPrototypeOf(ReduxDenormalizer.prototype), 'getDenormalizedItem', this).call(this, item);
    }

    /**
     * Returns denormalized collection
     * Storage is needed in ProvideStorage mode.
     *
     * @returns {{}} - denormalized items
     */

  }, {
    key: 'denormalizeCollection',
    value: function denormalizeCollection(collection, storage) {
      var _this2 = this;

      return collection.map(function (item) {
        return _this2.denormalizeItem(item, storage);
      });
    }
  }]);

  return ReduxDenormalizer;
}(_denormalizer.ObjectDenormalizer);

exports.default = ReduxDenormalizer;