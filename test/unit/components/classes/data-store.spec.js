import DataStore from '../../../../js/classes/data-store';

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
            expect(model).to.not.have.property('testing');
        });

        it('calls `.create()` on the factory to create the object', function () {
            function ShallowData (...args) {
                var i, obj, prop;
                for (i = 0; i < args.length; ++i) {
                    obj = args[i];
                    for (prop in obj) {
                        if (obj.hasOwnProperty(prop)) {
                            this[prop] = obj[prop];
                        }
                    }
                }
            }
            // apply variable-length arguments to constructor
            ShallowData.create = function () {
                var obj = Object.create(this.prototype);
                return this.apply(obj, arguments) || obj;
            };

            var model;
            var copy = {
                testArray: [1,2,3],
                testObject: {one: 1}
            };

            store.addType(type);
            expect(store.registerModelFactory.bind(store, type, ShallowData)).to.not.throw(Error);
            expect(store._factories[type]).to.exist;

            expect(store.createModelOfType).to.be.a('function');

            model = store.createModelOfType(type, copy);
            expect(model).to.be.an.instanceof(ShallowData);
            expect(model.constructor).to.be.equal(ShallowData);
            expect(model).to.have.property('testObject');
            expect(model.testObject).to.equal(copy.testObject);
            expect(model.testObject).to.not.have.property('two');
            copy.testObject.two = 2;
            expect(model.testObject).to.have.property('two');
            expect(model.testObject.two).to.equal(2);
            expect(model).to.have.property('testArray');
            expect(model.testArray).to.equal(copy.testArray);
            expect(model.testArray).to.have.length(3);
            copy.testArray.push(4);
            expect(model.testArray).to.have.length(4);
        });

        it('returns an Object if that factory type does not exist', function () {
            var model;

            expect(store.createModelOfType.bind(store, 'noExist')).to.not.throw(Error);

            model = store.createModelOfType(store, 'noExist');
            expect(model).to.be.an('object');
            expect(model).to.be.an.instanceof(Object);
            expect(model.constructor).to.be.equal(Object);
        });

        it('performs deep copy of arguments properties if that factory type does not exist', function () {
            var model;
            var copy = {
                testArray: [1,2,3],
                testObject: {one: 1}
            };

            expect(store.createModelOfType.bind(store, 'noExist', copy)).to.not.throw(Error);

            model = store.createModelOfType(store, 'noExist', copy);
            expect(model).to.be.an('object');
            expect(model).to.be.an.instanceof(Object);
            expect(model.constructor).to.be.equal(Object);
            expect(model).to.have.property('testObject');
            expect(model.testObject).to.not.equal(copy.testObject);
            expect(model.testObject).to.not.have.property('two');
            copy.testObject.two = 2;
            expect(model.testObject).to.not.have.property('two');
            expect(model).to.have.property('testArray');
            expect(model.testArray).to.not.equal(copy.testArray);
            expect(model.testArray).to.have.length(3);
            copy.testArray.push(4);
            expect(model.testArray).to.have.length(3);
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

        it('knows if it has a type', function () {
            var newType = 'testType3';
            store.addType(newType);
            store.hasType(type).should.be.ok;
            store.hasType(newType).should.be.ok;
        });

        it('returns the names of all types', function () {
            store.allTypes().should.deep.equal([
                'testType',
                'testType2',
                'testType3',
            ]);
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
            var sorted;
            var models = [{
                id: 1,
                sort: 10,
                string: 'act',
            }, {
                id: 2,
                sort: 9,
                string: 'bad',
            }, {
                id: 3,
                sort: 8,
                string: 'art',
            }, {
                id: 4,
                sort: 7,
                string: 'sushi',
            }, {
                id: 5,
                sort: 6,
                string: 'farm',
            }];

            store.load(type, models);
            modelType.length.should.equal(5);

            // returns a sorted array using a given modelType
            sorted = store._sortBy(modelType, 'sort');
            expect(sorted.length).to.equal(models.length);
            expect(sorted.map(obj => obj.sort)).to.deep.equal([6,7,8,9,10]);
            sorted = store._sortBy(modelType, 'string');
            expect(sorted.length).to.equal(models.length);
            expect(sorted.map(obj => obj.string)).to.deep.equal(['act', 'art', 'bad', 'farm', 'sushi']);

            // returns a sorted array using a given string
            sorted = store._sortBy(type, 'sort');
            expect(sorted.length).to.equal(models.length);
            expect(sorted.map(obj => obj.sort)).to.deep.equal([6,7,8,9,10]);
            sorted = store._sortBy(type, 'string');
            expect(sorted.length).to.equal(models.length);
            expect(sorted.map(obj => obj.string)).to.deep.equal(['act', 'art', 'bad', 'farm', 'sushi']);
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

    describe('adding objects', function () {
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

        it('adds multiple models in sorted order', function () {
            var i, all;
            var models = [{
                id: 4,
            }, {
                id: 3,
            }, {
                id: 1,
            }, {
                id: 5,
            }, {
                id: 2,
            }, {
                id: 0,
            }];

            store.load(type, models);
            store.all(type).length.should.equal(6);

            all = store.all(type);

            for (i = 0; i < all.length; ++i) {
                all[i].id.should.equal(i);
            }
        });

        it('adds multiple models in sorted order when the id is a string type', function () {
            var all;
            var models = [{
                id: 'act',
            }, {
                id: 'bad',
            }, {
                id: 'art',
            }, {
                id: 'biscuit',
            }, {
                id: 'sushi',
            }, {
                id: 'farm',
            }];

            store.load(type, models);
            store.all(type).length.should.equal(6);

            all = store.all(type);
            all.map(obj => obj.id).should.deep.equal(['act', 'art', 'bad', 'biscuit', 'farm', 'sushi']);
        });

        it('adding objects with collisions performs a merge', function () {
            var i, all;
            var models = [{
                id: 4,
                title: 'fourth',
            }, {
                id: 3,
                title: 'third',
            }, {
                id: 1,
                title: 'first',
            }, {
                id: 2,
                title: 'second',
            }];

            var extraModels = [{
                id: 5,
                title: 'fifth',
            }, {
                id: 4,
                title: 'four-th',
                extra: 'data',
            }, {
                id: 0,
                title: 'zeroeth',
            }, {
                id: 1,
                title: 'thirst',
                extra: 'datum',
            }];

            store.load(type, models);
            all = store.all(type);
            all.length.should.equal(4);

            for (i = 0; i < all.length; ++i) {
                all[i].id.should.equal(i+1);
            }

            store.load(type, extraModels);
            all = store.all(type);
            all.length.should.equal(6);

            for (i = 0; i < all.length; ++i) {
                all[i].id.should.equal(i);
                if (i === 1) {
                    all[i].title.should.equal('thirst');
                    all[i].should.have.property('extra');
                    all[i].extra.should.equal('datum');
                }
                if (i === 4) {
                    all[i].title.should.equal('four-th');
                    all[i].should.have.property('extra');
                    all[i].extra.should.equal('data');
                }
            }
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

        it('adds multiple models when the DataStore is not empty and the id is a string type', function () {
            var fill = {
                id: 'act',
                title: 'test title 1'
            };
            var models = [{
                id: 'sushi',
                title: 'test title 1'
            }, {
                id: 'farm',
                title: 'test title 2'
            }];

            store.load(type, fill);
            store.all(type).length.should.equal(1);

            store.load(type, models);
            store.all(type).length.should.equal(3);

            store.all(type).map(obj => obj.id).should.deep.equal(['act', 'farm', 'sushi']);
        });

        it('does nothing when adding an empty array', function () {
            store.load(type, []);
            store.all(type).length.should.equal(0);
        });

        it('merges plain objects', function () {
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

        it('merges plain objects when id is a string type', function () {
            var retrieved;
            var fill = {
                id: 'sushi',
                title: 'title 1',
                myAttr: 'old'
            };
            var duplicate = {
                id: 'sushi',
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

        it('merges using a deep extend only', function() {
            var retrieved;
            var fill = {
                id: 'sushi',
                title: 'title 1',
                obj: {
                    attr: 'hi',
                    innerArray: [1,2,3],
                    innerObj: {x: 1, y: 2},
                },
                array: [1,2,{x: 1}]
            };
            var duplicate = {
                id: 'sushi',
                title: 'new title',
                obj: {
                    attr: 'hello',
                    another: 'hi',
                    innerArray: [4,5],
                    innerObj: {y:3, z:4},
                },
                anotherObj: {
                    attr: 'hey',
                    another: [1,2,3],
                },
                array: [7,8,{y:2}, ['z']],
            };

            store.load(type, fill);
            store.all(type).length.should.equal(1);

            retrieved = store.all(type)[0];
            expect(retrieved).to.exist;
            retrieved.id.should.equal(fill.id);
            retrieved.title.should.equal(fill.title);
            retrieved.obj.should.deep.equal(fill.obj);
            retrieved.obj.should.not.equal(fill.obj);
            retrieved.array.should.deep.equal(fill.array);
            retrieved.array.should.not.equal(fill.array);
            expect(retrieved.anotherObj).to.not.exist;

            store.load(type, duplicate);
            store.all(type).length.should.equal(1);

            retrieved = store.all(type)[0];
            expect(retrieved).to.exist;
            retrieved.obj.should.deep.equal(duplicate.obj);
            retrieved.obj.should.not.equal(duplicate.obj);
            retrieved.obj.innerArray.should.not.equal(duplicate.obj.innerArray);
            retrieved.obj.innerObj.should.not.equal(duplicate.obj.innerObj);
            retrieved.anotherObj.should.deep.equal(duplicate.anotherObj);
            retrieved.anotherObj.should.not.equal(duplicate.anotherObj);
            retrieved.anotherObj.another.should.not.equal(duplicate.anotherObj.another);
            retrieved.array.should.deep.equal(duplicate.array);
            retrieved.array.should.not.equal(duplicate.array);
            retrieved.array[2].should.not.equal(duplicate.array[2]);
            retrieved.array[3].should.not.equal(duplicate.array[3]);
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
            expect(store._getInsertIndex([], 1)).to.equal(0);

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

            // the value passed in must be of the same type as that held by the key searched
            expect(store._getInsertIndex.bind(store, newSort, 'string', field)).to.throw(Error);
        });

        it('finds the rightmost index when the id is a string type', function () {
            var i, rIndex;
            var testIds = ['aardvark', 'add', 'ask', 'bard', 'cards', 'fresh', 'tortellini'];
            var models = [{
                id: 'act',
            }, {
                id: 'bad',
            }, {
                id: 'art',
            }, {
                id: 'biscuit',
            }, {
                id: 'sushi',
            }, {
                id: 'farm',
            }];

            store.load(type, models);
            modelType.length.should.equal(models.length);

            // preliminary checks before actual searching is done
            expect(store._getInsertIndex.bind(store, modelType)).to.throw(Error);
            expect(store._getInsertIndex([], 'stringId')).to.equal(0);

            // searching by `id`
            for (i = 0; i < testIds.length; ++i) {
                rIndex = store._getInsertIndex(modelType, testIds[i]);
                expect(rIndex).to.be.a('number');
                expect(rIndex).to.equal(i);
            }

            // the value passed in must be of the same type as that held by the key searched
            expect(store._getInsertIndex.bind(store, modelType, 1)).to.throw(Error);
        });

        it('correctly peforms binary search', function () {
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
                find = newSort.filter(obj => obj.sort === i);
                expect(Array.isArray(find)).to.be.ok;
                expect(find).to.have.length(1);
                find = find[0];
                bSearch = store._binarySearch(newSort, i, field);
                expect(find).to.equal(bSearch);
            }

            expect(store._binarySearch(newSort, 5, field)).to.not.exist;
            expect(store._binarySearch(newSort, 11, field)).to.not.exist;
        });

        it('correctly performs binary search when the id is a string type', function () {
            var i, bSearch, searchObjs;
            var models = [{
                id: 'act',
            }, {
                id: 'bad',
            }, {
                id: 'art',
            }, {
                id: 'biscuit',
            }, {
                id: 'sushi',
            }, {
                id: 'farm',
            }];

            searchObjs = models.slice();
            searchObjs.sort((a, b) => a.id < b.id ? -1 : 1);

            store.load(type, models);
            modelType.length.should.equal(models.length);

            // preliminary checks before actual searching is done
            expect(store._binarySearch.bind(store, modelType)).to.throw(Error);
            expect(store._binarySearch([], 'stringId')).to.not.exist;

            // searching by `id`
            for (i = 0; i < searchObjs.length; ++i) {
                bSearch = store._binarySearch(modelType, searchObjs[i].id);
                expect(bSearch).to.deep.equal(searchObjs[i]);
                expect(bSearch).to.equal(modelType[i]);
            }

            // the value passed in must be of the same type as that held by the key searched
            expect(store._binarySearch(modelType, 1)).to.not.exist;
        });

        it('finds a single model using search criteria', function () {
            var i, find, spy;
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
            for (i = 0; i < models.length; ++i) {
                find = store.find(type, models[i].id);
                expect(find).to.exist;
                expect(find.id).to.equal(models[i].id);
            }

            // returns undefined when given a non-existent id
            find = store.find(type, 999);
            expect(find).to.not.exist;

            spy.should.have.callCount(7);
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

            // returns undefined when given an id that doesn't match the value held by the key `id`
            find = store.find(type, 'abcxyz');
            expect(find).to.not.exist;

            // returns undefined when given a value that doesn't match the value held by the key
            find = store.find(type, 'abcxyz', 'sort');
            expect(find).to.not.exist;
        });

        it('finds an object when the id is a string type', function () {
            var i, find, spy;
            var models = [{
                id: 'act',
            }, {
                id: 'bad',
            }, {
                id: 'art',
            }, {
                id: 'biscuit',
            }, {
                id: 'sushi',
            }, {
                id: 'farm',
            }];

            store.load(type, models);

            spy = sinon.spy(store, '_binarySearch');

            // returns a model with a given id
            for (i = 0; i < models.length; ++i) {
                find = store.find(type, models[i].id);
                expect(find).to.exist;
                expect(find.id).to.equal(models[i].id);
            }

            // returns undefined when given a non-existent id
            find = store.find(type, 'heyo');
            expect(find).to.not.exist;

            spy.should.have.callCount(7);
            store._binarySearch.restore();

            // returns undefined when given an id that doesn't match the value held by the key `id`
            find = store.find(type, 1);
            expect(find).to.not.exist;
        });

        it('gets all models matching search criteria', function () {
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
            expect(find).to.deep.equal(models);

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

            // returns an empty array when given an id that doesn't exist
            find = store.all(type, 1234);
            expect(find).to.be.empty;
            find = store.all(type, '1234');
            expect(find).to.be.empty;
            find = store.all(type, 'abcxyz');
            expect(find).to.be.empty;
        });

        it('finds all models when the id is a string type', function () {
            var find, sortedModels;
            var models = [{
                id: 'act',
            }, {
                id: 'bad',
            }, {
                id: 'art',
            }, {
                id: 'biscuit',
            }, {
                id: 'sushi',
            }, {
                id: 'farm',
            }];

            store.load(type, models);

            modelType.length.should.equal(models.length);

            // returns the modelType itself
            find = store.all(type);
            sortedModels = models.slice();
            sortedModels.sort((a, b) => a.id < b.id ? -1 : 1);
            expect(find).to.deep.equal(sortedModels);

            // returns all models with a given id
            find = store.all(type, models[0].id);
            expect(find).to.have.length(1);
            expect(find[0].id).to.equal(models[0].id);

            // returns an empty array when given an id that doesn't exist
            find = store.all(type, 1234);
            expect(find).to.be.empty;
            find = store.all(type, '1234');
            expect(find).to.be.empty;
            find = store.all(type, 'abcxyz');
            expect(find).to.be.empty;
        });
    });

    describe('deleting models', function () {
        beforeEach(function () {
            store.clear();
        });

        it('deletes the models given', function () {
            var splicedModels;
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
            modelType.should.deep.equal(models);

            // remove a single object
            store.deleteModels(type, models[5]);
            modelType.length.should.equal(models.length-1);
            models.splice(5, 1);
            modelType.should.deep.equal(models);
            modelType.length.should.equal(models.length);

            // remove multiple objects
            splicedModels = models.splice(1, 3);
            modelType.length.should.equal(models.length+3);
            store.deleteModels(type, splicedModels);
            modelType.should.deep.equal(models);
            modelType.length.should.equal(models.length);
        });

        it('deletes models when the id is a string type', function() {
            var splicedModels;
            var models = [{
                id: 'act',
            }, {
                id: 'art',
            }, {
                id: 'bad',
            }, {
                id: 'biscuit',
            }, {
                id: 'farm',
            }, {
                id: 'sushi',
            }];

            store.load(type, models);
            modelType.length.should.equal(models.length);
            modelType.should.deep.equal(models);

            // remove a single object
            store.deleteModels(type, models[5]);
            modelType.length.should.equal(models.length-1);
            models.splice(5, 1);
            modelType.should.deep.equal(models);
            modelType.length.should.equal(models.length);

            // remove multiple objects
            splicedModels = models.splice(1, 3);
            modelType.length.should.equal(models.length+3);
            store.deleteModels(type, splicedModels);
            modelType.should.deep.equal(models);
            modelType.length.should.equal(models.length);
        });

        it('deletes models that have a key equal to a certain value', function () {
            var models = [{
                id: 1,
                extra: 1,
            }, {
                id: 2,
                extra: 2,
            }, {
                id: 3,
                extra: 2,
            }, {
                id: 4,
                extra: 3,
            }, {
                id: 5,
                extra: 4,
            }, {
                id: 6,
                extra: 4,
            }, {
                id: 7,
                extra: 5,
            }];

            store.load(type, models);
            modelType.length.should.equal(models.length);
            modelType.should.deep.equal(models);

            // remove a whole set of models whose `id` === 1
            store.seekAndDestroy(type, 1);
            modelType.length.should.equal(models.length-1);
            models.splice(0, 1);
            modelType.should.deep.equal(models);
            modelType.length.should.equal(models.length);

            // remove a single model using a named key
            store.seekAndDestroy(type, 'extra', 5);
            modelType.length.should.equal(models.length-1);
            models.splice(models.length-1, 1);
            modelType.should.deep.equal(models);
            modelType.length.should.equal(models.length);

            // remove whole sets of models using a named key
            store.seekAndDestroy(type, 'extra', 2);
            modelType.length.should.equal(models.length-2);
            models.splice(0, 2);
            modelType.should.deep.equal(models);
            modelType.length.should.equal(models.length);
            store.seekAndDestroy(type, 'extra', 4);
            modelType.length.should.equal(models.length-2);
            models.splice(models.length-2, 2);
            modelType.should.deep.equal(models);
            modelType.length.should.equal(models.length);
        });
    });
});
