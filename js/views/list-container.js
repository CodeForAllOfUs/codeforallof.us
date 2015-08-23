import EventEmitter from 'classes/event-emitter';
import { $$, listen, addClass, removeClass } from 'utils/dom';
import * as templates from 'templates';

class ListContainerView extends EventEmitter {
    constructor(opts = {}) {
        super();
        this.el = $$(opts.el)[0];
        this.loadingEl = templates.Loading(' NOW LOADING');

        this.init();
    }

    init() {
        this.addListeners();
    }

    addListeners() {
        listen(this.el, 'click', evt => {
            var target = evt.target;
            var key;

            // get sort key if the sort direction icon (caret) was clicked
            if (target.nodeName.toLowerCase() === 'i') {
                target = target.parentNode;
            }

            key = target.getAttribute('data-sort-key');

            if (key) {
                this.emit('sort', key);
            }
        });
    }

    render(isListEmpty, sortKey, isSortAsc) {
        var allSortEls = $$('.sort-key', this.el);
        var sortEl;

        allSortEls.forEach(el => {
            removeClass(el, 'sort-ascending');
            removeClass(el, 'sort-descending');
        });

        if (isListEmpty) {
            addClass(this.el, 'list-empty');
        } else {
            removeClass(this.el, 'list-empty');
        }

        if (sortKey !== 'sortId') {
            sortEl = allSortEls.filter(el => el.getAttribute('data-sort-key') === sortKey)[0];
            addClass(sortEl, isSortAsc ? 'sort-ascending' : 'sort-descending');
            addClass(this.el, 'user-sorted');
        } else {
            removeClass(this.el, 'user-sorted');
        }
    }

    hideLoading() {
        var classname = '.' + this.loadingEl.className;
        if ($$(classname, this.el).length) {
            this.el.removeChild(this.loadingEl);
        }
    }

    showLoading() {
        var classname = '.' + this.loadingEl.className;
        if ($$(classname, this.el).length === 0) {
            this.el.appendChild(this.loadingEl);
        }
    }
}

export default ListContainerView;
