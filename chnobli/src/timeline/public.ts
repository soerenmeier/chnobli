import { takeProp } from '../utils/internal.js';
import Timeline from './Timeline.js';
import Timing, {
	STATE_BEFORE,
	STATE_ENDED,
	TimingProps,
} from '../timing/Timing.js';
import Stagger, { callStagger } from '../stagger/stagger.js';
import Events from '../utils/Events.js';
import ResponsiveEvent from '../responsive/ResponsiveEvent.js';
import NestedTimeline from './Nested.js';
import { Targets } from '../chnobli.js';

const STATE_PAUSED = 0;
const STATE_RENDER_ONCE = 1;
const STATE_SEEK = 2;
const STATE_PLAYING = 3;

export type Responsive = {
	responsive: () => void;
};

export type TimelineProps = {
	// default properties for all animations
	defaults?: Record<string, any>;

	// make the timeline responsive default is true
	// this means the timeline will update on resize
	responsive?: boolean;

	// ease
	ease?: (t: number) => number;

	// smoothSeek
	smoothSeek?: SmoothSeekValue;

	// repeat
	// alternate
	// reversed

	// other properties
	[key: string]: any;
};

export type Offset = number | string | Stagger<number | string>;

export default class PublicTimeline {
	/**
	 * @ignore
	 */
	_defaults: Record<string, any>;
	private _responsive: boolean;

	/**
	 * @ignore
	 */
	_inner: Timeline;

	private _events: Events;
	private _triggeredStart: boolean;

	private _state: number;
	private _renderedOnce: boolean;
	private _runningTicker: any;
	private _responsiveBlocks: { responsive: () => void }[];
	private _responsiveEvent: any;
	private _smoothSeek: SmoothSeek | null;
	private _seekTo: number;

