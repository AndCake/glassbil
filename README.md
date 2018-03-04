# glassbil

A minimal store similar to redux or flux

Installation
------------

```
  $ npm install glassbil
```

Usage
-----

The following provides a simple example of how to define a custom store, extend from the glassbil store and use asynchronous state changes.

my-store.js:
```
  import Store from 'glassbil';
  
  export default class MyStore extends Store {
    constructor() {
      super('mystore', {
        // here is our list of actions - every function receives three arguments: the store's current state
        // the data transferred to the action when called and a next function that can be called 
        // to set the new state in the store.
        added(currentState, dataAdded, next) {
          // update current state to also contain the data added
          currentState.push(dataAdded);
          fetch('/my-server-url', {method: 'post', body: dataAdded}).then(response => response.json()).then(message => {
            if (message.success) {
              // if the server said everthing is alright
              // store the new current state
              next(currentState);
            }
          });
        }
      });
    }
  }
```

in your code that uses MyStore:
```
  import MyStore from './my-store';
  
  let myStore = new MyStore();
  ...
  myStore.data // allows access to the stores data immediately
  ...
  myStore.on('changed', changeCallback) // be notified on state changes of the store (always receives the entire state)
  ...
  myStore.added('some data'); // triggers the 'added' action as defined in my-store.js and notifies changeCallback
```

