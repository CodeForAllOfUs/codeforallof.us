import { $$, listen } from 'utils/dom';
import EventEmitter from 'classes/event-emitter';

class ListView extends EventEmitter {
    constructor(opts = {}) {
        super();
        this.el = $$(opts.el)[0];
        this.template = opts.template;
    }

    render(models) {
        var i;
        var el = this.el;

        el.innerHTML = '';

        for (i = 0; i < models.length; ++i) {
            el.appendChild(this.template(models[i]));
        }
    }
}

export default ListView;
