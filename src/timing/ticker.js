import Value from '../utils/value.js';
import { newTarget } from '../utils/target.js';

/**
 * The ticker is the main driver for all animations
 * 
 * it also manages all targets allowing to only call the dom api
 * at the end of every frame
 */
export default class Ticker {
	constructor() {
		this._listeners = new Set;
		this._targets = new GlobalTargets;

		this.running = false;

		this._previousTick = null;
	}

	static global() {
		// allow to define a test ticker
		if (typeof globalThis !== 'undefined' && globalThis.chnobliTicker)
			return globalThis.chnobliTicker;

		if (typeof window === 'undefined')
			throw new Error('can only be executed in a browser context');

		if (typeof window.chnobliTicker === 'undefined')
			window.chnobliTicker = new Ticker;
		return window.chnobliTicker;
	}

	registerTarget(target) {
		return this._targets.register(target);
	}

	applyTargets() {
		return this._targets.apply();
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

export class GlobalTargets {
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
