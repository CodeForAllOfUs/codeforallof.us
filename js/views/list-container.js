import EventEmitter from 'classes/event-emitter';
import { $$, listen, addClass, removeClass } from 'utils/dom';

class ListContainerView extends EventEmitter {
    constructor(opts = {}) {
        super();
        this.el = $$(opts.el)[0];

        this.init();
    }

    init() {
        this.addListeners();
    }

    addListeners() {
        listen(this.el, 'click', evt => {
            var target = evt.target;
            var key = target.getAttribute('data-sort-key');
            if (key) {
                this.emit('sort', key);
            }
        });
    }

    render(model, sortKey, isSortAsc) {
        if (model.length === 0) {
            addClass(this.el, 'list-empty');
        } else {
            removeClass(this.el, 'list-empty');
        }

        if (sortKey !== 'id') {
            addClass(this.el, 'user-sort');
        } else {
            removeClass(this.el, 'user-sort');
        }
    }
}

export default ListContainerView;
