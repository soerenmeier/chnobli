export default class ResponsiveEvent {
	constructor() {
		this._listeners = new Set;

		window.addEventListener('resize', e => this._onResize(e));
	}

	static global() {
		// allow to define a test ticker
		if (typeof globalThis !== 'undefined' && globalThis.chnobliResponsive)
			return globalThis.chnobliResponsive;

		if (typeof window === 'undefined')
			return null;

		if (typeof window.chnobliResponsive === 'undefined')
			window.chnobliResponsive = new ResponsiveEvent;
		return window.chnobliResponsive;
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

	_onResize(_e) {
		for (const fn of this._listeners) {
			fn({
				width: window.innerWidth,
				height: window.innerHeight
			}, {
				remove: () => this.remove(fn)
			});
		}
	}
}