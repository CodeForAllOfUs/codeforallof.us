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
        this.searches = new DataStore();

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
        this.searches.addType('search');
        this.searches.registerModelFactory('search', SearchResult);

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
            .then(orgs => {
                this.store.load('org', orgs);
                return ajax({url: '/data/projects.json'});
            }).then(addProjects);
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

        if (this.lastSearch.length < value.length) {
            // we're filtering current results
        } else {
            // we're widening current results
        }
    }
}

export default SearchController;
