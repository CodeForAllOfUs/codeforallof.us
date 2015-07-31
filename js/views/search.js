import { $$, listen } from 'utils/dom';
import EventEmitter from 'classes/event-emitter';

class SearchView extends EventEmitter {
    constructor(opts = {}) {
        super();
        this.el = $$(opts.el)[0];

        // DOM event becomes EventEmitter event
        listen(this.el, 'keyup', (evt) => {
            this.emit('keyup', evt);
        });
    }
}

export default SearchView;
