import EventEmitter from 'classes/event-emitter';
import { $$, listen, addClass, removeClass } from 'utils/dom';
import keyCodesAllowed from 'utils/keyCodesAllowed';

class SearchView extends EventEmitter {
    constructor(opts = {}) {
        super();
        this.el = $$(opts.el)[0];
        this.searchBox = $$('input', this.el)[0];
        this.clearButton = $$('button', this.el)[0];

        this.init();
    }

    init() {
        this.addListeners();
        this.setClearButton();
    }

    addListeners() {
        listen(this.searchBox, 'keyup', e => {
            if (keyCodesAllowed[e.keyCode]) {
                this.setClearButton();
                this.emit('keyup', this.searchBox.value);
            }
        });

        listen(this.clearButton, 'click', () => {
            this.searchBox.value = '';
            this.setClearButton();
            this.emit('keyup', this.searchBox.value);
        });
    }

    setClearButton() {
        if (this.searchBox.value === '') {
            addClass(this.clearButton, 'hidden');
        } else {
            removeClass(this.clearButton, 'hidden');
        }
    }
}

export default SearchView;
