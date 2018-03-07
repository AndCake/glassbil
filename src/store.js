'use strict';

import * as events from './events';
const scope = typeof window !== 'undefined' ? window : {};
let data = scope.__glassbilStoreData = scope.__glassbilStoreData || {};
let trigger = events.trigger;

function mirror() {
    return this;
}

function deepFreeze(obj) {
    // if it's already frozen, don't bother going deep into it...
    if (obj === null || typeof obj.toJS === 'function' || typeof obj !== 'object') {
        return obj;
    }

    // Retrieve the property names defined on obj
    let propNames = Object.getOwnPropertyNames(obj);
    let properties = {toJS: {value: mirror.bind(obj)}};

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

export default class Store {
    constructor(name, actions) {
        this.name = name || 'unnamed';
        this.triggered = false;
        Object.keys(events).forEach(event => {
            this[event] = function (eventName, context)  {
                if (eventName.indexOf(':') >= 0) {
                    events[event](eventName, context);
                } else {
                    events[event](name + '-store:' + eventName, context);
                }
            };
        });

        if (typeof actions === 'object') {
            let actionNames = Object.keys(actions);
            for (let index = 0, action; action = actions[actionNames[index]], index < actionNames.length; index += 1) {
                this[actionNames[index]] = function(triggerData) {
                    // for asynchronous cases, provide a next function to handle state
                    // modification
                    let newState = action(data[name].currentData.toJS(), triggerData, this.next.bind(this));
                    // if it was not done asynchronously
                    if (newState) {
                        // directly update the state
                        this.next(newState);
                    }
                }.bind(this);
            }
        }

        if (name) {
            data[name] = data[name] || {
                loaded: false,
                currentData: deepFreeze([]),
                historicData: []
            };
        }
    }

    get data() {
        if (data[this.name]) {
            return data[this.name].currentData.toJS();
        } else {
            return null;
        }
    }

    loaded() {
        let loaded = Object.keys(data).filter(key => data[key].loaded).length;
        if (loaded === Object.keys(data).length && !this.triggered) {
            let result = {};
            Object.keys(data).map(key => {
                result[key] = data[key].currentData.toJS();
            });
            this.triggered = true;
            trigger('global:data-loaded', result);
        }
    }

    next(newState) {
        data[this.name].loaded = true;
        newState = deepFreeze(newState);
        if (newState !== data[this.name].currentData) {
            data[this.name].historicData.push(data[this.name].currentData);
            while (data[this.name].historicData.length > 10) {
                data[this.name].historicData.shift();
            }
            data[this.name].currentData = newState;
            trigger(this.name + '-store:changed', data[this.name].currentData.toJS());
        }
        this.loaded();
    }

    previous() {
        if (data[this.name].historicData.length < 1) return;
        newState = data[this.name].historicData.pop();
        data[this.name].currentData = newState;
        trigger(this.name + '-store:changed', data[this.name].currentData.toJS());
    }
}