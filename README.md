![Glassbil](https://www.iconfinder.com/icons/67974/download/png/256)
# glassbil

A minimal store similar to redux or flux

* Small footprint - just 1.2 KB gzipped
* Framework agnostic - works well with jQuery, Preact, or any other UI framework
* Immutable - the contents of the store are in deep-freeze
* Portable - actions can be moved to a common place and imported

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
import devtools from 'glassbil/devltools';

const store = ENV !== 'production' ? devtools(new MyStore()) : new MyStore();

// the rest can stay as is
// ...

```

Reporting Issues
----------------

Found a problem? Want a new feature? First of all, see if your issue or idea has [already been reported](https://github.com/andcake/glassbil/issues). If not, just open a [new clear and descriptive issue](https://github.com/andcake/glassbil/issues/new).

License
-------

[MIT License](https://oss.ninja/mit/andcake)