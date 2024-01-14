export default class TestResponsiveEvent {
	constructor() {
		this._listeners = new Set;

		globalThis.chnobliResponsive = this;
	}

	// fn({ width, height }, { remove() })
	add(fn) {
		this._listeners.add(fn);

		return {
			remove: () => {
				this.remove(fn);
			}
		};
	}

	remove(fn) {
		this._listeners.delete(fn);
	}

	resize(width, height) {
		for (const fn of this._listeners) {
			fn(
				{ width, height },
				{ remove: () => this.remove(fn) }
			);
		}
	}
}