export function $(id) {
    if (id[0] === '#') {
        id = id.slice(1);
    }

    return document.getElementById(id);
}

export function $$(selector, ctx = document) {
    return ctx.querySelectorAll(selector);
}

export function listen(el, eventName, handler) {
    var elStr;

    if (typeof el === 'string') {
        [elStr, el] = [el, $$(el)[0]];
    }

    if (!el) {
        throw new Error('Could not addEventListener: element "' + elStr + '" did not exist!');
    }

    if (el.addEventListener) {
        el.addEventListener(eventName, handler, false);
    } else {
        el.attachEvent('on' + eventName, function() {
            handler.call(el);
        });
    }
}
