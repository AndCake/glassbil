/**
 * Turns a (custom) store instance into a Web worker-enabled store.
 *
 * @param {Store} storeInstance
 * @returns {Store} the extended store instance
 */
export default function workerize(storeInstance) {
	self.addEventListener('message', function (event) {
		let {type, messages} = event.data;
		if (type === '@@ACTIONS') {
			let actions = storeInstance.actions();
			self.postMessage({type: '@@ACTIONS', payload: actions});
		} else if (type === '@@ACTION') {
			messages.forEach(({actionName, data}) => {
				storeInstance[actionName](data);
			});
		} else {
			throw new Error('Unknown message type "' + type + '"');
		}
	});

	storeInstance.on('changed', (payload, actionName) => {
		self.postMessage({type: '@@STATE', payload, actionName});
	});

	return storeInstance;
}