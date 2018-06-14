import {expect} from 'chai';
import TestStore from './testStore.js';
import Store from '../src/store';

describe('Store functionality', () => {
    let ts;

    beforeEach(function () {
        new Store().reset();
        ts = new TestStore();
    });

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

    describe('watch', () => {
        it('is able to watch changes to non-existing properties', () => {
            let addedValue = {
                id: 12, 
                name: 'Chicken Sandwich'
            };

            return new Promise(function (resolve, reject) {
                ts.watch('0.name', function (newValue) {
                    expect(newValue).to.equal(addedValue.name);
                    resolve();
                });
                ts.added(addedValue);
            });            
        });

        it('is able to watch changes to existing properties', () => {
            ts.added({id: 12, name: 'Karl'});
            return new Promise(function (resolve, reject) {
                ts.watch('0.name', function (newValue) {
                    expect(newValue).to.equal('Minkelhutz');
                    resolve();
                });
                ts.updated({id: 12, name: 'Minkelhutz'});
            });
        });

        it('is able to unwatch again', () => {
            let addedValue = {
                id: 12, 
                name: 'Chicken Sandwich'
            };
            let unwatch;
            let callCount = 0;

            return new Promise(function (resolve, reject) {
                unwatch = ts.watch('0.name', function (newValue) {
                    callCount += 1;
                    expect(newValue).to.equal(addedValue.name);
                    resolve();
                });
                ts.added(addedValue);
            }).then(function () {
                unwatch();
                addedValue.name = 'Minkelhutz';
                ts.updated(addedValue);
                expect(callCount).to.equal(1);
            });
        });
    });
});