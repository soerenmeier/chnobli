import Value from '../utils/value.js';
import { newTarget } from '../utils/target.js';


export default class Ticker {
	constructor() {
		this._listeners = new Set;
		this._targets = new GlobalTargets;

		this.running = false;

		this._previousTick = null;
	}

	static global() {
		if (typeof window === 'undefined')
			return null;

		if (typeof window.chnobliTicker === 'undefined')
			window.chnobliTicker = new Ticker;
		return window.chnobliTicker;
	}

	add(fn) {
		this._listeners.add(fn);

		if (!this.running) {
			this.running = true;
			requestAnimationFrame(a => this._tick(a));
		}

		return {
			remove: () => {
				this.remove(fn);
			}
		};
	}

	remove(fn) {
		this._listeners.delete(fn);
	}

	_tick(elapsed) {
		if (this._listeners.size === 0) {
			this.running = false;
			this._previousTick = null;
			return;
		}

		if (this._previousTick === null)
			this._previousTick = elapsed;

		let change = elapsed - this._previousTick;
		// lagSmoothing
		if (change > 500) {
			console.log('ticker lagged');
			change = 33;
		}
		this._previousTick = elapsed;

		// const changes = new PropertyChanges;

		for (const fn of this._listeners) {
			fn(change, {
				// changes,
				remove: () => this.remove(fn)
			});
		}

		this._targets.apply();

		requestAnimationFrame(a => this._tick(a));
	}
}

// class PropertyChanges {
// 	constructor() {
// 		this._targets = new Map;
// 	}

// 	// target is expected to be an html element
// 	get(target) {

// 	}
// }

// class TargetChanges {
// 	constructor() {
// 		// x, y, rotate, skew, scale
// 		this.transform = {};
// 	}
// }

class GlobalTargets {
	constructor() {
		this._targets = new Map;
	}

	register(target) {
		let storedTarget = this._targets.get(target);
		if (!storedTarget) {
			storedTarget = newTarget(target);
			this._targets.set(target, storedTarget);
		}

		return storedTarget;
	}

	apply() {
		for (const target of this._targets.values()) {
			target.apply();
		}
	}
}
