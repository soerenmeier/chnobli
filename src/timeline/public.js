import { takeProp } from '../utils/internal.js';
import Timeline from './timeline.js';
import { STATE_ENDED } from '../timing/timing.js';
import { callStagger } from '../stagger/stagger.js';
import Events from '../utils/events.js';
import ResponsiveEvent from '../responsive/event.js';
import NestedTimeline from './nested.js';

const STATE_PAUSED = 0;
const STATE_RENDER_ONCE = 1;
const STATE_PLAYING = 2;

export default class PublicTimeline {
	constructor(props = {}) {
		this._defaults = takeProp(props, 'defaults', {});
		this._responsive = takeProp(props, 'responsive', true);

		if (typeof this._responsive !== 'boolean')
			throw new Error('responsive can only be a boolean');
		if ('duration' in props)
			throw new Error('a timeline does not accept a duration');

		this._inner = new Timeline(props);

		// 'start', 'end'
		this._events = new Events;

		this._state = STATE_PAUSED;
		this._renderedOnce = false;
		this._runningTicker = null;
		this._responsiveBlocks = [];
		if (this._responsive) {
			this._responsiveEvent = ResponsiveEvent.global()?.add((...args) => {
				this._onResponsive(...args);
			});

			// setup callback so we can notify our listeners
			this._inner.setBeforeResponsiveFn(() => {
				this._responsiveBlocks.forEach(block => {
					block.responsive();
				});
			});
		} else {
			this._responsiveEvent = null;
		}
	}

	/**
	 * Set's properties
	 * offset can be staggered, a number, a label or a string `+=10`
	 */
	set(targets, props, offset = null) {
		// for the moment let's just add as usual but set the duration to 0
		return this.add(targets, { ...props, duration: 0 }, offset);
	}

	/**
	 * Add an animation to the timeline
	 * 
	 * offset can be staggered, a number, a label or a string `+=10`
	 */
	add(targets, props, offset = null) {
		timelineAdd(this, targets, props, offset);

		return this;
	}

	/**
	 * Adds a label at to the current nOffse
	 *
	 * This label can then be used in offsets
	 */
	label(label, offset = null) {
		this._inner.label(label, offset);

		return this;
	}

	/**
	 * Allows to nest timelines
	 * 
	 * fn: (timeline)
	 */
	nest(fn, opts = {}, offset = null) {
		const tl = new NestedTimeline(opts);

		fn(tl);

		this._inner.addTimeline(tl._inner, offset);

		return this;
	}

	/**
	 * Adds a responsive function call which get's called before the responsive
	 * functions in properties
	 */
	addResponsive(responsive) {
		if (!this._responsiveEvent)
			throw new Error('this timeline is not responsive');

		if (Array.isArray(responsive)) {
			responsive.forEach(resp => this.addResponsive(resp));
			return this;
		}

		if (typeof responsive.responsive !== 'function')
			throw new Error('expected a responsive() function');

		this._responsiveBlocks.push(responsive);

		return this;
	}

	/**
	 * Starts to play the timeline if it hasn't started
	 */
	play() {
		if (this._state === STATE_PLAYING)
			return;

		this._state = STATE_PLAYING;

		this._startTicker();

		return this;
	}

	/**
	 * Pause the timeline at the current position
	 */
	pause() {
		if (this._state === STATE_PAUSED)
			return;

		this._state = STATE_PAUSED;

		this._stopTicker();
	}

	/**
	 * Seeks to a position in the timeline
	 */
	seekMs(ms) {
		this._inner.init();

		this._inner.seekMs(ms);

		if (this._state !== STATE_PLAYING)
			this._state = STATE_RENDER_ONCE;

		this._startTicker();
	}

	/**
	 * Seeks to a normalized position in the timeline
	 * 
	 * @param pos = number between 0 and 1
	 */
	seek(pos) {
		this._inner.init();

		this._inner.seek(pos);

		if (this._state !== STATE_PLAYING)
			this._state = STATE_RENDER_ONCE;

		this._startTicker();
	}

