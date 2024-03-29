import { takeProp } from '../utils/internal';
import Timeline from '../timeline/public';
import { staggerMap } from '../stagger/stagger';

/**
 * The animation consist of a timeline with just one animation
 * This allows to reuse a lot of code
 *
 * ## Props
 *
 */
export default class PublicAnimation {
	private _tl: Timeline;

	constructor(targets: any, props: Record<string, any> = {}) {
		const autoplay = parseAutoplay(takeProp(props, 'autoplay', true));
		const delay = takeProp(props, 'delay', 0);

		// we don't wan't the ease and duration on the timeline
		const ease = takeProp(props, 'ease', null);
		const duration = takeProp(props, 'duration', null);

		this._tl = new Timeline(props);

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
	isReversed() {
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

	on(event: string, fn: (...args: any[]) => void) {
		return this._tl.on(event, fn);
	}

	// not wroking
	onPromise(event: string) {
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
