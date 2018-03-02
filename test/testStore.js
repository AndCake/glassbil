import Store from '../src/store';

export default class TestStore extends Store {
    constructor() {
        super('test', {
            added(currentState, entry, next) {
                currentState.push(entry);
                return currentState;
            },
            removed(currentState, id, next) {
                let found = currentState.find(el => el.id === id);
                if (found) {
                    currentState.splice(currentState.indexOf(found), 1);
                }
                next(currentState);
            }
        });
    }
}