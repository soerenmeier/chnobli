import { takeProp } from '../utils/internal.js';

export const STATE_BEFORE = 0;
/// start only occurs if the current position is exactly 0 or 1 if reversed
export const STATE_START = 1;
export const STATE_RUNNING = 2;
/// ended only occurs if the current position is exactly 1 or 0 if reversed
export const STATE_ENDED = 3;
export const STATE_AFTER = 4;

export type Position = {
	progress: number;
};

export type TimingProps = {
	duration: number;
	ease?: (t: number) => number;
	repeat?: number;
	alternate?: boolean;
	reversed?: boolean;
};

/**
 * This class handles everything timing related
 *
 * It manages easing, keeps track of where we are at the moment
 *
 * The most important property is position which gives the calculated position
 *
 *
 * Timing works the same as in after effects
 * if the duration is not at least 1ms the position is always 1 and either
 * STATE_BEFORE or STATE_AFTER
 *
 * if the duration is 1ms seek 0 or 1 will always result in position 1
 * because it is like one frame, so it's an image
 */
export default class Timing {
	/**
	 * The duration of a single iteration
	 */
	iterDuration: number;

	/**
	 * The total duration of the timing
	 */
	duration: number;

	ease: (t: number) => number;
	/**
	 * The number of repeats
	 *
	 * -1 is infinite
	 */
	repeat: number;

	/**
	 * If the iteration should alternate
	 */
	alternate: boolean;

	/**
	 * If the iteration should be reversed
	 */
	reversed: boolean;

	/**
	 * The position of the current iteration
	 *
	 * will never be outside of the range 0-1 (inclusive)
	 */
	position: number;
	/**
	 * The state of the timing
	 */
	state: number;

	/**
	 * Progress is a value which always counts up
	 * does not take alternate or easing into account
	 */
	private progress: number;

	constructor(props: TimingProps) {
		// these vars are only readonly
		// use functions to update them

		this.ease = props.ease ?? (t => t);
		this.repeat = props.repeat ?? 0;
		this.alternate = props.alternate ?? true;
		this.reversed = props.reversed ?? false;

		this.iterDuration = 0;
		this.duration = 0;
		this.setDuration(props.duration);

		this.position = 0;
		this.state = STATE_BEFORE;
		this.progress = 0;
		this.seek(-1);
	}

	setDuration(iterDuration: number) {
		this.iterDuration = iterDuration;

		this.duration = this.iterDuration;
		if (this.isFinite()) {
			this.duration = (this.repeat + 1) * this.iterDuration;
		}
	}

	/**
	 * Returns the current position in milliseconds
	 *
	 * This is equivalent to position * iteration duration
	 */
	positionMs() {
		// todo should this not return pos * duration?
		return this.position * this.iterDuration;
	}

	// todo find a better name
	/**
	 * Returns the position in milliseconds
	 *
	 * If the state is before or after the position might be more/less than
	 * required
	 */
	positionMsUnbounded() {
		let reversed = this.reversed;

		if (this._shouldInvert()) reversed = !reversed;

		let pos = this.position;

		if (this.state <= STATE_BEFORE) {
			pos = reversed ? 2 : -1;
		} else if (this.state >= STATE_AFTER) {
			pos = reversed ? -1 : 2;
		}

		return pos * this.iterDuration;
	}

	isFinite() {
		return this.repeat > -1;
	}

	advance(change: number) {
		if (this.state >= STATE_AFTER) return;

		if (this.iterDuration <= 0) {
			this._updateProgress(1);
			return;
		}

		if (this.isFinite()) {
			this._updateProgress(
				this.positionAbsolute() + change / this.iterDuration,
			);
		} else {
			// to make sure we don't mess up the alternate
			this._updateProgress(
				Math.max(0, this.progress) + change / this.iterDuration,
			);
		}
	}

	seekMs(ms: number) {
		return this.seek(this.normalizeMs(ms));
	}

	/**
	 * Returns the position of time (ms) position
	 */
	normalizeMs(ms: number) {
		if (this.iterDuration <= 0) {
			return Math.sign(ms);
		}

		return ms / this.duration;
	}

	// Returns the position without easing or reversing
	//
	// Returns 0..=(repeat + 1)
	positionAbsolute(): number {
		if (this.isFinite()) {
			return Math.min(this.repeat + 1, Math.max(0, this.progress));
		}

		// the iterations should be inclusive
		const prog = Math.max(0, this.progress) % 1;
		if (prog === 0 && this.progress > 0) return 1;
		return prog;
	}

