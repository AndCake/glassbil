'use strict';

import * as events from './events';
const scope = typeof window !== 'undefined' ? window : {};
let data = scope.__glassbilStoreData = scope.__glassbilStoreData || {};
let trigger = events.trigger;

function mirror() {
    return this;
}

function getProperty(path, object) {
    let result = object;
    let fragments = path.split('.');

    while (result && fragments.length > 0) {
        result = result[fragments.shift()];
    }

    return result;
}

/**
 * Create an immutable object lazily.
 * @param {Object} obj
 * @returns {Object} the immutable object created
 */
function deepFreeze(obj) {
    // if it's already frozen, don't bother going deep into it...
    if (obj === null || typeof obj === 'undefined' || typeof obj.toJS === 'function' || typeof obj !== 'object') {
        return obj;
    }

    // Retrieve the property names defined on obj
    let propNames = Object.getOwnPropertyNames(obj);
    let properties = {toJS: {value: mirror.bind(obj)}};

    if (Array.isArray(obj)) {
        // create a copy and deep freeze all entries
        obj = obj.slice(0).map(deepFreeze);
        // re-attach some important methods
        ['map', 'forEach', 'find', 'indexOf', 'filter', 'some', 'every', 'lastIndexOf', 'slice'].forEach(fn => {
            properties[fn] = {value: function () { return deepFreeze(Array.prototype[fn].apply(obj, arguments));}};
        });
    }

    // Freeze properties before freezing self
    for (let index = 0, prop; prop = obj[propNames[index]], index < propNames.length; index += 1) {
        // Freeze prop if it is an object
        properties[propNames[index]] = {
            enumerable: true,
            get () {
                return deepFreeze(prop);
            },
            set (newValue) {
                throw new Error('Cannot change property "' + propNames[index] + '" to "' + newValue + '" of an immutable object');
            }
        }
    }

    // Freeze self (no-op if already frozen)
    return Object.freeze(Object.create(Object.getPrototypeOf(obj), properties));
}

function bind(fn, self, lastParam) {
    return function boundFunction(data) {
        return fn.call(self, data, lastParam);
    }
}

/**
 * A base store implementation supporting (dynamic) addition of actions and events for
 * being notified of store state changes.
 */
export default class Store {
    constructor(name, actions) {
        this.name = name || ('Unnamed' + Object.keys(data).length);
        Object.keys(events).forEach(event => {
            if (event === 'resetEvents') return;
            this[event] = function (eventName, context)  {
                if (eventName.indexOf(':') >= 0) {
                    events[event](eventName, context);
                } else {
                    events[event](name + '-store:' + eventName, context);
                }
            };
        });

        this.actions(actions);

        if (name) {
            data[name] = data[name] || {
                loaded: false,
                currentData: deepFreeze([])
            };
        }
    }

    /**
     *
     * @param {Object} actionDefinitions an object containing action functions
     */
    actions(actionDefinitions) {
        if (!actionDefinitions || typeof actionDefinitions !== 'object') return this.actionDefinitions && Object.keys(this.actionDefinitions) || [];
        let actionNames = Object.keys(actionDefinitions);
        this.actionDefinitions = Object.assign({}, this.actionDefinitions || {}, actionDefinitions);
        for (let index = 0, action; action = actionDefinitions[actionNames[index]], index < actionNames.length; index += 1) {
            (function(actionName) {
                this[actionName] = function(triggerData) {
                    // for asynchronous cases, provide a next function to handle state
                    // modification
                    let newState = action.call(this, data[this.name].currentData, triggerData, bind(this.setState, this, actionName));
                    // if it was not done asynchronously
                    if (typeof newState !== 'undefined') {
                        // directly update the state
                        this.setState(newState, actionName);
                    }
                }.bind(this);
            }.call(this, actionNames[index]))
        }
        return Object.keys(this.actionDefinitions);
    }

    /**
     * watches for changes in the given object path and calls the callback
     * @param {string} path the object path to watch for changes in
     * @param {Function} callback the function to be called once there are changes
     * @param {Function} comparator an optional parameter indicating how to detect if there are changes (if the function returns false, it's treated as a change)
     * @returns {Function} a unwatch function to stop watching the given path
     */
    watch(path, callback, comparator) {
        comparator = comparator || ((a, b) => a === b);
        let currentValue = getProperty(path, this.data);
        let eventHandler = function (data) {
            let newValue = getProperty(path, data);
            if (!comparator(currentValue, newValue)) {
                callback(newValue, currentValue, data);
            }
        };

        this.on(this.name + '-store:changed', eventHandler);

        return function unwatch() {
            this.off(this.name + '-store:changed', eventHandler);
        }.bind(this);
    }

    /**
     * getter for retrieving the store's current state.
     * @returns {Object} the store's current state
     */
    get data() {
        if (data[this.name] && data[this.name].loaded) {
            return data[this.name].currentData;
        } else {
            return null;
        }
    }

    loaded() {
        let loaded = Object.keys(data).filter(key => data[key].loaded).length;
        if (loaded === Object.keys(data).length && !data.__triggered) {
            let result = {};
            Object.keys(data).map(key => {
                result[key] = data[key].currentData.toJS();
            });
            data.__triggered = true;
            trigger('global:data-loaded', result);
        }
    }

    /**
     * re-initializes all data and events from all stores.
     * Basically creates a clean slate - best for cached server-side requests.
     * Please note that resetting only works on instances that have been created directly of the store but not of inheriting stores.
     *
     * @returns {Boolean} true if everything was successfully reset. Else false.
     */
    reset() {
        if (Object.getPrototypeOf(this) === Store.prototype) {
            data = scope.__glassbilStoreData = {};
            events.resetEvents();
            return true;
        }
        return false;
    }

    /**
     * Sets the next new state of the store and notifies all listeners of the state change.
     *
     * @param {Object} newState the new state of the store - will be subjected to a deep-freeze
     * @param {string} [actionName] the action that caused the state change
     */
    setState(newState, actionName = 'setState') {
        data[this.name].loaded = true;
        newState = deepFreeze(newState);
        if (newState !== data[this.name].currentData) {
            data[this.name].currentData = newState;
            trigger(this.name + '-store:changed', data[this.name].currentData, actionName);
        }
        this.loaded();
    }
}
