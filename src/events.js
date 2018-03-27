const scope = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : {};
let eventRegistry = scope.__eventRegistry = scope.__eventRegistry || {};

export function trigger(eventName) {
    if (!eventRegistry[eventName]) return;
    for (var index = 0, length = eventRegistry[eventName].length, fn; fn = eventRegistry[eventName][index], index < length; index += 1) {
        var result = fn.apply(this, Array.prototype.slice.call(arguments, 1));
        if (result === false) {
            break;
        }
    }
}

export function on(eventName, fn) {
    if (!eventRegistry[eventName]) {
        eventRegistry[eventName] = [];
    }

    eventRegistry[eventName].push(fn);
}

export function off(eventName, fn) {
    if (!eventRegistry[eventName]) return;
    if (typeof fn !== 'function') {
        eventRegistry[eventName] = [];
        return;
    }

    let index = eventRegistry[eventName].indexOf(fn);
    if (index >= 0) {
        eventRegistry[eventName].splice(index, 1);
    }
}

export function one(eventName, fn) {
    let _this = this;
    let callback = function() {
        off(eventName, callback);
        fn.apply(_this, Array.prototype.slice.call(arguments));
    };
    on(eventName, callback);
}