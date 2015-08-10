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

export function addClass(el, name) {
    if (!el || !name || !(el instanceof Object) || el.className === void 0) {
        return;
    }

    if (el.classList) {
        el.classList.add(name);
        return;
    }

    var classes = el.className.split(/\s+/);
    if (classes.indexOf(name) === -1) {
        if (classes.length === 0 || classes.length === 1 && classes[0] === '') {
            el.className = name;
        } else {
            el.className += ' ' + name;
        }
    }
}

export function removeClass(el, name) {
    if (!el || !name || !(el instanceof Object) || el.className === void 0) {
        return;
    }

    if (el.classList) {
        el.classList.remove(name);
        return;
    }

    var classes = el.className.split(/\s+/);
    var idx = classes.indexOf(name);
    if (idx !== -1) {
        classes.splice(idx, 1);
        el.className = classes.join(' ');
    }
}

export function windowRect() {
    return {
        x: window.pageXOffset || document.documentElement.scrollLeft,
        y: window.pageYOffset || document.documentElement.scrollTop,
        width: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
        height: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
    };
}
