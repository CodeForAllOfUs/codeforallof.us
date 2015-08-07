import EventEmitter from 'classes/event-emitter';
import ListView from 'views/list';
import { $$, listen } from 'utils/dom';

class ListController extends EventEmitter {
    constructor(opts = {}) {
        super();
        this.el = $$(opts.el)[0];
        this.chunkSize = opts.chunkSize || 1;
        // hold the results to render out chunks at a time
        this.model = [];
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
    }

    render(model) {
        this.model = model;
        this.listView.render(model.slice(0, this.chunkSize));
    }

    appendChunk(startIndex) {
        var listView = this.listView;
        var model = this.model;
        var chunkSize = this.chunkSize;
        listView.receiveNextChunk(model.slice(startIndex, startIndex + chunkSize));
    }
}

export default ListController;
