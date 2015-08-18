class EventEmitter {
    constructor() {
        this.__events__ = {};
    }

    on(name, callback) {
        var events = this.__events__;
        var event = events[name] || (events[name] = []);
        event.push(callback);
    }

    off(name, callback) {
        var events = this.__events__;
        var event = events[name] || (events[name] = []);
        for (var i = event.length-1; i >= 0; --i) {
            if (event[i] === callback) {
                event.splice(i, 1);
                return;
            }
        }
    }

    emit(name, ...args) {
        var events = this.__events__;
        var event = events[name] || (events[name] = []);
        for (var i = 0; i < event.length; ++i) {
            event[i](...args);
        }
    }

    allOff() {
        var events = this.__events__;
        for (var prop in events) {
            if (events.hasOwnProperty(prop)) {
                events[prop].length = 0;
            }
        }
    }
}

export default EventEmitter;
