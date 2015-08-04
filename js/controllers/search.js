import DataStore from 'classes/data-store';
import SearchResult from 'classes/search-result';
import Levenshtein from 'classes/levenshtein';
import SearchView from 'views/search';
import FilterView from 'views/filter';
import ListView from 'views/list';
import * as templates from 'templates';
import ajax from 'utils/ajax';
import shuffle from 'utils/shuffle';

class SearchController {
    constructor(opts = {}) {
        // local data
        this.lastSearch = '';
        // hold the current search results to render out chunks at a time
        this.currentSearchResults = null;
        // amount of models to render on infinite scroll trigger
        this.chunkSize = 1;

        // models
        this.store = new DataStore();

        // views
        this.searchView = new SearchView({
            el: opts.searchEl,
        });
        this.filterView = new FilterView({
            el: opts.filterEl,
        });
        this.orgListView = new ListView({
            el: opts.orgListEl,
            template: templates.OrgListItem,
        });
        this.projectListView = new ListView({
            el: opts.projectListEl,
            template: templates.ProjectListItem,
        });
    }

    init() {
        return this.initStorage().then(() => {
            this.initLevenshtein();
            this.initTextBox();
            this.initLists();
            this.renderSearch('');
        });
    }

    initStorage() {
        var store = this.store;
        store.addType('org');
        store.addType('project');
        store.addType('search');
        store.registerModelFactory('search', SearchResult);

        return Promise.all([
            ajax({url: '/data/organizations.json'}),
            ajax({url: '/data/projects.json'}),
        ]).then(([orgs, projects]) => {
            // shuffle all orgs and projects to
            // give each a fair chance at being seen
            var id = 1;
            // build list of filters for user to use
            var categories = [];

            shuffle(projects);
            projects.forEach(proj => {
                proj.id = id++;
                if (proj.organizationId) {
                    proj.organization = orgs[proj.organizationId-1];
                    delete proj.organizationId;
                }
            });

            id = 1;
            shuffle(orgs);
            orgs.forEach(org => {
                var currCategories = org.categories;
                var i;
                org.id = id++;
                for (i = 0; i < currCategories.length; ++i) {
                    categories.push(currCategories[i]);
                }
            });

            store.load('org', orgs);
            store.load('project', projects);
            store.load('search', {
                // initialize search results for empty search text box
                id: '',
                org: store.all('org'),
                project: store.all('project'),
            });

            this.currentSearchResults = store.find('search', '');
            this.filterView.render(categories);
        });
    }

    initLevenshtein() {
        function searchMatchCost(c1, c2) {
            if (c1 === c2) {
                return 0;
            }

            // don't substitute a space char; keeps search words separate
            if (c1 === ' ') {
                return Infinity;
            }

            return 1;
        }

        function searchInsertCost(c, cBefore, cAfter) {
            // insertion at a word boundary is free
            if (cBefore === null || cAfter === null || cBefore === ' ' || cAfter === ' ') {
                return 0;
            }
            // prefer insertions inside of a word to a substitution
            return 0.9;
        }

        var levOpts = {
            type: 'substring',
            caseSensitive: false
        };
        var queryLev = this.queryLev = new Levenshtein(levOpts);
        var searchLev = this.searchLev = new Levenshtein(levOpts);

        queryLev.set('insertCost', 0);
        queryLev.set('deleteCost', Infinity);

        searchLev.set('matchCost', searchMatchCost);
        searchLev.set('insertCost', searchInsertCost);
        searchLev.set('deleteCost', 1);
    }

    initTextBox() {
        this.searchView.on('keyup', this.handleKeyup.bind(this));
    }

    initLists() {
        var sendNextChunk = this.sendNextChunk.bind(this);
        this.orgListView.on('requestNextChunk', sendNextChunk);
        this.projectListView.on('requestNextChunk', sendNextChunk);
    }

    sendNextChunk(list, startIndex) {
        var dataset;

        if (list === this.orgListView) {
            dataset = this.currentSearchResults.org;
        } else if (list === this.projectListView) {
            dataset = this.currentSearchResults.project;
        } else {
            throw new Error('Tried to access non-existent model type from the current search results dataset.');
        }

        list.receiveNextChunk(dataset.slice(startIndex, startIndex + this.chunkSize));
    }

    handleKeyup(evt) {
        this.renderSearch(evt.target.value);
    }

    renderSearch(searchValue) {
        var lastSearch = this.lastSearch;
        var store = this.store;
        var model;

        // if search has been previously cached in the database, use it
        model = store.find('search', searchValue);

        if (!model) {
            // if only inserts and matches are used to transform the lastSearch...
            if (this.queryLev.process(lastSearch, searchValue).totalCost() === 0) {
                // we're filtering the last results further
                model = store.find('search', lastSearch);
            } else {
                // we're widening the last results, start from scratch
                model = store.find('search', '');
            }

            // perform string approximation on models' attributes
            // and store the search results back into the store
            store.load('search', this.approximate(model, searchValue));
            model = store.all('search', searchValue);
        }

        // apply user-supplied filters and sorts to the search results
        model = this.applyFilters(model);
        model = this.applySorts(model);

        this.lastSearch = searchValue;
        this.currentSearchResults = model;
        this.orgListView.render(model.org.slice(0, this.chunkSize));
        this.projectListView.render(model.project.slice(0, this.chunkSize));
    }

    approximate(model, searchString) {
        function filterMatches(obj) {
            var len = searchString.length;
            var i, strings, matchString;
            var matches;
            var deletions;

            strings = props.reduce((mem, prop) => {
                var val = obj[prop];

                if (typeof val === 'string') {
                    mem.push(val);
                } else if (Array.isArray(val)) {
                    mem = mem.concat(val);
                }

                return mem;
            }, []);

            for (i = 0; i < strings.length; ++i) {
                matchString = strings[i];
                matches = 0;
                deletions = 0;

                lev.process(searchString, matchString);
                lev.recursePath(node => {
                    if (node.op === 'M') {
                        matches++;
                    }
                    if (node.op === 'D') {
                        deletions++;
                    }
                });

                if (matches/len >= threshold && lev.totalCost() <= 3 && deletions <= 3) {
                    return true;
                }
            }
        }

        var ret = {};
        var lev = this.searchLev;
        var props = ['name', 'description', 'categories', 'tags'];
        var threshold;

        // more forgiving thresholds for small-length searches
        if (searchString.length < 10) {
            threshold = 0.5;
        } else {
            threshold = 0.8;
        }

        // model id is the value of the search itself
        // so that the data store can be queried easily
        ret.id = searchString;
        ret.org = model.org.filter(filterMatches);
        ret.project = model.project.filter(filterMatches);

        return ret;
    }

    applyFilters(model) {
        var ret = {};
        ret.org = model.org.slice();
        ret.project = model.project.slice();
        return ret;
    }

    applySorts(model) {
        var ret = {};
        ret.org = model.org.slice();
        ret.project = model.project.slice();
        return ret;
    }
}

export default SearchController;
