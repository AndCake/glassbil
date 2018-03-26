import {expect} from 'chai';
import TestStore from './testStore.js';

describe('Store functionality', () => {
    let ts = new TestStore();

    it('provides all defined actions', () => {
        expect(ts.added).to.be.a('function');
        expect(ts.removed).to.be.a('function');
    });
    it('correctly executes actions', () => {
        ts.added({id: 123});
        expect(ts.data).to.have.lengthOf(1);
        expect(ts.data[0].id).to.equal(123);
        ts.removed(123);
        expect(ts.data).to.have.lengthOf(0);
    });
    it('fires the changed event when handling actions', () => {
        let eventFired = 0;
        ts.one('changed', data => {
            eventFired += 1;
            expect(data).to.have.lengthOf(1);
        });
        ts.added({id: 12});
        ts.on('changed', data => {
            eventFired += 1;
            expect(data).to.have.lengthOf(2);
        });
        ts.added({id: 32, text: 'test'});
        ts.off('changed');
        ts.removed(32);
        ts.removed(12);
        expect(eventFired).to.equal(2);
    });
    it('is able to roll back in history', () => {
        ts.added('test');
        ts.added('hello world!');
        expect(ts.data).to.have.lengthOf(2);
        ts.previous();
        expect(ts.data).to.have.lengthOf(1);
        expect(ts.data[0]).to.equal('test');
    });
});