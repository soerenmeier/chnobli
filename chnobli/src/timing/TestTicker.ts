import { GlobalTargets } from './AnimationFrameTicker.js';
import Ticker, { Callback } from './Ticker.js';

export default class TestTicker implements Ticker {
	private _listeners: Set<Callback>;
	targets: GlobalTargets;

	running: boolean;

	private _previousTick: number | null;

	constructor() {
		this._listeners = new Set();
		this.targets = new GlobalTargets();

		this.running = false;

		this._previousTick = null;

		// @ts-ignore
		globalThis.chnobliTicker = this;
	}

	registerTarget(target: any) {
		return this.targets.register(target);
	}

	unregisterTarget(target: any) {
		return this.targets.unregister(target);
	}

	applyTargets() {
		return this.targets.apply();
	}

	add(fn: Callback) {
		this._listeners.add(fn);

		if (!this.running) this.running = true;

		return {
			remove: () => {
				this.remove(fn);
			},
		};
	}

	remove(fn: Callback) {
		this._listeners.delete(fn);
	}

	/// max expects a number for how many ms the ticker should run
	///
	/// runs until the ticker ends this allows to run
	run(max = 3000, step = 1) {
		if (!this.running) return true;

		if (this._previousTick === null) this.tick(0);

		let i = 0;
		const start = this._previousTick ?? 0;

		for (i = 1; i <= max; i += step) {
			if (!this.tick(start + i)) return true;
		}

		return false;
	}

	// elapsed in ms
	tick(elapsed: number) {
		if (!this.running) return false;

		if (this._previousTick === null) this._previousTick = elapsed;

		let change = elapsed - this._previousTick;
		// lagSmoothing
		if (change > 500) {
			console.log('ticker lagged');
			change = 33;
		}
		this._previousTick = elapsed;

		const onApplied: (() => void)[] = [];

		for (const fn of this._listeners) {
			fn(change, {
				remove: () => this.remove(fn),
				onApplied: fn => onApplied.push(fn),
			});
		}

		this.targets.apply();

		for (const fn of onApplied) {
			fn();
		}

		if (this._listeners.size === 0) {
			this.running = false;
			this._previousTick = null;
			return false;
		}

		return true;
	}
}