	constructor(props: TimelineProps = {}) {
		this._defaults = takeProp(props, 'defaults', {});
		this._responsive = takeProp(props, 'responsive', true);

		if (typeof this._responsive !== 'boolean')
			throw new Error('responsive can only be a boolean');
		if ('duration' in props)
			throw new Error('a timeline does not accept a duration');

		this._smoothSeek = parseSmoothSeek(
			takeProp<SmoothSeekValue>(props, 'smoothSeek', undefined),
		);
		this._seekTo = 0;

		this._inner = new Timeline(props);

		// 'start', 'end'
		this._events = new Events();
		this._triggeredStart = false;

		this._state = STATE_PAUSED;
		this._renderedOnce = false;
		this._runningTicker = null;
		this._responsiveBlocks = [];
		if (this._responsive) {
			this._responsiveEvent = ResponsiveEvent.global()?.add((a, b) => {
				this._onResponsive(a, b);
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
	 *
	 * offset can be staggered, a number, a label or a string `+=10`
	 */
	set(targets: Targets, props: Record<string, any>, offset?: Offset): this {
		// for the moment let's just add as usual but set the duration to 0
		return this.add(targets, { ...props, duration: 0 }, offset);
	}

	/**
	 * Add an animation to the timeline
	 *
	 * offset can be staggered, a number, a label or a string `+=10`
	 */
	add(targets: Targets, props: Record<string, any>, offset?: Offset): this {
		timelineAdd(this, targets, props, offset);

		return this;
	}

	/**
	 * Adds a label at to the current nOffset
	 *
	 * This label can then be used in offsets
	 */
	label(label: string, offset: any = null): this {
		this._inner.label(label, offset);

		return this;
	}

	/**
	 * Allows to nest timelines
	 *
	 * fn: (timeline)
	 */
	// todo probably tl should be an interface
	nest(
		fn: (tl: NestedTimeline) => void,
		opts = {},
		offset: any = null,
	): this {
		const tl = new NestedTimeline(opts);

		fn(tl);

		this._inner.addTimeline(tl._inner, offset);

		return this;
	}

	/**
	 * Adds a responsive function call which get's called before the responsive
	 * functions in properties
	 */
	addResponsive(responsive: Responsive | Responsive[]): this {
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
	play(): this {
		if (this._state === STATE_PLAYING) return this;

		this._state = STATE_PLAYING;

		this._startTicker();

		return this;
	}

	/**
	 * Pause the timeline at the current position
	 */
	pause() {
		if (this._state === STATE_PAUSED) return;

		this._state = STATE_PAUSED;

		this._stopTicker();
	}

	/**
	 * Seeks to a position in the timeline
	 */
	seekMs(ms: number) {
		this._inner.init();

		this.seek(this._inner.timing.normalizeMs(ms));
	}

	// todo maybe we should have two functions
	// seek
	// and setPosition
	// seek would include reverse but setPosition would not

	/**
	 * Seeks to a normalized position in the timeline
	 *
	 * @param pos = number between 0 and 1
	 */
	seek(pos: number) {
		this._inner.init();

		if (this._smoothSeek) {
			this._smoothSeek.update(this._inner.timing.positionLinear(), pos);

			if (this._state !== STATE_PLAYING) this._state = STATE_SEEK;
		} else {
			// this._inner.seek(pos);
			this._seekTo = pos;

			if (this._state !== STATE_PLAYING) this._state = STATE_RENDER_ONCE;
		}

		this._startTicker();
	}

	/**
	 * Returns the position of a label
	 */
	labelPosition(label: string): number {
		this._inner.init();

		return this._inner.labelPosition(label);
	}

	// seek in Range (useful for scroll timelines)
	// seek(startOffset, endOffset, pos)

	/**
	 * Resets the current timeline to the start
	 * without changing anything
	 *
	 * this operation is not smooth use seek 0 if you wan't that
	 */
	reset() {
		this._inner.seek(0);
	}

	/**
	 * Resets every used prop to it's previous value
	 */
	resetProps() {
		const reversed = this._inner.timing.reverse;
		this._inner.timing.reversed = false;
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
	isReversed(): boolean {
		return this._inner.timing.reversed;
	}

	/**
	 * Set's the timeline to a specific direction
	 */
	setReversed(reversed: boolean) {
		if (this.isReversed() == reversed) return;
		this.reverse();
	}

	/**
	 * Reverses the order of the current timeline
	 */
	reverse() {
		this._inner.timing.reverse();

		// todo does this work with smooth seek?
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
	on(event: string, fn: (...args: any[]) => void): () => void {
		return this._events.add(event, fn);
	}

	// not working
	onPromise(event: string): Promise<any> {
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
		// @ts-ignore
		this._inner = null;
	}

	_maybeTriggerEndEvent() {
		if (this._state !== STATE_PLAYING) return;

		this._events.trigger('end');
		this._triggeredStart = false;
	}

	/**
	 * @ignore
	 */
	_startTicker() {
		if (this._runningTicker) return;

		this._inner.init();

		const timingEnded = () => this._inner.timing.state >= STATE_ENDED;
		const smoothSeekEnded = () =>
			!this._smoothSeek || this._smoothSeek.state >= STATE_ENDED;

		this._runningTicker = this._inner.ticker.add((change, api) => {
			if (!this._triggeredStart) {
				// todo check that we are at the start
				if (this._inner.timing.state <= STATE_BEFORE) {
					this._events.trigger('start');
					this._triggeredStart = true;
				}
			}

			const allowSmoothSeek =
				this._state === STATE_PLAYING || this._state === STATE_SEEK;
			if (
				allowSmoothSeek &&
				this._smoothSeek &&
				this._smoothSeek.state < STATE_ENDED
			) {
				this._smoothSeek.advance(change);
				this._inner.seek(this._smoothSeek.value);
			} else if (this._state === STATE_RENDER_ONCE) {
				this._inner.seek(this._seekTo);
			} else if (this._state === STATE_PLAYING) {
				this._inner.advance(change);
			}

			this._inner.render();
			const pos = this._inner.timing.position;
			api.onApplied(() => {
				this._events.trigger('update', pos);
			});

			// we rendered once let's stop
			const renderOnce = this._state === STATE_RENDER_ONCE;

			if (renderOnce || (timingEnded() && smoothSeekEnded())) {
				this._maybeTriggerEndEvent();

				this._state = STATE_PAUSED;
				this._stopTicker();
				return;
			}
		});
	}

	/**
	 * @ignore
	 */
	_stopTicker() {
		if (!this._runningTicker) return;

		this._runningTicker.remove();
		this._runningTicker = null;
	}

	/**
	 * @ignore
	 */
	_onResponsive(
		a: { width: number; height: number },
		b: { remove: () => void },
	) {
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
export function timelineAdd(
	tl: PublicTimeline | NestedTimeline,
	targets: any,
	props: Record<string, any>,
	offset: any = null,
) {
	if (Array.from(targets).length === 0) targets = [targets];
	else targets = Array.from(targets);

	let i = -1;
	for (const target of targets) {
		i++;

		const nProps = {
			...tl._defaults,
			...props,
		};

		for (const prop in nProps) {
			nProps[prop] = callStagger(nProps[prop], i, targets.length);
		}

		const nOffset = callStagger(offset, i, targets.length);

		tl._inner.add(target, nProps, nOffset, i);
	}
}

export type SmoothSeekValue =
	| number
	| undefined
	| { duration: number; ease?: (t: number) => number };

/**
 * Smooth seek
 *
 * can either just be a number (duration) or an object { duration, ease }
 */
function parseSmoothSeek(smoothSeek: SmoothSeekValue): SmoothSeek | null {
	if (!smoothSeek) return null;

	if (typeof smoothSeek === 'number') {
		return new SmoothSeek({
			duration: smoothSeek,
		});
	}

	return new SmoothSeek({
		duration: smoothSeek.duration,
		ease: smoothSeek?.ease,
	});
}

class SmoothSeek {
	timing: Timing;
	from: number;
	to: number;

	constructor(timing: TimingProps) {
		this.timing = new Timing(timing);
		this.timing.seek(1);
		this.from = 0;
		this.to = 0;
	}

	update(from: number, to: number) {
		this.from = from;
		this.to = to;
		this.timing.seek(0);
	}

	advance(change: number) {
		this.timing.advance(change);
	}

	get value(): number {
		return this.from + (this.to - this.from) * this.timing.position;
	}

	get state(): number {
		return this.timing.state;
	}
}
