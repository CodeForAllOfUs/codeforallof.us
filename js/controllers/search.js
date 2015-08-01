import DataStore from 'classes/data-store';
import SearchResult from 'classes/search-result';
import Levenshtein from 'classes/levenshtein';
import SearchView from 'views/search';
import ListView from 'views/list';
import * as templates from 'templates';
import ajax from 'utils/ajax';

class SearchController {
    constructor(opts = {}) {
        // models
        this.lastSearch = '';
        this.store = new DataStore();

        // views
        this.searchView = new SearchView({
            el: opts.searchEl
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
            var store = this.store;
            this.initLevenshtein();
            this.initTextBox();
            this.orgListView.render(store.all('org'));
            this.projectListView.render(store.all('project'));
        });
    }

    initStorage() {
        var store = this.store;
        store.addType('org');
        store.addType('project');
        store.addType('search');
        store.registerModelFactory('search', SearchResult);

        function addOrgs(orgs) {
            store.load('org', orgs);
            return ajax({url: '/data/projects.json'});
        }

        function addProjects(projects) {
            var id = 1;
            projects.forEach(proj => {
                proj.id = id++;

                if (proj.organizationId) {
                    proj.organization = store.find('org', proj.organizationId);
                }

                return proj;
            });
            store.load('project', projects);
        }

        return ajax({url: '/data/organizations.json'})
            .then(addOrgs)
            .then(addProjects)
            .then(() => {
                store.load('search', {
                    // initialize search results for empty search text box
                    id: '',
                    org: store.all('org'),
                    project: store.all('project'),
                });
            });
    }

    initLevenshtein() {
        var levOpts = {
            type: 'substring',
            caseSensitive: false
        };
        var queryLev = this.queryLev = new Levenshtein(levOpts);
        var searchLev = this.searchLev = new Levenshtein(levOpts);

        queryLev.set('insertCost', 0);
        queryLev.set('deleteCost', Infinity);

        searchLev.set('matchCost', (c1, c2) => {
            if (c1 === c2) {
                return 0;
            }

            // don't substitute a space char; keeps search words separate
            if (c1 === ' ') {
                return Infinity;
            }

            return 1;
        });
        searchLev.set('insertCost', function(c, cBefore, cAfter) {
            // insertion at a word boundary is free
            if (cBefore === null || cAfter === null || cBefore === ' ' || cAfter === ' ') {
                return 0;
            }
            // prefer insertions inside of a word to a substitution
            return 0.9;
        });
        searchLev.set('deleteCost', 1);
    }

    initTextBox() {
        this.searchView.on('keyup', this.handleKeyup.bind(this));
    }

    handleKeyup(evt) {
        var value = evt.target.value;
        var lastSearch = this.lastSearch;
        var store = this.store;
        var model;

        // if search has been previously cached in the database, use it
        model = store.find('search', value);

        if (!model) {
            // if only inserts and matches are used to transform the lastSearch...
            if (this.queryLev.process(lastSearch, value).totalCost() === 0) {
                // we're filtering the last results further
                model = store.find('search', lastSearch);
            } else {
                // we're widening the last results, start from scratch
                model = store.find('search', '');
            }

            // perform string approximation on models' attributes
            model = this.approximate(model, value);
            // store the search results back into the store
            store.load('search', model);
        }

        // apply user-supplied filters and sorts to the search results
        model = this.applyFilters(model);
        model = this.applySorts(model);

        this.lastSearch = value;
        this.orgListView.render(model.org);
        this.projectListView.render(model.project);
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
