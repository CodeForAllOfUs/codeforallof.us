function deepClone(source) {
  var i, prop, ret;

  if (Array.isArray(source)) {
    ret = [];
    for (i = 0; i < source.length; ++i) {
      ret.push(deepClone(source[i]));
    }
  } else if (typeof source === 'object') {
    ret = {};
    for (prop in source) {
      if (source.hasOwnProperty(prop)) {
        ret[prop] = deepClone(source[prop]);
      }
    }
  } else {
    ret = source;
  }

  return ret;
}

function DataStore() {
    this._store = {};
    this._factories = {};
}

DataStore.prototype = {
  constructor: DataStore,

  /**
  * Empty out all data records from each internal model store. All models (but not their factories) are lost.
  * @return
  */
  clear: function () {
    for (var type in this._store) {
      if (this._store.hasOwnProperty(type) && typeof this._store[type] === 'object') {
        this._store[type].length = 0;
      }
    }
  },

  /**
  * Add a storage unit that will contain models of a given named type. It is initialized empty.
  * @param {String} type A string name of the internal array representation of model data of a certain type.
  * @return
  */
  addType: function (type) {
    if (typeof this._store[type] !== 'undefined') {
      throw new Error('A model type of type "' + type + '" already exists! Cannot add it again.');
    }

    this._store[type] = [];
  },

  /**
  * Keeps a reference of the given model factory internally under the given named type. New models with that named type created from JSON or extended from an existing object-type will be created from this factory.
  * @param {String} type A string name representing the model type and its factory type.
  * @param {(Function|Object)} factory An existing function, or an object that will create a new object of its type when its `.create()` method is invoked.
  * @return
  */
  registerModelFactory: function (type, factory) {
    if (this._store[type] === void 0) {
      throw new Error('There is no model type ' + type + ' in the datastore!');
    }

    if (this._factories[type] !== void 0) {
      throw new Error ('There is already a registered model factory of type ' + type + ' in the datastore!');
    }

    if (typeof factory !== 'function' || typeof factory.create !== 'function') {
      throw new Error ('The model factory of type ' + type + 'you are trying to register is not of the proper datatype!');
    }

    this._factories[type] = factory;
  },

  /**
  * Create a new model using its factory, or if one doesn't exist, creates a plain object. Can be extended from a deep clone of another object.
  * @param {String} type A string name representing the model type and its factory type.
  * @param {...Object} model Optional existing objects to extend from, using a deep clone.
  * @return {Object} The new object.
  */
  createModelOfType: function (type, ...args) {
    var factory = this._factories[type],
        model;

    if (!factory) {
        model = {};
    } else {
        model = factory.create();
    }

    this._mergeObject(...[model].concat(args));
    return model;
  },

  /**
  * Load new models into the internal data storage unit of the named model type. New models will be created using a previously-registered factory of that type as the base if it exists. If the factory doesn't exist, a plain object is used as the base. The payload can be an object or an array of objects. Each object *MUST* have a property named 'id' that is a Number.
  * @param {String} type A string name representing the model type, and if its factory was registered, its factory type.
  * @param {(Object|Array)} payload An object or array of objects to load into internal model storage.
  * @return
  */
  load: function (type, payload) {
    var modelType = this._store[type];

    if (modelType === void 0) {
      throw new Error('There is no model of type ' + type + ' in the datastore!');
    }

    if (typeof payload !== 'object') {
      throw new Error('Payload for type ' + type + ' was not an object!', payload);
    }

    if (!Array.isArray(payload)) {
        payload = [payload];
    }

    if (payload.length === 0) {
      return;
    }

    payload = payload.map(function (obj) {
      return this.createModelOfType(type, obj);
    }, this);

    this._pushObjects(modelType, payload);
  },

  /**
  * Use the containing array to update the properties of an object it contains and notify observers.
  * @param {Object} obj The object you want the following arguments' object properties to be merged into.
  * @param {...Object} model Optional existing objects to extend from, using a deep clone.
  * @return
  */
  _mergeObject: function (obj, ...args) {
    var i, prop, curr;

    if (typeof obj !== 'object' || Array.isArray(obj)) {
      return;
    }

    for (i = 0; i < args.length; ++i) {
      curr = args[i];

      if (typeof curr !== 'object' || Array.isArray(curr)) {
        continue;
      }

      // create a deep clone of an object.
      for (prop in curr) {
        if (curr.hasOwnProperty(prop)) {
          obj[prop] = deepClone(curr[prop]);
        }
      }
    }
  },

  /**
  * Push new object(s) into the `modelType` data storage unit,
  * such that all elements remain in sorted order by `id`.
  * @param {(String|modelType)} type A string name of the internal array representation of model data of a certain type, or the array itself.
  * @param {(Array|Object)} objs An object or objects to insert into the storage unit in sorted order.
  * @return
  */
  _pushObjects: function (type, objs) {
    var id, lastId, lastIndex;
    var foundItem;
    if (id === lastId) {
      insertAt(++lastIndex);
      continue;
    }

    // we need to check for collisions and update those that exist, and insert those that don't.
    // we also need to be extremely careful not to modify the array while we're searching it.
    payload.forEach(function (item) {
      foundItem = this._binarySearch(modelType, item.id);

      if (foundItem) {
        this._mergeObject(foundItem, item);
      } else {
        items.push(this.createModelOfType(type, item));
      }
    }, this);
  },

  /**
  * Sort the internal model array by a specified key.
  * Since the arrays are always sorted by id, searching by id offers significant speedup.
  * To determine whether one object's property is before another, the `-` operator is used if the key is a Number type, and `<` otherwise.
  * @param {(String|modelType)} type A string name of the internal array representation of model data of a certain type, or the array itself.
  * @param {String} [key=id] A key name to sort by. Defaults to 'id'.
  * @return {Array} A copy of the array, but sorted by `key`.
  */
  _sortBy: function (type, key) {
    var sortedArray;

    key = key || 'id';

    if (typeof type === 'string') {
      sortedArray = this._store[type];
    } else {
      sortedArray = type;
    }

    sortedArray = sortedArray.slice();

    // skip if key === 'id' since array should already be sorted
    if (sortedArray.length && key !== 'id') {
      if (typeof sortedArray[0][key] === 'number') {
        sortedArray.sort((a, b) => a[key] - b[key]);
      } else {
        sortedArray.sort((a, b) => a[key] < b[key]);
      }
    }

    return sortedArray;
  },

  /**
  * Search the internal model array (already sorted by `key`), for an object with type `value` in that `key`. To determine whether one object's property is before another, the `-` operator is used if the key is a Number type, and `<` otherwise.
  * @param {Array} sortedArray An array that has already been sorted by `key`.
  * @param {(String|Number|Date)} value The value to check on the current object's `key`.
  * @param {String} [key=id] The key to search objects by within sortedArray. Defaults to 'id'.
  * @return {Object} The found object or undefined.
  */
  _binarySearch: function (sortedArray, value, key) {
    key = key || 'id';

    if (typeof value === 'undefined') {
      throw new Error('The value for binary searching was undefined!');
    }

    if (key === 'id' && value < 0) {
      throw new Error('The value for binary searching by id was less than zero!');
    }

    if (!sortedArray.get('length')) {
      return;
    }

    var beg = 0,
        end = sortedArray.get('length') - 1,
        mid,
        checkedItem;

    while (beg <= end) {
      mid = beg + Math.floor((end - beg) / 2);
      checkedItem = sortedArray.objectAt(mid);

      if (checkedItem[key] < value) {
        beg = mid + 1;
      } else if (checkedItem[key] > value) {
        end = mid - 1;
      } else {
        return checkedItem;
      }
    }

    return;
  },

  /**
  * Finds all models in modelType with key === val.
  * `key` is optional; searches `id` key by default if given two arguments.
  * `val` is optional; returns all models if not given.
  *
  * @param {String} type The name of the modelType you wish to search through.
  * @param {String} [key=id] Optional key to search modelType. Defaults to `id` if not given.
  * @param {(Number|String|Date)} val Optional value you're looking for in `key`.
  * @returns {Array} Returns an array with any objects that matched.
  */
  all: function (type, key, val) {
    var modelType = this._store[type];

    if (!modelType) {
      throw new Error('There is no model of type ' + type + ' in the datastore!');
    }

    if (typeof val === 'undefined') {
      if (typeof key === 'undefined') {
        return modelType;
      } else if (typeof key === 'number' || !isNaN(parseInt(key, 10))) {
        // we're searching by id, leverage the fact that it's already sorted
        return [this._binarySearch(modelType, parseInt(key, 10))];
      }

      // no idea what we're trying to search, but it's not an number id
      return [];
    }

    return modelType.filterBy(key, val);
  },

  /**
  * Finds the first model in modelType with key === val.
  * `key` is optional; searches `id` key by default if given two arguments.
  *
  * @param {String} type The name of the modelType you wish to search through.
  * @param {String} [key=id] Optional key to search modelType. Defaults to `id` if not given.
  * @param {(Number|String|Date)} val The value you're looking for in `key`.
  * @returns {(Object|undefined)} Returns the object or undefined if it wasn't found.
  */
  find: function (type, key, val) {
    var modelType = this._store[type];

    if (!modelType) {
      throw new Error('There is no model of type ' + type + ' in the datastore!');
    }

    // we're searching by id, leverage the fact that it's already sorted
    if (typeof val === 'undefined') {
      if (isNaN(parseInt(key, 10))) {
        return;
      } else {
        return this._binarySearch(modelType, parseInt(key, 10));
      }
    }

    return modelType.findBy(key, val);
  },

  /**
  * Remove a model or models of the given type from internal storage.
  *
  * @param {String} type The name of the modelType you wish to remove from.
  * @param {(Object|Array)} models A model or array of models you want to remove.
  * @return
  */
  deleteModels: function (type, models) {
    var modelType = this._store[type];

    if (!modelType) {
      throw new Error('There is no model of type ' + type + ' in the datastore!');
    }

    if (Array.isArray(models)) {
      modelType.removeObjects(models);
    } else if (typeof models === 'object') {
      modelType.removeObject(models);
    }
  },

  /**
  * Delete all models of the given type from internal storage that have `key` === `val`.
  *
  * @param {String} type The name of the modelType you wish to remove models from.
  * @param {String} key The key to search on all models for a particular value.
  * @param {(Number|String|Date)} val The value the key should have in order for the model to be removed.
  * @return
  */
  seekAndDestroy: function (type, key, val) {
    var models = this.all(type, key, val);
    this.deleteModels(type, models);
  },
};

export default DataStore;
