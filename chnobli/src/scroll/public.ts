import { Timeline } from '../chnobli.js';
import ScrollTimeline, {
	DestroyOptions,
	Position,
	ScrollTrigger,
} from './Scroll.js';

export default class Scroll {
	private _inner: ScrollTimeline;

	constructor() {
		this._inner = new ScrollTimeline();
	}

	/**
	 * Add a trigger to the timeline
	 *
	 * Providing an offset at which point the trigger should end
	 */
	add(trigger: ScrollTrigger, position?: Position): this {
		this._inner.add(trigger, position);

		return this;
	}

	/**
	 * Add a timeline to the scroll
	 */
	addTimeline(timeline: Timeline): this {
		this._inner.addTimeline(timeline);

		return this;
	}

	/**
	 * Listen on events
	 *
	 * returns a function to remove the event listener
	 *
	 * ## Events
	 *
	 * ### Update
	 * The scroll position has been updated passes in a number between 0 and 1
	 *
	 */
	on(event: string, fn: (...args: any[]) => void): () => void {
		return this._inner.on(event, fn);
	}

	update() {
		this._inner.update();
	}

	/**
	 * Destroy the scroll
	 */
	destroy(opts: DestroyOptions = {}) {
		this._inner.destroy(opts);
	}

	debug(prefix?: string) {
		this._inner.debug(prefix);
	}
}
