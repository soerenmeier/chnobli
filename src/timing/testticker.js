import { GlobalTargets } from './ticker.js';

export default class TestTicker {
	constructor() {
		this._listeners = new Set;
		this._targets = new GlobalTargets;

		this.running = false;

		this._previousTick = null;

		globalThis.chnobliTicker = this;
	}

	registerTarget(target) {
		return this._targets.register(target);
	}

	add(fn) {
		this._listeners.add(fn);

		if (!this.running)
			this.running = true;

		return {
			remove: () => {
				this.remove(fn);
			}
		};
	}

	remove(fn) {
		this._listeners.delete(fn);
	}

	/// max expects a number for how many ms the ticker should run
	///
	/// runs until the ticker ends this allows to run
	run(max = 3000, step = 1) {
		if (!this.running)
			return true;

		if (this._previousTick === null)
			this.tick(0);

		let i = 0;
		const start = this._previousTick ?? 0;

		for (i = 1; i <= max; i++) {
			if (!this.tick(start + i))
				return true;
		}

		return false;
	}

	// elapsed in ms
	tick(elapsed) {
		if (!this.running)
			return false;

		if (this._previousTick === null)
			this._previousTick = elapsed;

		let change = elapsed - this._previousTick;
		// lagSmoothing
		if (change > 500) {
			console.log('ticker lagged');
			change = 33;
		}
		this._previousTick = elapsed;

		for (const fn of this._listeners) {
			fn(change, {
				// changes,
				remove: () => this.remove(fn)
			});
		}

		this._targets.apply();

		if (this._listeners.size === 0) {
			this.running = false;
			this._previousTick = null;
			return false;
		}

		return true;
	}
}