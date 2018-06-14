![Glassbil](https://www.iconfinder.com/icons/67974/download/png/256)
# glassbil

A minimal store similar to redux or flux

* Small footprint - just 1.2 KB gzipped
* Immutable - the contents of the store are in deep-freeze
* Portable - actions can be moved to a common place and imported
* Framework agnostic - works well with jQuery, Preact, or any other UI framework

Installation
------------

```
  $ npm install --save glassbil
```

Then with a modern bundler like [webpack](https://webpack.js.org/) or [rollup](http://rollupjs.org/) use it as you would use anything else:

```js
// import the base store
import Store from 'glassbil';

// create your custom store
export default class MyStore extends Store {

  constructor() {
    // give it a proper name
    super('mystore');

    // define your actions
    this.actions({
      // 'added' action
      added(currentState, dataAdded, next) {
        // create new state from current one
        let newState = currentState.toJS();
        // add the additional data to the new state
        newState.push(dataAdded);

        // optionally, transfer data to the server
        // for asynchronous store updates use
        // next(newState);
        // instead of
        // return newState;

        // return the new state
        return newState;
      },

      removed(currentState, id, next) {
        var newState = currentState.toJS();
        // locate the element with the provided ID
        let found = newState.find(el => el.id === id);
        if (found) {
            // remove it from the new state
            newState.splice(newState.indexOf(found), 1);
        }
        return newState;
      },

      // additional actions
      // ...
    });
  }
}
```

or alternatively in ES5:

```js
// import the base store
var Store = require('glassbil');

// create your custom store
MyStore.prototype = Object.create(Store.prototype, {constructor: MyStore});
function MyStore() {
  Store.call(this, 'mystore');

  this.actions({
    added: function added(currentState, dataAdded, next) {
      var newState = currentState.toJS();
      newState.push(dataAdded);
      return newState;
    },
    removed: function removed(currentState, dataAdded, next) {
      var newState = currentState.toJS();
      // locate the element with the provided ID
      var found = newState.filter(function (el) { return el.id === id; })[0];
      if (found) {
          // remove it from the new state
          newState.splice(newState.indexOf(found), 1);
      }
      return newState;
    },
    // additional actions...
  })
}

module.exports = MyStore;
```

Usage
-----

```js
import MyStore from './my-store';

const store = new MyStore();
const taskList = document.querySelector('.task-list');

// listen for events that changed the store contents
store.on('changed', function(data) {
  // re-render our elements
	taskList.innerHTML = data.map(item => (
    '<li class="task-list__task" data-id="' + item.id + '">' +
      item.value +
    '</li>'
  )).join('');
});

// register event listener on an input field
document.querySelector('.task-input').addEventListener('change', function() {
  // create task object
  let task = {
    id: +new Date,
    value: this.value
  }
  // add the new task to the store
	store.added(task);
});

taskList.addEventListener('click', function(event) {
	if (event.target.matches('.task-list__task')) {
    // trigger store's removed action with the provided task's ID
		store.removed(~~event.target.dataset.id);
	}
});
```

A working demo can be found in the [test](https://github.com/AndCake/glassbil/tree/master/test) directory.

### Why use immutable data?

Bugs happen because developers write them. This just puts one more layer between you and your code exploding. Immutable data can't promise to help you avoid all bugs, but can help you reason about your state much easier!

The immutability is implemented with minimal performance overhead while trying to stay close to the native object/array API.

Debug
-----

Make sure to have [Redux devtools extension](https://github.com/zalmoxisus/redux-devtools-extension) installed, then you can use the following code:

```js
import MyStore from './my-store';
import devtools from 'glassbil/devtools';

const store = ENV !== 'production' ? devtools(new MyStore()) : new MyStore();

// the rest can stay as is
// ...

```

Web Worker Support
------------------

Glassbil offers support to have your store run within a web worker and use it through the same interface. This will help you to separate data handling, network and other resource intensive tasks to be delegated to a different thread, thereby making your UI more responsive.

For this, glassbil provides a module to turn a regular store into a web worker-based store, `glassbil/lib/workerize`. Please note, that custom events (so events other than the 'changed' event) will not be synchronized between the web worker and the main thread.

Your main thread code can then instantiate and use this web worker store by handing the worker store's bundle URL into the worker stub module `glassbil/lib/workerstub`. The stub will synchronize all action calls and state changes as well as `changed` events between the main thread and the web worker.

Example for a web worker store definition:

```js
// workerstore.js
import TestStore from './testStore';
import workerize from 'glassbil/lib/workerize';

workerize(new TestStore());
```

You can then use it by utilizing the `WorkerStub` like so:

```js
// in the main thread
import WorkerStore from 'glassbil/lib/workerstub';

// the worker stub requires the URL to the actual bundled web worker store
const testStore = new WorkerStore('./workerstore.js');

// use your store as you normally would
testStore.on('changed', data => /* do something */data);
testStore.added('test');
```

API
---

### Class Store

Methods available:

#### constructor([name, [actions]]) : Store

When creating a new store, you can hand it the name of your store and optionally, a set of actions to be created with it. This constructor would normally be used by the inheriting store class using `super(...)` to initialize the base store functionality.

 * `name {string}` - the name of the store, since you can have multiple stores, use a unique identifier for the functionality of your store. If no name is provided, a unique name is generated for every instance.
 * `actions {object}` - a set of custom actions that describe the capabilities of your store. The properties of the object should be the actions' functions. Every such function takes three arguments: `currentState`, `payload`, `next`. The `payload` argument is handed into the action when calling it from your code.

Example:

```js
import Store from 'glassbil';

export default class TaskStore extends Store {
  constructor() {
    // call the base store's constructor
    super('task', {
      // the actions
      retrieved(currentState, payload, next) {
        // ...
      },
      // additional actions
      // ...
    });
  }
}
```

#### actions([actions]) : Array

Instead of statically providing the actions as part of the constructor call, you can also add actions at a later stage by calling the `actions()` method. This method will return the names of all currently defined actions for the store.

* `actions {object}` - a set of custom actions that describe the capabilities of your store. The properties of the object should be the actions' functions. Every such function takes three arguments: `currentState`, `payload`, `next`. The `payload` argument is handed into the action when calling it from your code.

Example for imported actions:

```js
import Store from 'glassbil';
import actionDefinitions from './my-action-definitions';

export default class TaskStore extends Store {
  constructor() {
    super('task');

    console.log(this.actions(actionDefinitions));
  }
}
```

#### setState(newState[, actionName]) : void

Defines the new state of the store. The new state will be frozen and modifications of it are only possible by setting a new state using `setState(...)`. The frozen state object has a `.toJS()` function to retrieve a modifiable copy of the state, which can then be used to derive a new state based on the current state.

This method will also notify any callbacks that have registered to the `changed` event of the store.

* `newState {object}` - the new state the store should be in
* `actionName {string}` - a descriptive name to show what caused state change

Example for hydrating the store from a localStorage object:

```js
import Store from 'glassbil';

export default class IcecreamStore extends Store {
  constructor() {
    super('icecream');

    let storeData = JSON.parse(localStorage.getItem('icecream-store')) || {};
    this.setState(storeData, '@@INIT');
  }
}
```

#### trigger(eventName[, ...args]) : void

Triggers the given event and transfers any data that is handed into the event listeners callback functions.

* `eventName {string}` - the name of the event to trigger

Example:

```js
import IcecreamStore from './icecreamstore';

let store = new IcecreamStore();

store.on('distribute', function (...args) {
  // will log ["snow cone", "waffle", "banana boat"]
  console.log(args);
});

// trigger the "distribute" event with some data
store.trigger('distribute', 'snow cone', 'waffle', 'banana boat');

```

#### on(eventName, fn) : void

Registers an event handler for a given event triggered by the store. Every time the event is triggered, it will call the `fn` function with the provided data.

The only pre-defined event names are `changed`, which is used whenever the store state changed. Additionally, there is an event name `global:data-loaded`, which is fired once all stores have been initialized (can be used e.g. for rendering components after asynchronous store data was successfully retrieved).

* `eventName {string}` - the name of the event to listen for
* `fn {Function}` - the callback function to be notified once the given event is triggered

Example:

```js
import TaskStore from './taskstore';

let store = new TaskStore();

// listen for the "testing" event
store.on('testing', function (data) {
  // will log "Hello" and "World!"
  console.log(data, args);
});

// trigger the "testing" event multiple times
store.trigger('testing', 'Hello');
store.trigger('testing', 'World!');
```

#### one(eventName, fn) : void

Registers an event handler for a given event triggered by the store for only one execution, then unregisters it again. The function `fn` will be called at most once - the first time the event is triggered.

* `eventName {string}` - the name of the event to listen for
* `fn {Function}` - the callback function to be notified once the given event is triggered

Example:

```js
import TaskStore from './taskstore';

let store = new TaskStore();

store.one('changed', function (data) {
  // will only log "Hello"
  console.log(data);
});

store.setState('Hello');
store.setState('World!');
```

#### off(eventName[, fn]) : void

Unregisters an event handler previously registered via `.on()`. If the `fn` parameter is omitted, all event handlers are unregistered for the given event.

Example:

```js
...
function buyIcecream(icecream) {
  // eat ice cream
  // ...
}
store.on('ring-bell', buyIcecream);
...
store.off('ring-bell', buyIcecream);
```

### loaded() : void

Checks if all stores have been successfully initialized. Once that is the case, an event `global:data-loaded` is fired, providing the data from all stores. This is especially helpful to prepopulate the stores when doing server-side rendering.

Example:

```
import Glassbil from 'glassbil';

const rootStore = new Glassbil();

// ...
// execute your business logic using all required sub-stores
// ...

rootStore.on('global:data-loaded', data => {
  // __glassbilStoreData is automatically picked up by all glassbil instances as default-value on page load
  response.writer.write('<script>window.__glassbilStoreData = ' + JSON.stringify(data) + '</script>');
});
rootStore.loaded();
```

#### reset() : boolean

Re-initializes all data and events from all stores. Basically creates a clean slate - best for cached server-side requests. **Please note:** resetting only works on instances that have been created directly of the Glassbil store but not of any inheriting stores.

Example:

```js
import Glassbil from 'glassbil';

const rootStore = new Glassbil();
rootStore.reset();
```


Reporting Issues
----------------

Found a problem? Want a new feature? First of all, see if your issue or idea has [already been reported](https://github.com/andcake/glassbil/issues). If not, just open a [new clear and descriptive issue](https://github.com/andcake/glassbil/issues/new).

License
-------

[MIT License](https://oss.ninja/mit/andcake)