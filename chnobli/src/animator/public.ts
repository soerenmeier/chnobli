/*
set,
to,
*/

import AnimationFrameTicker from '../timing/AnimationFrameTicker.js';
import Ticker from '../timing/Ticker.js';
import Events from '../utils/Events.js';
import Animator from './Animator.js';

export type AnimatorProps = {
	duration?: number;
	ease?: (t: number) => number;
};

export default class PublicAnimator {
	private ticker: Ticker;
	private inner: Animator;
	private runningTicker: any;
	private events: Events;

	constructor(target: any, props: AnimatorProps = {}) {
		this.ticker = AnimationFrameTicker.global();
		this.inner = new Animator(target, this.ticker, {
			duration: props.duration ?? 1000,
			ease: props.ease,
		});
		this.events = new Events();
	}

	set(props: Record<string, any>): this {
		this.inner.set(props);
		this.startTicker();

		return this;
	}

	to(props: Record<string, any>, duration?: number): this {
		this.inner.to(props, duration);
		this.startTicker();

		return this;
	}

	// on: update
	on(ev: string, fn: (...args: any[]) => void): () => void {
		return this.events.add(ev, fn);
	}

	private startTicker() {
		if (this.runningTicker) return;

		this.runningTicker = this.ticker.add((change, opts) => {
			const keepRunning = this.inner._tick(change);

			opts.onApplied(() => {
				this.events.trigger('update');
			});

			if (!keepRunning) {
				opts.remove();
				this.runningTicker = null;
			}
		});
	}
}
