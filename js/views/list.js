import * as templates from 'templates';
import { $$, listen } from 'utils/dom';

class ListView {
    constructor(obj) {
        this.el = $$(obj.el)[0];
    }

    render(models) {
        var i;
        var el = this.el;

        el.innerHTML = '';

        for (i = 0; i < models.length; ++i) {
            el.appendChild(templates.ListItem(models[i]));
        }
    }
}

export default ListView;
