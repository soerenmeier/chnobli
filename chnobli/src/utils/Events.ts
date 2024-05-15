import Listeners from 'fire/sync/Listeners';

export default class Events {
	private listeners: Map<string, Listeners<any>>;

	constructor() {
		this.listeners = new Map();
	}

	add(event: string, fn: (...args: any[]) => void) {
		let list = this.listeners.get(event);
		if (!list) {
			list = new Listeners();
			this.listeners.set(event, list);
		}

		return list.add(fn);
	}

	wait(event: string): any {
		return new Promise(resolve => {
			let rm = () => {};
			const call = (a: any) => {
				rm();
				resolve(a);
			};
			rm = this.add(event, call);
		});
	}

	trigger(event: string, ...args: any[]) {
		let list = this.listeners.get(event);
		if (!list) return;
		list.trigger(...args);
	}

	destroy() {
		this.listeners = new Map();
	}
}
