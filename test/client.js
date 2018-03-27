import TestStore from './testStore';
import devtools from '../devtools';

let store = devtools(new TestStore());

store.on('changed', function(data) {
	document.querySelector('ul').innerHTML = data.map(item => '<li data-id="' + item.id + '">' + item.value + '</li>').join('');
});

document.querySelector('input').addEventListener('change', function() {
	store.added({id: (store.data.length && store.data[store.data.length - 1].id || 0) + 1, value: this.value});
});

document.querySelector('ul').addEventListener('click', function(event) {
	if (event.target.matches('li')) {
		store.removed(~~event.target.dataset.id);
	}
});
