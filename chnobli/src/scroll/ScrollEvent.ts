export type Callback = (
	a: { y: number; height: number },
	opts: { remove: () => void },
) => void;

export default class ScrollEvent {
	_listeners: Set<Callback>;

	constructor() {
		this._listeners = new Set();

		window.addEventListener('scroll', e => this._onScroll(e));
		window.addEventListener('resize', e => this._onScroll(e));
	}

	static global() {
		if (typeof window === 'undefined') return null;

		// @ts-ignore
		if (typeof window.chnobliScroll === 'undefined')
			// @ts-ignore
			window.chnobliScroll = new ScrollEvent();
		// @ts-ignore
		return window.chnobliScroll;
	}

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

	private _onScroll(_e: Event) {
		for (const fn of this._listeners) {
			fn(
				{
					y: window.scrollY,
					height: window.innerHeight,
				},
				{
					remove: () => this.remove(fn),
				},
			);
		}
	}
}