	// should be between 0-1 if outside might change the state
	seek(pos: number) {
		if (this.isFinite()) {
			this._updateProgress(pos * (this.repeat + 1));
		} else {
			// to make sure we don't mess up the alternate
			this._updateProgress(Math.floor(this.progress) + pos);
		}
	}

	savePosition(): Position {
		return {
			progress: this.progress,
		};
	}

	restorePosition(pos: Position) {
		this._updateProgress(pos.progress);
	}

	/**
	 * Sets the alternate
	 */
	setAlternate(alternate: boolean) {
		if (this.alternate == alternate) return;

		this.reversed = !this.reversed;
		this.alternate = alternate;
	}

	reverse() {
		this.reversed = !this.reversed;

		if (this.isFinite()) {
			this._updateProgress(this.repeat + 1 - this.progress);
		} else {
			const fract = this.progress % 1;
			this._updateProgress(Math.floor(this.progress) + 1 - fract);
		}
	}

	_shouldInvert() {
		return (
			this.alternate &&
			Math.floor(this.progress) % 2 === 1 &&
			this.progress % 1 !== 0
		);
	}

	/**
	 * Updates the progress and the state
	 *
	 * newProgress should follow the same rules as _progress
	 */
	_updateProgress(newProgress: number) {
		// if duration is zero the position is always 1
		// and the state is either BEFORE or AFTER
		if (this.iterDuration <= 0) {
			newProgress = Math.sign(newProgress);
			this.progress = newProgress;
			this.position = 1;

			if (newProgress < 0) this.state = STATE_BEFORE;
			else this.state = STATE_AFTER;

			return;
		}

		this.progress = newProgress;

		// update state
		//
		// is this not wrong if we are in reversed?
		//
		// since infinite repeat can never end let's ignore it
		if (this.isFinite()) {
			const end = this.repeat + 1;
			if (this.progress > end) {
				this.progress = end + 1;
				this.state = STATE_AFTER;
			} else if (this.progress === end) {
				this.state = STATE_ENDED;
			} else {
				this.state = STATE_RUNNING;
			}
		} else {
			this.state = STATE_RUNNING;
		}

		// override state if not running
		if (this.progress < 0) {
			this.progress = -1;
			this.state = STATE_BEFORE;
		} else if (this.progress === 0) {
			this.state = STATE_START;
		}

		// now calculate the position
		this.position = this.positionAbsolute() % 1;

		// the iterations should be inclusive
		if (this.position === 0 && this.progress > 0) {
			this.position = 1;
		}

		// alternate
		if (this._shouldInvert()) this.position = 1 - this.position;

		// calc if we are in a reversed iteration or not
		// and we are we should invert the position
		if (this.reversed) this.position = 1 - this.position;

		this.position = this.ease(this.position);
	}
}

export function newTiming(props: Record<string, any>): Timing {
	const nProps = {
		duration: parseDuration(takeProp(props, 'duration', 1000)),
		ease: parseEase(takeProp(props, 'ease', null)),
		repeat: parseRepeat(takeProp(props, 'repeat', false)),
		alternate: parseAlternate(takeProp(props, 'alternate', true)),
	};
	// this._delay = parseDelay(takeProp(props, 'delay', 0));

	return new Timing(nProps);
}

export function parseDuration(dur: any): number {
	if (typeof dur !== 'number') throw new Error('duration is not a number');

	dur = Math.round(dur);

	return Math.max(dur, 0);
}

export function parseEase(ease: any): (t: number) => number {
	if (ease !== null && typeof ease !== 'function')
		throw new Error('ease needs to be null or a function');

	return ease;
}

export function parseRepeat(repeat: any): number {
	if (
		repeat !== true &&
		repeat !== false &&
		(typeof repeat !== 'number' || repeat < 0)
	)
		throw new Error('repeat needs to be true|false|0+');

	if (repeat === true) repeat = -1;
	else if (repeat === false) repeat = 0;

	return repeat;
}

export function parseDelay(delay: any): number {
	if (typeof delay !== 'number' || delay < 0)
		throw new Error('delay needs to be 0+');

	return delay;
}

export function parseAlternate(alternate: any): boolean {
	if (alternate !== true && alternate !== false)
		throw new Error('alternate needs to be true|false');

	return alternate;
}

export function parseReversed(reversed: any): boolean {
	if (reversed !== true && reversed !== false)
		throw new Error('reversed needs to be true|false');

	return reversed;
}
