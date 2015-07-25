import DataStore from '../../js/data-store';

// this will test certain functions that are assumed to work in following test categories
describe('DataStore Prelim Tests', function () {
  describe('internal store functions', function () {
    var type = 'testType';
    var store;

    beforeEach(function () {
      store = new DataStore();
    });

    it('has the private variable, _store', function () {
      expect(store._store).to.exist;
    });

    it('adds a datatype to the store', function () {
      expect(store._store[type]).to.not.exist;
      expect(store.addType).to.be.a('function');
      store.addType(type);
      expect(store._store[type]).to.exist;
    });

    it('does not allow a datatype to be added twice', function () {
      expect(store.addType.bind(store, type)).to.not.throw(Error);
      expect(store.addType.bind(store, type)).to.throw(Error);
    });
  });

  describe('registering model factories', function () {
    var store;
    var type = 'testType';

    function Factory(){}
    Factory.create = function () {
        return new this();
    };

    beforeEach(function () {
      store = new DataStore();
    });

    it('has a private variable, _factories', function () {
      expect(store._factories).to.exist;
    });

    it('fails for a non-existent type', function () {
      expect(store.registerModelFactory.bind(store, 'noExist', Factory)).to.throw(Error);
    });

    it('fails if one already exists', function () {
      store.addType(type);
      // register it once
      store.registerModelFactory(type, Factory);
      // try to register it again
      expect(store.registerModelFactory.bind(store, type, Factory)).to.throw(Error);
    });

    it('fails if the factory is not correct', function () {
      var bad = function(){};
      store.addType(type);
      expect(store.registerModelFactory.bind(store, type, 'oops!')).to.throw(Error);
      expect(store.registerModelFactory.bind(store, type, bad)).to.throw(Error);
    });

    it('registers a new model factory', function () {
      store.addType(type);
      expect(store.registerModelFactory.bind(store, type, Factory)).to.not.throw(Error);
      expect(store._factories[type]).to.exist;
      expect(store._factories[type]).to.equal(Factory);
    });

    it('returns an object of that type', function () {
      var bad = function(){};
      var model;

      store.addType(type);
      expect(store.registerModelFactory.bind(store, type, Factory)).to.not.throw(Error);
      expect(store._factories[type]).to.exist;

      expect(store.createModelOfType).to.be.a('function');

      model = store.createModelOfType(type, { testing: '123' });
      expect(model).to.be.an.instanceof(Factory);
      expect(model).to.not.be.an.instanceof(bad);
    });

    it('returns an Object if that type does not exist', function () {
      var model;

      expect(store.createModelOfType.bind(store, 'noExist', { testing: '123' })).to.not.throw(Error);

      model = store.createModelOfType(store, 'noExist', { testing: '123' });
      expect(model).to.be.an('object');
      expect(model).to.be.an.instanceof(Object);
      expect(model.constructor).to.be.equal(Object);
    });
  });
});

