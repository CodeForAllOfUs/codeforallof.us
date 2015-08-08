function throttle(func, delay, risingEdge = false) {
    var timer;

    if (typeof func !== 'function') {
        throw new Error('Type passed into throttle function was not a function!');
    }
    if (typeof delay !== 'number') {
        throw new Error('Delay time passed into throttle function was not a number!');
    }

    return function(...args) {
        if (risingEdge && !timer) {
            func(...args);
        }

        clearTimeout(timer);

        timer = setTimeout(() => {
            timer = null;

            if (!risingEdge) {
                func(...args);
            }
        }, delay);
    };
}

export default throttle;
