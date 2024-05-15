import { takeProp } from '../utils/internal.js';
import Timeline from '../timeline/public.js';
import Stagger, { staggerMap } from '../stagger/stagger.js';
import { Targets } from '../chnobli.js';

export type AnimationProps = {
	autoplay?: boolean;
	delay?: number | string | Stagger<number | string>;

	ease?: (t: number) => number;

	onStart?: () => void;
	onEnd?: () => void;

	// other properties
	[key: string]: any;
};

/**
 * The animation consist of a timeline with just one animation
 * This allows to reuse a lot of code
 *
 * ## Props
 *
 */
export default class PublicAnimation {
	private _tl: Timeline;

	constructor(targets: Targets, props: AnimationProps = {}) {
		const autoplay = parseAutoplay(takeProp(props, 'autoplay', true));
		const delay = takeProp<number>(props, 'delay', 0);

		// we don't wan't the ease and duration on the timeline
		const ease = takeProp<AnimationProps['ease']>(props, 'ease', undefined);
		const duration = takeProp<number | undefined>(
			props,
			'duration',
			undefined,
		);

		this._tl = new Timeline(props);

		// events
		const onStart = takeProp<AnimationProps['onStart']>(
			props,
			'onStart',
			undefined,
		);
		if (onStart) this._tl.on('start', onStart);

		// events
		const onEnd = takeProp<AnimationProps['onEnd']>(
			props,
			'onEnd',
			undefined,
		);
		if (onEnd) this._tl.on('end', onEnd);

		props.ease = ease;
		props.duration = duration;

		this._tl.add(
			targets,
			props,
			staggerMap(delay, v => '+=' + v),
		);

		if (autoplay) this._tl.play();
	}

	play() {
		this._tl.play();
	}

	pause() {
		this._tl.pause();
	}

	/**
	 * Seeks to a position in the timeline
	 */
	seekMs(ms: number) {
		this._tl.seekMs(ms);
	}

	/**
	 * Seeks to a normalized position in the timeline
	 *
	 * @param pos = number between 0 and 1
	 */
	seek(pos: number) {
		this._tl.seek(pos);
	}

	/**
	 * Resets the current timeline to the start
	 * without changing anything
	 */
	reset() {
		this._tl.reset();
	}

	/**
	 * Resets every used prop to it's previous value
	 */
	resetProps() {
		this._tl.resetProps();
	}

	/**
	 * Recalculates all values this should be called for example after a resize
	 */
	update() {
		this._tl.update();
	}

	/**
	 * Returns wether the timeline is set to reversed
	 */
	isReversed(): boolean {
		return this._tl.isReversed();
	}

	/**
	 * Set's the timeline to a specific direction
	 */
	setReversed(reversed: boolean) {
		this._tl.setReversed(reversed);
	}

	/**
	 * Reverses the order of the current timeline
	 */
	reverse() {
		this._tl.reverse();
	}

	/**
	 * @returns a function to call to unregister the event
	 */
	on(event: string, fn: (...args: any[]) => void): () => void {
		return this._tl.on(event, fn);
	}

	// not wroking
	onPromise(event: string): Promise<unknown> {
		return this._tl.onPromise(event);
	}

	/**
	 * Destroys this timeline and resets all props
	 */
	destroy() {
		this._tl.destroy();
		// @ts-ignore
		this._tl = null;
	}
}

function parseAutoplay(autoplay: any): boolean {
	if (autoplay !== true && autoplay !== false)
		throw new Error('autoplay needs to be true|false');

	return autoplay;
}