	// seek in Range (useful for scroll timelines)
	// seek(startOffset, endOffset, pos)

	/**
	 * Resets the current timeline to the start
	 * without changing anything
	 */
	reset() {
		this._inner.seek(0);
	}

	/**
	 * Resets every used prop to it's previous value
	 */
	resetProps() {
		const reversed = this._inner.timing.reverse;
		this._inner.timing.reverse = false;
		this._inner.seek(-1);
		this._inner.render();
		this._inner.ticker.applyTargets();

		this._inner.timing.reverse = reversed;
		this._inner.seek(-1);
	}

	/**
	 * Recalculates all values this should be called for example after a resize
	 */
	update() {
		this._inner.update();
	}

	/**
	 * Returns wether the timeline is set to reversed
	 */
	isReversed() {
		return this._inner.timing.reversed;
	}

	/**
	 * Set's the timeline to a specific direction
	 */
	setReversed(reversed) {
		if (this.isReversed() == reversed)
			return;
		this.reverse();
	}

	/**
	 * Reverses the order of the current timeline
	 */
	reverse() {
		this._inner.timing.reverse();
	}

	/**
	 * Listen on events
	 * 
	 * returns a function to remove the event listener
	 * 
	 * ## Events
	 * 
	 * ### end
	 * Get's executed once the timeline comes to the end
	 * Does not get executed during seeking
	 * 
	 */
	on(event, fn) {
		return this._events.add(event, fn);
	}

	// not wroking
	onPromise(event) {
		return this._events.wait(event);
	}

	/**
	 * Destroys this timeline and resets all props
	 */
	destroy() {
		this._stopTicker();
		this._inner.destroy();
		this._events.destroy();
		this._responsiveEvent?.remove();
		this._responsiveBlocks = [];
		this._inner = null;
	}

	_startTicker() {
		if (this._runningTicker)
			return;

		this._inner.init();

		this._runningTicker = this._inner.ticker.add(change => {
			if (this._inner.timing.state >= STATE_ENDED) {
				if (!this._renderedOnce) {
					this._renderedOnce = true;
					this._inner.render();
				}

				if (this._state === STATE_PLAYING)
					this._events.trigger('end');

				this._state = STATE_PAUSED;
				this._stopTicker();
				return
			}

			// if (this._inner.timing.state <= STATE_START) {
			// 	this._events.trigger('start');
			// }

			// if (this._inner.timing.state >= STATE_ENDED) {
			// 	this._stopTicker();
			// 	this._events.trigger('end');
			// 	return;
			// }

			if (this._state === STATE_PLAYING)
				this._inner.advance(change);

			// todo when we add smooth seeks we need to update this

			this._inner.render();

			if (this._inner.timing.state >= STATE_ENDED) {
				if (this._state === STATE_PLAYING)
					this._events.trigger('end');

				this._state = STATE_PAUSED;
				this._stopTicker();
				return
			}

			// we rendered once let's stop
			if (this._state === STATE_RENDER_ONCE) {
				this._state = STATE_PAUSED;
				this._stopTicker();
			}
		});
	}

	_stopTicker() {
		if (!this._runningTicker)
			return;

		this._runningTicker.remove();
		this._runningTicker = null;
	}

	_onResponsive(_obj) {
		// // make sure we don't render something if we never did
		// if (!this._renderedOnce)
		// 	return;
		this._inner.update();
	}
}

/**
 * Add an animation to the timeline
 * tl needs to have _defaults, and _inner
 */
export function timelineAdd(tl, targets, props, offset = null) {
	if (Array.from(targets).length === 0)
		targets = [targets];
	else
		targets = Array.from(targets);

	let i = -1;
	for (const target of targets) {
		i++;

		const nProps = {
			...tl._defaults,
			...props
		};

		for (const prop in nProps) {
			nProps[prop] = callStagger(nProps[prop], i, targets.length);
		}

		const nOffset = callStagger(offset, i);

		tl._inner.add(target, nProps, nOffset, i);
	}
}