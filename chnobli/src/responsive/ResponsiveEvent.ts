export type Callback = (
	a: { width: number; height: number },
	b: { remove: () => void },
) => void;

export default class ResponsiveEvent {
	private _listeners: Set<Callback>;

	constructor() {
		this._listeners = new Set();

		window.addEventListener('resize', e => this._onResize(e));
	}

	static global(): ResponsiveEvent | null {
		// allow to define a test ticker
		// @ts-ignore
		if (typeof globalThis !== 'undefined' && globalThis.chnobliResponsive)
			// @ts-ignore
			return globalThis.chnobliResponsive;

		if (typeof window === 'undefined') return null;

		// @ts-ignore
		if (typeof window.chnobliResponsive === 'undefined')
			// @ts-ignore
			window.chnobliResponsive = new ResponsiveEvent();
		// @ts-ignore
		return window.chnobliResponsive;
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

	_onResize(_e: Event) {
		for (const fn of this._listeners) {
			fn(
				{
					width: window.innerWidth,
					height: window.innerHeight,
				},
				{
					remove: () => this.remove(fn),
				},
			);
		}
	}
}
