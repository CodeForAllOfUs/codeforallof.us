import EventEmitter from 'classes/event-emitter';
import { $$, listen, windowRect } from 'utils/dom';
import throttle from 'utils/throttle';

class ListView extends EventEmitter {
    constructor(opts = {}) {
        super();
        this.el = $$(opts.el)[0];
        this.template = opts.template;
        // is true when SearchController has sent all chunks
        this.listCompleted = false;
        // is true when loading the next chunk
        this.loading = false;

        this.init();
    }

    init() {
        listen(window, 'scroll', throttle(this.doInfiniteScroll.bind(this), 50));
    }

    canDoInfiniteScroll() {
        return !this.listCompleted && windowRect().height >= this.el.getBoundingClientRect().bottom;
    }

    doInfiniteScroll() {
        if (!this.loading && this.canDoInfiniteScroll()) {
            this.loading = true;
            this.emit('requestNextChunk', this.el.children.length);
        }
    }

    receiveNextChunk(dataSubset) {
        if (dataSubset.length === 0) {
            this.listCompleted = true;
        }

        this.loading = false;

        // display next chunk
        this.appendModels(dataSubset);
    }

    render(models) {
        this.listCompleted = false;
        this.loading = false;
        this.el.innerHTML = '';
        this.appendModels(models);
    }

    appendModels(models) {
        var el = this.el;
        var i;
        for (i = 0; i < models.length; ++i) {
            el.appendChild(this.template(models[i]));
        }
    }
}

export default ListView;
