import { Callback } from './ResponsiveEvent';

export default class TestResponsiveEvent {
	private _listeners: Set<Callback>;

	constructor() {
		this._listeners = new Set();

		// @ts-ignore
		globalThis.chnobliResponsive = this;
	}

	// fn({ width, height }, { remove() })
	add(fn: Callback) {
		this._listeners.add(fn);

		return {
			remove: () => {
				this.remove(fn);
			},
		};
	}

	remove(fn: Callback) {
		this._listeners.delete(fn);
	}

	resize(width: number, height: number) {
		for (const fn of this._listeners) {
			fn({ width, height }, { remove: () => this.remove(fn) });
		}
	}
}
