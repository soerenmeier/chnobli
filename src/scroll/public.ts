import { Timeline } from '../chnobli.js';
// import Scroll from './Scroll.js';
import ScrollTimeline, { Position, ScrollTrigger } from './Scroll.js';

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
}
