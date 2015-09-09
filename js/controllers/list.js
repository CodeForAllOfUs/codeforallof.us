import GitHubCache from 'classes/github-cache';
import EventEmitter from 'classes/event-emitter';
import ListContainerView from 'views/list-container';
import ListView from 'views/list';

var orgCache = new GitHubCache({url: 'api/github-data/organizations'});
var projectCache = new GitHubCache({url: 'api/github-data/projects'});

class ListController extends EventEmitter {
    constructor(opts = {}) {
        super();
        // local data
        this.chunkSize = opts.chunkSize || 1;
        this.sortKey = 'sortId';
        this.isSortAsc = true;

        // model
        // hold the results to render out chunks at a time
        this.model = [];

        // views
        this.listContainerView = new ListContainerView({
            el: opts.el,
        });
        this.listView = new ListView({
            el: opts.el + ' .list',
            template: opts.listTemplate,
        });

        this.init();
    }

    init() {
        this.addListeners();
    }

    addListeners() {
        this.listView.on('requestNextChunk', this.appendChunk.bind(this));
        this.listContainerView.on('sort', key => {
            if (this.sortKey === key) {
                this.isSortAsc = !this.isSortAsc;
            } else {
                this.sortKey = key;
                this.isSortAsc = true;
            }
            this.render();
        });
    }

    sortModel() {
        function sortAsc(a, b) {
            // drill down into object if `key` used dot notation
            for (var i = 0; i < keys.length; ++i) {
                a = a[keys[i]];
                b = b[keys[i]];
            }
            return a < b ? -1 : 1;
        }
        function sortDesc(a, b) {
            // drill down into object if `key` used dot notation
            for (var i = 0; i < keys.length; ++i) {
                a = a[keys[i]];
                b = b[keys[i]];
            }
            return a < b ? 1 : -1;
        }

        var keys = this.sortKey.split('.');
        var sortFunc = this.isSortAsc ? sortAsc : sortDesc;
        this.model.sort(sortFunc);
    }

    render(model = this.model) {
        this.model = model;
        this.sortModel();

        var firstChunk = model.slice(0, this.chunkSize);
        var isListEmpty = firstChunk.length === 0;

        // cancel appending any pending next chunks
        clearTimeout(this.loadTimer);
        this.loadTimer = null;
        this.listContainerView.hideLoading();

        this.listContainerView.render(isListEmpty, this.sortKey, this.isSortAsc);
        this.listView.render(firstChunk);
        this.loadBelowFold();
    }

    appendChunk(startIndex) {
        var listView = this.listView;
        var listContainerView = this.listContainerView;
        var model = this.model;
        var chunkSize = this.chunkSize;

        listContainerView.showLoading();

        if (this.loadTimer) {
            return;
        }

        // simulate API fetching
        //
        // since typing in the search will change the results,
        // keeping track of this timer can prevent rendering chunks
        // from a previous search after they return from an API call.
        this.loadTimer = setTimeout(() => {
            listView.receiveNextChunk(model.slice(startIndex, startIndex + chunkSize));
            listContainerView.hideLoading();
            this.loadTimer = null;
        }, 1000);
    }

    // make sure the data is at least rendered below the fold,
    // so that user scrolling triggers infinite scroll afterward
    loadBelowFold() {
        var loadDelay = 300;
        var listView = this.listView;
        setTimeout(function loadAgain() {
            if (listView.canDoInfiniteScroll()) {
                listView.doInfiniteScroll();
                setTimeout(loadAgain, loadDelay);
            }
        }, loadDelay);
    }
}

export default ListController;
