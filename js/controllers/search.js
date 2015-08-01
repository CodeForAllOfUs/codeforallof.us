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
        this.lev = new Levenshtein(levOpts);
        this.lev.set('insertCost', 0);
        this.lev.set('deleteCost', Infinity);
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
            if (lastSearch.length < value.length) {
                // we're filtering current results, use last results
                model = store.find('search', lastSearch);
            } else {
                // we're widening current results, start from scratch
                model = store.find('search', '');
            }

            // perform string approximation on models' attributes
            model = this.approximate(model, value);
            // store the search results back into the store
            store.load('search', model);
        }

        // apply user-supplied filters to the search results
        model = this.applyFilters(model);

        this.lastSearch = value;
        this.orgListView.render(model.org);
        this.projectListView.render(model.project);
    }

    approximate(model, searchString) {
        var ret = {};

        // model id is the value of the search itself
        // so that the data store can be queried easily
        ret.id = searchString;

        ret.org = model.org.slice(1);
        ret.project = model.project.slice(1);

        return ret;
    }

    applyFilters(model) {
        var ret = {};
        ret.org = model.org;
        ret.project = model.project;
        return ret;
    }
}

export default SearchController;