// these tests assume that the DataStore sorts its model types' models by id
describe('DataStore', function () {
  var store;
  var type = 'testType';
  var modelType;

  before(function () {
    // save test time by only using one instance
    store = new DataStore();

    // assumes addType works and _store exists, but the speedup of
    // not having to create and destroy new DataStores to check is
    // seriously worth this assumption.
    store.addType(type);
    modelType = store._store[type];
  });

  after(function () {
    modelType = null;
    store.clear();
    store = null;
  });

  describe('working with model types', function () {
    beforeEach(function () {
      store.clear();
    });

    it('adds a new type', function () {
      var type = 'testType2';
      store.addType(type);
      expect(store._store[type]).to.exist;
      expect(store.all.bind(store, type)).to.not.throw(Error);
      store.all(type).should.exist;
    });

    it('fails to get a non-existent type', function () {
      expect(store.all.bind(store, 'noExist')).to.throw(Error);
    });

    it('fails to load models for a non-existent type', function () {
      var model = {
        id: 1
      };
      expect(store.load.bind(store, 'noExist', model)).to.throw(Error);
    });

    it('clears a type of its models', function () {
      var model = {
        id: 1
      };
      store.load(type, model);
      store.all(type).length.should.equal(1);
      store.clear();
      store.all(type).length.should.equal(0);
    });

    it('sorts a modelType container by a given key', function () {
      var key = 'sort';
      var sorted;
      var models = [{
        id: 1,
        sort: 10
      }, {
        id: 2,
        sort: 9
      }, {
        id: 3,
        sort: 8
      }, {
        id: 4,
        sort: 7
      }, {
        id: 5,
        sort: 6
      }];

      store.load(type, models);
      modelType.length.should.equal(5);

      // returns a sorted array using a given modelType
      sorted = store._sortBy(modelType, key);
      expect(sorted.length).to.equal(models.length);
      expect(sorted.map(obj => obj.sort)).to.deep.equal([6,7,8,9,10]);

      // returns a sorted array using a given string
      sorted = store._sortBy(type, key);
      expect(sorted.length).to.equal(models.length);
      expect(sorted.map(obj => obj.sort)).to.deep.equal([6,7,8,9,10]);
    });
  });

  describe('making a copy of another object', function () {
    it('returns a deep copy of a newly-created item based off of a plain object', function () {
      var toCopy = { test: [{deep: 'copy'}] },
          newModel;

      newModel = store.createModelOfType(type, toCopy);

      expect(newModel.constructor).to.equal(Object);
      expect(newModel).to.deep.equal({ test: [{deep: 'copy'}] });
      expect(newModel).to.not.equal(toCopy);
    });

    it('ignores non-objects when copying properties to another object', function () {
      var newModel = store.createModelOfType(type, 'anondado', [], { test: 1 });
      expect(newModel).to.be.an('object');
      expect(newModel.constructor).to.equal(Object);
      expect(newModel).to.deep.equal({ test: 1 });
    });
  });

  describe('adding elements', function () {
    beforeEach(function () {
      store.clear();
    });

    it('adds a new model', function () {
      var retrieved;
      var model = {
        id: 999,
        title: 'test title'
      };

      store.load(type, model);
      store.all(type).length.should.equal(1);

      retrieved = store.all(type)[0];
      expect(retrieved).to.exist;
      retrieved.id.should.equal(model.id);
      retrieved.title.should.equal(model.title);
    });

    it('adds a new model wrapped in an array', function () {
      var retrieved;
      var model = [{
        id: 999,
        title: 'test title'
      }];

      store.load(type, model);
      store.all(type).length.should.equal(1);

      retrieved = store.all(type)[0];
      expect(retrieved).to.exist;
      retrieved.id.should.equal(model[0].id);
      retrieved.title.should.equal(model[0].title);
    });

    it('adds a new model when the DataStore is not empty', function () {
      var retrieved;
      var fill = {
        id: 123,
        title: 'test title 1'
      };
      var model = {
        id: 999,
        title: 'test title 2'
      };

      store.load(type, fill);
      store.all(type).length.should.equal(1);

      store.load(type, model);
      store.all(type).length.should.equal(2);

      retrieved = store.all(type)[0];
      expect(retrieved).to.exist;
      retrieved.id.should.equal(fill.id);
      retrieved.title.should.equal(fill.title);

      retrieved = store.all(type)[1];
      expect(retrieved).to.exist;
      retrieved.id.should.equal(model.id);
      retrieved.title.should.equal(model.title);
    });

    it('adds a new model wrapped in an array when the DataStore is not empty', function () {
      var retrieved;
      var fill = {
        id: 123,
        title: 'test title 1'
      };
      var model = [{
        id: 999,
        title: 'test title 2'
      }];

      store.load(type, fill);
      store.all(type).length.should.equal(1);

      store.load(type, model);
      store.all(type).length.should.equal(2);

      retrieved = store.all(type)[0];
      expect(retrieved).to.exist;
      retrieved.id.should.equal(fill.id);
      retrieved.title.should.equal(fill.title);

      retrieved = store.all(type)[1];
      expect(retrieved).to.exist;
      retrieved.id.should.equal(model[0].id);
      retrieved.title.should.equal(model[0].title);
    });

    it('adds multiple models', function () {
      var retrieved;
      var models = [{
        id: 123,
        title: 'test title 1'
      }, {
        id: 999,
        title: 'test title 2'
      }];

      store.load(type, models);
      store.all(type).length.should.equal(2);

      retrieved = store.all(type)[0];
      expect(retrieved).to.exist;
      retrieved.id.should.equal(models[0].id);
      retrieved.title.should.equal(models[0].title);

      retrieved = store.all(type)[1];
      expect(retrieved).to.exist;
      retrieved.id.should.equal(models[1].id);
      retrieved.title.should.equal(models[1].title);
    });

    it('adds multiple models when the DataStore is not empty', function () {
      var retrieved;
      var fill = {
        id: 456,
        title: 'test title 1'
      };
      var models = [{
        id: 123,
        title: 'test title 1'
      }, {
        id: 999,
        title: 'test title 2'
      }];

      store.load(type, fill);
      store.all(type).length.should.equal(1);

      store.load(type, models);
      store.all(type).length.should.equal(3);

      retrieved = store.all(type)[0];
      expect(retrieved).to.exist;
      retrieved.id.should.equal(models[0].id);
      retrieved.title.should.equal(models[0].title);

      retrieved = store.all(type)[1];
      expect(retrieved).to.exist;
      retrieved.id.should.equal(fill.id);
      retrieved.title.should.equal(fill.title);

      retrieved = store.all(type)[2];
      expect(retrieved).to.exist;
      retrieved.id.should.equal(models[1].id);
      retrieved.title.should.equal(models[1].title);
    });

    it('does nothing when adding an empty array', function () {
      store.load(type, []);
      store.all(type).length.should.equal(0);
    });

    it('merges plain objects when asked', function () {
      var retrieved;
      var fill = {
        id: 1,
        title: 'title 1',
        myAttr: 'old'
      };
      var duplicate = {
        id: 1,
        title: 'new title',
        myAttr: 'new',
        newAttr: 'i am new here!'
      };

      store.load(type, fill);
      store.all(type).length.should.equal(1);

      retrieved = store.all(type)[0];
      expect(retrieved).to.exist;
      retrieved.id.should.equal(fill.id);
      retrieved.title.should.equal(fill.title);
      retrieved.myAttr.should.equal(fill.myAttr);
      expect(retrieved.newAttr).to.not.exist;

      store.load(type, duplicate);
      store.all(type).length.should.equal(1);

      retrieved = store.all(type)[0];
      expect(retrieved).to.exist;
      retrieved.id.should.equal(duplicate.id);
      retrieved.title.should.equal(duplicate.title);
      retrieved.myAttr.should.equal(duplicate.myAttr);
      retrieved.newAttr.should.equal(duplicate.newAttr);
    });

    it('sorts objects based on an arbitrary key', function () {
      var models = [{
        id: 1,
        sort: 10
      }, {
        id: 2,
        sort: 9
      }, {
        id: 3,
        sort: 8
      }, {
        id: 4,
        sort: 7
      }, {
        id: 5,
        sort: 6
      }];

      function mapFunction (item) {
        return [item.id, item.sort];
      }

      store.load(type, models);
      store.all(type).length.should.equal(5);

      modelType.map(mapFunction).should.deep.equal([[1,10], [2,9], [3,8], [4,7], [5,6]]);
      store._sortBy(type, 'sort').map(mapFunction).should.deep.equal([[5,6], [4,7], [3, 8], [2, 9], [1,10]]);
    });
  });

  describe('searching for models', function () {
    beforeEach(function () {
      store.clear();
    });

    it('can find the rightmost index of a matching object', function() {
      var newSort;
      var find, rIndex, field, i;
      var models = [{
        id: 1,
        sort: 10
      }, {
        id: 2,
        sort: 9
      }, {
        id: 3,
        sort: 8
      }, {
        id: 4,
        sort: 7
      }, {
        id: 5,
        sort: 6
      }];

      store.load(type, models);
      modelType.length.should.equal(models.length);

      // preliminary checks before actual searching is done
      expect(store._getInsertIndex.bind(store, modelType)).to.throw(Error);
      expect(store._getInsertIndex([], 1)).to.equal(-1);

      // searching by `id`
      for (i = 1; i < 6; ++i) {
        // find rightmost index manually
        find = void 0;
        modelType.forEach((obj, idx) => {
          if (obj.id === i) {
            find = idx+1;
          }
        });
        expect(find).to.be.a('number');
        expect(find).to.equal(i);
        rIndex = store._getInsertIndex(modelType, i);
        expect(rIndex).to.be.a('number');
        expect(rIndex).to.equal(i);
      }

      expect(store._getInsertIndex(modelType, 0)).to.equal(0);
      expect(store._getInsertIndex(modelType, 6)).to.equal(modelType.length);

      // searching by `sort`
      newSort = modelType.slice().sort((a, b) => a.sort - b.sort);
      field = 'sort';

      for (i = 6; i < 11; ++i) {
        // find rightmost index manually
        find = void 0;
        newSort.forEach((obj, idx) => {
          if (obj.sort === i) {
            find = idx+1;
          }
        });
        expect(find).to.be.a('number');
        expect(find).to.equal(i-5);
        rIndex = store._getInsertIndex(newSort, i, field);
        expect(rIndex).to.be.a('number');
        expect(rIndex).to.equal(i-5);
      }

      expect(store._getInsertIndex(newSort, 5, field)).to.equal(0);
      expect(store._getInsertIndex(newSort, 11, field)).to.equal(newSort.length);
    });

    it('binary search works', function () {
      var newSort;
      var find, bSearch, field, i;
      var models = [{
        id: 1,
        sort: 10
      }, {
        id: 2,
        sort: 9
      }, {
        id: 3,
        sort: 8
      }, {
        id: 4,
        sort: 7
      }, {
        id: 5,
        sort: 6
      }];

      store.load(type, models);
      modelType.length.should.equal(models.length);

      // preliminary checks before actual searching is done
      expect(store._binarySearch.bind(store, modelType)).to.throw(Error);
      expect(store._binarySearch([], 1)).to.not.exist;

      // searching by `id`
      for (i = 1; i < 6; ++i) {
        find = modelType.filter(obj => obj.id === i);
        expect(Array.isArray(find)).to.be.ok;
        expect(find).to.have.length(1);
        find = find[0];
        bSearch = store._binarySearch(modelType, i);
        expect(find).to.equal(bSearch);
      }

      expect(store._binarySearch(modelType, 0)).to.not.exist;
      expect(store._binarySearch(modelType, 6)).to.not.exist;

      // searching by `sort`
      newSort = modelType.slice().sort((a, b) => a.sort - b.sort);
      field = 'sort';

      for (i = 6; i < 11; ++i) {
        find = newSort.filter(obj => obj.id === i);
        expect(Array.isArray(find)).to.be.ok;
        expect(find).to.have.length(1);
        find = find[0];
        bSearch = store._binarySearch(newSort, i, field);
        expect(find).to.equal(bSearch);
      }

      expect(store._binarySearch(newSort, 5, field)).to.not.exist;
      expect(store._binarySearch(newSort, 11, field)).to.not.exist;
    });

    it('returns a single model using search criteria', function () {
      var find;
      var spy;
      var models = [{
        id: 1,
        sort: 10
      }, {
        id: 2,
        sort: 9
      }, {
        id: 3,
        sort: 8
      }, {
        id: 4,
        sort: 7
      }, {
        id: 5,
        sort: 6
      }, {
        id: 6,
        sort: 6
      }];

      store.load(type, models);

      spy = sinon.spy(store, '_binarySearch');

      // returns a model with a given id
      find = store.find(type, models[0].id);
      expect(find).to.exist;
      expect(find.id).to.equal(models[0].id);

      // returns undefined when given a non-existent id
      find = store.find(type, 999);
      expect(find).to.not.exist;

      spy.should.have.been.calledTwice;
      store._binarySearch.restore();

      // returns a model by a given key
      find = store.find(type, 'sort', models[models.length-1].sort);
      expect(find).to.exist;
      // models.length-2 should be the first result returned
      expect(find.id).to.equal(models[models.length-2].id);
      expect(find.sort).to.equal(models[models.length-2].sort);

      // returns undefined when given a non-existent key
      find = store.find(type, 'noExist', 999);
      expect(find).to.not.exist;

      // returns undefined when given an id that doesn't convert to a number
      find = store.find(type, 'abcxyz');
      expect(find).to.not.exist;
    });

    it('returns all models using search criteria', function () {
      var find;
      var models = [{
        id: 1,
        sort: 10
      }, {
        id: 2,
        sort: 9
      }, {
        id: 3,
        sort: 8
      }, {
        id: 4,
        sort: 7
      }, {
        id: 5,
        sort: 6
      }, {
        id: 6,
        sort: 6
      }];

      store.load(type, models);

      modelType.length.should.equal(models.length);

      // returns the modelType itself
      find = store.all(type);
      expect(find).to.equal(modelType);

      // returns all models with a given id
      find = store.all(type, models[0].id);
      expect(find).to.have.length(1);
      expect(find[0].id).to.equal(models[0].id);

      // returns all models by a given key
      find = store.all(type, 'sort', models[models.length-1].sort);
      expect(find).to.have.length(2);
      expect(find[0].sort).to.equal(models[models.length-1].sort);
      expect(find[1].sort).to.equal(models[models.length-1].sort);

      // returns an empty array when given a non-existent key
      find = store.all(type, 'noExist', 999);
      expect(find).to.be.empty;

      // returns an empty array when given an id that doesn't convert to a number
      find = store.all(type, 'abcxyz');
      expect(find).to.be.empty;
    });
  });
});
