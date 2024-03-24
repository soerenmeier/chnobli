import { newTarget } from '../target/Target';
import Ticker, { Callback } from './Ticker';

/**
 * The ticker is the main driver for all animations
 *
 * it also manages all targets allowing to only call the dom api
 * at the end of every frame
 */
export default class AnimationFrameTicker implements Ticker {
	private _listeners: Set<Callback>;
	private _targets: GlobalTargets;

	running: boolean;

	private _previousTick: number | null;

	constructor() {
		this._listeners = new Set();
		this._targets = new GlobalTargets();

		this.running = false;

		this._previousTick = null;
	}

	static global() {
		// allow to define a test ticker
		// @ts-ignore
		if (typeof globalThis !== 'undefined' && globalThis.chnobliTicker)
			// @ts-ignore
			return globalThis.chnobliTicker;

		if (typeof window === 'undefined')
			throw new Error('can only be executed in a browser context');

		// @ts-ignore
		if (typeof window.chnobliTicker === 'undefined')
			// @ts-ignore
			window.chnobliTicker = new Ticker();
		// @ts-ignore
		return window.chnobliTicker;
	}

	registerTarget(target: any) {
		return this._targets.register(target);
	}

	unregisterTarget(target: any) {
		return this._targets.unregister(target);
	}

	applyTargets() {
		return this._targets.apply();
	}

	add(fn: Callback): { remove: () => void } {
		this._listeners.add(fn);

		if (!this.running) {
			this.running = true;
			requestAnimationFrame(a => this._tick(a));
		}

		return {
			remove: () => {
				this.remove(fn);
			},
		};
	}

	remove(fn: Callback) {
		this._listeners.delete(fn);
	}

	_tick(elapsed: number) {
		if (this._listeners.size === 0) {
			this.running = false;
			this._previousTick = null;
			return;
		}

		if (this._previousTick === null) this._previousTick = elapsed;

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
				remove: () => this.remove(fn),
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
	private _targets: Map<any, { target: any; ref: number }>;

	constructor() {
		// {target, ref}
		this._targets = new Map();
	}

	register(target: any) {
		let storedTarget = this._targets.get(target);
		if (!storedTarget) {
			storedTarget = {
				target: newTarget(target),
				ref: 0,
			};
			this._targets.set(target, storedTarget);
		}
		storedTarget.ref += 1;

		return storedTarget.target;
	}

	unregister(target: any) {
		const storedTarget = this._targets.get(target);
		if (!storedTarget) return;

		storedTarget.ref -= 1;
	}

	apply() {
		for (const storedTarget of this._targets.values()) {
			const { target, ref } = storedTarget;
			target.apply();

			if (ref <= 0) this._targets.delete(target.target);
		}
	}

	size() {
		return this._targets.size;
	}

	// todo we should probly run some kind of gc
}
