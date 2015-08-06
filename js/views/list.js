import { $$, listen } from 'utils/dom';
import EventEmitter from 'classes/event-emitter';

class ListView extends EventEmitter {
    constructor(opts = {}) {
        super();
        this.el = $$(opts.el)[0];
        this.template = opts.template;
        // is true when SearchController has sent all chunks
        this.listCompleted = false;

        this.init();
    }

    init() {
        listen(document.body, 'click', () => {
            if (!this.listCompleted) {
                this.emit('requestNextChunk', this.el.children.length);
            }
        });
    }

    receiveNextChunk(dataSubset) {
        if (dataSubset.length === 0) {
            this.listCompleted = true;
        }

        // display next chunk
        this.appendModels(dataSubset);
    }

    render(models) {
        this.listCompleted = false;
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
