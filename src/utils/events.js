import Listeners from 'fire/util/listeners.js';

export default class Events {
	constructor() {
		this.listeners = new Map;
	}

	add(event, fn) {
		let list = this.listeners.get(event);
		if (!list) {
			list = new Listeners;
			this.listeners.set(event, list);
		}

		return list.add(fn);
	}

	wait(event) {
		return new Promise(resolve => {
			let rm = () => {};
			const call = a => {
				rm();
				resolve(a);
			};
			rm = this.add(event, call);
		});
	}

	trigger(event, ...args) {
		let list = this.listeners.get(event);
		if (!list)
			return;
		list.trigger(...args);
	}

	destroy() {
		this.listeners = new Map;
	}
}