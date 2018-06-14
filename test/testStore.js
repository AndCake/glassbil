import Store from '../src/store';

export default class TestStore extends Store {
    constructor() {
        super('test');

        this.actions({
            added(currentState, entry, next) {
                let newState = currentState.toJS();
                newState.push(entry);
                return newState;
            },
            removed(currentState, id, next) {
                let newState = currentState.toJS();
                let found = newState.find(el => el.id === id);
                if (found) {
                    newState.splice(newState.indexOf(found), 1);
                }
                next(newState);
            },
            updated(currentState, entry, next) {
                let newState = currentState.toJS();
                let found = newState.find(el => el.id === entry.id);
                if (found) {
                    Object.assign(found, entry);
                }
                return newState;
            }
        });
    }
}