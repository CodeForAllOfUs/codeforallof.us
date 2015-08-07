import EventEmitter from 'classes/event-emitter';
import ListContainerView from 'views/list-container';
import ListView from 'views/list';

class ListController extends EventEmitter {
    constructor(opts = {}) {
        super();
        // local data
        this.chunkSize = opts.chunkSize || 1;
        this.sortKey = 'id';
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
        this.listContainerView.on('sort', this.sortBy.bind(this));
        this.listView.on('requestNextChunk', this.appendChunk.bind(this));
    }

    sortBy(key) {
        function sortAsc(a, b) {
            var i;
            // drill down into object if `key` used dot notation
            for (i = 0; i < keys.length; ++i) {
                a = a[keys[i]];
                b = b[keys[i]];
            }
            return a < b ? -1 : 1;
        }

        var keys;

        if (this.sortKey === key) {
            this.isSortAsc = !this.sortAsc;
            this.model.reverse();
        } else {
            keys = key.split('.');
            this.sortKey = key;
            this.isSortAsc = true;
            this.model.sort(sortAsc);
        }

        this.render();
    }

    render(model = this.model) {
        var firstChunk = model.slice(0, this.chunkSize);
        this.model = model;
        this.listContainerView.render(firstChunk, this.sortKey, this.isSortAsc);
        this.listView.render(firstChunk);
    }

    appendChunk(startIndex) {
        var listView = this.listView;
        var model = this.model;
        var chunkSize = this.chunkSize;
        listView.receiveNextChunk(model.slice(startIndex, startIndex + chunkSize));
    }
}

export default ListController;
