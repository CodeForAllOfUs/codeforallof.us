import Mochila from 'mochila';
import Levenshtein from 'levenshtein-toolbox';
import SearchResult from 'classes/search-result';
import ListController from 'controllers/list';
import SearchView from 'views/search';
import FilterView from 'views/filter';
import * as templates from 'templates';
import ajax from 'utils/ajax';
import shuffle from 'utils/shuffle';
import binarySearch from 'utils/binary-search';

class SearchController {
    constructor(opts = {}) {
        // local data
        this.lastSearch = '';
        // amount of models to render on infinite scroll trigger
        this.chunkSize = 2;
        // holds the filters the user selected for the search results
        this.filters = {};

        // models
        this.store = new Mochila();

        // views
        this.searchView = new SearchView({
            el: opts.searchEl,
        });
        this.filterView = new FilterView({
            el: opts.filterEl,
        });

        // sub-controllers
        this.orgListController = new ListController({
            el: opts.orgEl,
            listTemplate: templates.OrgListItem,
            chunkSize: this.chunkSize,
        });
        this.projectListController = new ListController({
            el: opts.projectEl,
            listTemplate: templates.ProjectListItem,
            chunkSize: this.chunkSize,
        });
    }

    init() {
        return this.initStorage().then(() => {
            this.initLevenshtein();
            this.filterView.render(this.store.all('category'));
            this.addListeners();
            this.renderSearch(this.searchView.searchBox.value);
        });
    }

    initStorage() {
        var store = this.store;
        store.addCollection('org');
        store.addCollection('project');
        store.addCollection('category');
        store.addCollection('search');
        store.addFactory('search', SearchResult);

        return Promise.all([
            ajax({url: 'api/organizations'}),
            ajax({url: 'api/projects'}),
        ]).then(([orgs, projects]) => {
            // shuffle all orgs and projects to
            // give each a fair chance at being seen
            var id = 1;
            // build list of filters for user to use
            var categories = [];
            // dummy organization for projects that have no organization
            var nullOrg = {id: -1, name: ''};

            shuffle(projects);
            projects.forEach(proj => {
                proj.sortId = id++;
                if (proj.organizationId) {
                    proj.organization = orgs[proj.organizationId-1];
                } else {
                    proj.organization = nullOrg;
                }
            });

            id = 1;
            shuffle(orgs);
            orgs.forEach(org => {
                var currCategories = org.categories;
                var i;
                org.sortId = id++;
                for (i = 0; i < currCategories.length; ++i) {
                    categories.push({id: currCategories[i]});
                }
            });

            store.load('org', orgs);
            store.load('project', projects);
            store.load('category', categories);
            store.load('search', {
                // initialize search results for empty search text box
                id: '',
                org: store.all('org'),
                project: store.all('project'),
            });

            this.filters.categories = store.all('category').map(cat => cat.id);
        });
    }

    initLevenshtein() {
        function searchMatchCost(c1, c2) {
            if (c1 === c2) {
                return 0;
            }

            // don't substitute a space char; keeps search words separate
            if (c1 === ' ' || c2 === ' ') {
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

    addListeners() {
        this.searchView.on('keyup', this.handleKeyup.bind(this));
        this.filterView.on('updateCategoryFilters', this.updateCategoryFilters.bind(this));
    }

    updateCategoryFilters(name, enable) {
        var idx = this.filters.categories.indexOf(name);
        var exists = idx !== -1;
        var model;

        if (enable && !exists) {
            this.filters.categories.push(name);
            this.filters.categories.sort();
        }

        if (!enable && exists) {
            this.filters.categories.splice(idx, 1);
        }

        model = this.getSearchResults(this.lastSearch);
        this.renderOrgs(model.org);
    }

    handleKeyup(searchValue) {
        this.renderSearch(searchValue);
    }

    getSearchResults(searchValue) {
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
            model = store.find('search', searchValue);
        }

        // apply user-selected filters to the search results
        model = this.applyFilters(model);

        return model;
    }

    renderOrgs(orgsModel) {
        this.orgListController.render(orgsModel);
    }

    renderProjects(projectsModel) {
        this.projectListController.render(projectsModel);
    }

    renderSearch(searchValue) {
        var model = this.getSearchResults(searchValue);
        this.lastSearch = searchValue;
        this.renderOrgs(model.org);
        this.renderProjects(model.project);
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
                    console.log(obj.name);
                    console.log(matches);
                    console.log(matches/len);
                    console.log(deletions);
                    console.log(lev.totalCost());
                    console.log(lev.reconstructPath());
                    console.log(matchString);

                    return true;
                }
            }
        }

        var ret = {};
        var lev = this.searchLev;
        var props = ['name', 'description', 'categories', 'tags'];
        var threshold;

        // more forgiving thresholds for small-length searches
        if (searchString.length < 5) {
            threshold = Math.floor(searchString.length/2)/searchString.length;
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
        var categoryFilters = this.filters.categories;
        ret.org = model.org.filter(org => {
            var len = org.categories.length;
            var i;
            for (i = 0; i < len; ++i) {
                if (binarySearch(categoryFilters, org.categories[i]) !== -1) {
                    return true;
                }
            }
        });
        ret.project = model.project.slice();
        return ret;
    }
}

export default SearchController;
