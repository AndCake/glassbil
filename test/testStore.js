import Store from '../src/store';

export default class TestStore extends Store {
    constructor() {
        super('test', {
            added(currentState, entry, next) {
                let newState = currentState.toJS();
                newState.push(entry);
                return newState;
            },
            removed(currentState, id, next) {
                var newState = currentState.toJS();
                let found = newState.find(el => el.id === id);
                if (found) {
                    newState.splice(newState.indexOf(found), 1);
                }
                next(newState);
            }
        });
    }
}