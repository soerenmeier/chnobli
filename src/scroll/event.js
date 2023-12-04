export default class ScrollEvent {
	constructor() {
		this._listeners = new Set;

		window.addEventListener('scroll', e => this._onScroll(e));
	}

	static global() {
		if (typeof window === 'undefined')
			return null;

		if (typeof window.chnobliScroll === 'undefined')
			window.chnobliScroll = new ScrollEvent;
		return window.chnobliScroll;
	}

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

	_onScroll(e) {
		for (const fn of this._listeners) {
			fn({
				y: window.scrollY,
				height: window.innerHeight
			}, {
				remove: () => this.remove(fn)
			});
		}
	}
}