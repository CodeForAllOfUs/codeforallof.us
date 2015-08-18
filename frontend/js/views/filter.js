import EventEmitter from 'classes/event-emitter';
import templates from 'templates';
import { $$, listen } from 'utils/dom';

class FilterView extends EventEmitter {
    constructor(opts = {}) {
        super();
        this.el = $$(opts.el)[0];
        this.template = opts.template || templates.Filter;

        this.init();
    }

    init() {
        listen(this.el, 'click', evt => {
            var target = evt.target;
            if (target.nodeName.toLowerCase() !== 'input' ||
                target.getAttribute('type').toLowerCase() !== 'checkbox')
            {
                return;
            }

            this.emit('updateCategoryFilters', target.value, target.checked);
        });
    }

    render(filters) {
        var el = this.el;
        var i;
        for (i = 0; i < filters.length; ++i) {
            el.appendChild(this.template(filters[i].id));
        }
    }
}

export default FilterView;
