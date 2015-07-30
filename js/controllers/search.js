import DataStore from 'classes/data-store';
import SearchResult from 'classes/search-result';
import Levenshtein from 'classes/levenshtein';
import { $$, listen } from 'utils/dom';
import ajax from 'utils/ajax';

class SearchController {
    constructor(opts = {}) {
        this.el = $$(opts.el)[0];
        this.store = new DataStore();
        this.searches = new DataStore();
        this.lastSearch = '';
        this.initStorage().then(() => {
            this.initLevenshtein();
            this.initTextBox();
        });
    }

    initStorage() {
        this.store.addType('orgs');
        this.store.addType('projects');
        this.searches.addType('searches');
        this.searches.registerModelFactory('searches', SearchResult);

        return ajax({url: '/data/organizations.json'})
            .then(orgs => {
                this.store.load('orgs', orgs);
                return ajax({url: '/data/projects.json'});
            }).then(projects => {
                var id = 1;
                projects = projects.forEach(proj => {
                    proj.id = id++;
                    return proj;
                });
                this.store.load('projects', projects);
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
        listen(this.el, 'keyup', this.handleKeyup.bind(this));
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
