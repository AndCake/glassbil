import * as events from '../src/events';

function enrichCurrentState(state) {
	let newState = state;
	if (typeof state === 'object' && !Array.isArray(state) && typeof state.length === 'number' && (state.length > 0 && typeof state[0] !== 'undefined' || state.length === 0)) {
		newState = Array.prototype.slice.call(state, 0);
	}
	newState.toJS = () => newState;
	return newState;
}

/**
 * Client-side stub for a glassbil store that has been turned into a Web Worker store
 */
export default class WorkerStub {
	constructor(workerStoreUrl) {
		if (!window.Worker) {
			throw new Error('Your browser does not support web workers.');
		}

		let _this = this;
		_this.worker = new Worker(workerStoreUrl);
		_this.messageQueue = [];
		_this.actionDefinitions = [];
		_this.currentState = [];

		Object.keys(events).forEach(eventFnName => {
			_this[eventFnName] = function (eventName) {
				return events[eventFnName].apply(events, [workerStoreUrl + ':' + eventName].concat(Array.prototype.slice.call(arguments, 1)));
			};
		});

		_this.worker.addEventListener('message', event => {
			let {type, actionName, payload} = event.data;
			if (type === '@@STATE') {
				_this.currentState = payload;
				_this.trigger('changed', enrichCurrentState(_this.currentState), actionName);
			} else if (type === '@@ACTIONS') {
				payload.forEach(actionName => {
					_this.actionDefinitions.push(actionName);
					_this[actionName] = function stubAction(data) {
						_this.messageQueue.push({actionName, data});
						setTimeout(() => {
							_this.worker.postMessage({type: '@@ACTION', messages: _this.messageQueue});
							_this.messageQueue = [];
						});
					};
				});
			}
		});

		_this.worker.postMessage({type: '@@ACTIONS'});
	}

	get data() {
		return enrichCurrentState(this.currentState);
	}

	actions() {
		if (arguments.length === 0) {
			return this.actionDefinitions;
		}
		throw new Error('Dynamic change/addition of actions not allowed on Web Worker stub.');
	}

	setState(newState, actionName = 'setState') {
		this.messageQueue.push({actionName, data: newState});
		setTimeout(() => {
			this.worker.postMessage({type: '@@ACTION', messages: this.messageQueue});
			this.messageQueue = [];
		});
	}
}