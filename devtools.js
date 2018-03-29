export default function glassbilDevTools(store) {
	var extension = window.devToolsExtension || window.top.devToolsExtension;
	var ignoreState = false;

	if (!extension) {
		console.warn('Please install/enable the Redux devtools extension.');
		store.devtools = null;

		return store;
	}

	if (store.devtools) return store;
	store.devtools = extension.connect({
		name: store.name,
		features: {
			skip: false
		}
	});
	store.devtools.subscribe(function (message) {
		if (message.type === 'DISPATCH' && message.state) {
			if (message.payload.type === 'TOGGLE_ACTION') {
				console.warn('Skipping not implemented yet.');
				return;
			}
			ignoreState = message.payload.type === 'JUMP_TO_ACTION' || message.payload.type === 'JUMP_TO_STATE';
			if (message.state === '{"length":0}') message.state = '[]';
			store.setState(JSON.parse(message.state));
		}
	});
	store.devtools.init(store.data);
	store.on('changed', function (data, actionName) {
		actionName = actionName || 'setState';
		if (!ignoreState) {
			store.devtools.send(actionName, data.toJS());
		} else {
			ignoreState = false;
		}
	});

	return store;
}
