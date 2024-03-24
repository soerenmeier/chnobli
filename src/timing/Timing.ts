import { takeProp } from '../utils/internal';

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
	// removes the relevant properties from the props

	iterDuration: number;
	duration: number;

	ease: (t: number) => number;
	repeat: number;
	alternate: boolean;
	reversed: boolean;

	position: number;
	state: number;

	private _progress: number;

	/*
	seeking
	if repeat is infinite
	seek will only control the current iteration
	if repeat is finite
	seek will control the entire time


	{
		duration: in ms
		ease: easeFunction
		repeat: -1 - x,
		alternate
	}
	*/
	constructor(props: Record<string, any>) {
		// these vars are only readonly
		// use functions to update them

		this.iterDuration = props.duration;
		this.duration = props.duration;

		this.ease = props.ease ?? (t => t);
		this.repeat = props.repeat ?? 0;
		this.alternate = props.alternate ?? true;
		this.reversed = props.reversed ?? false;

		this.position = this.duration > 0 ? 0 : 1;
		this.state = STATE_BEFORE;

		// progress does not take alternation into account and has no easing
		// this always increments up
		this._progress = 0;

		// scrub
	}

	setDuration(iterDuration: number) {
		this.iterDuration = iterDuration;

		this.duration = this.iterDuration;
		if (this.repeat > -1) {
			this.duration = (this.repeat + 1) * this.iterDuration;
		}
	}

	positionMs() {
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
		const outOfBounds =
			this.state <= STATE_BEFORE || this.state >= STATE_AFTER;

		if (!outOfBounds) return this.position * this.iterDuration;

		if (this.position === 0) return -1;
		return this.position * this.iterDuration + 1;
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

		this._updateProgress(this._progress + change / this.iterDuration);
	}

	seekMs(ms: number) {
		if (this.iterDuration <= 0) {
			this._updateProgress(Math.sign(ms));
			return;
		}

		this._updateProgress(ms / this.iterDuration);
	}

	// should be between 0-1 if outside might change the state
	seek(pos: number) {
		if (this.repeat <= 0) {
			this._updateProgress(pos);
		} else {
			// finite
			this._updateProgress(pos * (this.repeat + 1));
		}
	}

	savePosition(): Position {
		return {
			progress: this._progress,
		};
	}

	restorePosition(pos: Position) {
		this._updateProgress(pos.progress);
	}

	setAlternate(alternate: boolean) {
		if (this.alternate == alternate) return;

		// make sure the reversed is updated according to the current inversion
		this.reversed = alternate == this._shouldInvert();
		this.alternate = alternate;
	}

	reverse() {
		this.reversed = !this.reversed;

		const wrapAround = (p: number) => {
			if (this.repeat > -1) return p % (this.repeat + 1);
			return p;
		};

		let p;
		if (this.state <= STATE_BEFORE) {
			p = 2;
		} else if (this.state >= STATE_AFTER) {
			p = -1;
			// check if the values should be reversed
		} else if (this.reversed != this._shouldInvert()) {
			let decimal = 1 - (this._progress % 1);
			p = wrapAround(Math.floor(this._progress) + decimal);
		} else {
			p = wrapAround(this._progress);
		}

		this._updateProgress(p);
	}

	_shouldInvert() {
		return this.alternate && Math.floor(this._progress) % 2 === 1;
	}

	_updateProgress(newProgress: number) {
		// if duration is zero the position is always 1
		// and the state is either BEFORE or AFTER
		if (this.iterDuration <= 0) {
			newProgress = Math.sign(newProgress);
			this._progress = newProgress;
			this.position = 1;

			if (newProgress < 0) this.state = STATE_BEFORE;
			else this.state = STATE_AFTER;

			return;
		}

		this._progress = newProgress;

		// since infinite repeat can never end let's ignore it
		if (this.repeat > -1) {
			const end = this.repeat + 1;
			if (this._progress > end) {
				this._progress = end;
				this.state = STATE_AFTER;
			} else if (this._progress === end) {
				this.state = STATE_ENDED;
			} else {
				this.state = STATE_RUNNING;
			}
		} else {
			this.state = STATE_RUNNING;
		}

		// override state if not running
		if (this._progress < 0) {
			this._progress = 0;
			this.state = STATE_BEFORE;
		} else if (this._progress === 0) {
			this.state = STATE_START;
		}

		// now calculate the position
		this.position = this._progress % 1;

		// calc if we are in a reversed iteration or not
		// and we are we should invert the position
		if (this.reversed != this._shouldInvert())
			this.position = 1 - this.position;

		this.position = this.ease(this.position);
	}
}

export function newTiming(props: Record<string, any>) {
	const nProps = {
		duration: parseDuration(takeProp(props, 'duration', 1000)),
		ease: parseEase(takeProp(props, 'ease', null)),
		repeat: parseRepeat(takeProp(props, 'repeat', false)),
		alternate: parseAlternate(takeProp(props, 'alternate', true)),
	};
	// this._delay = parseDelay(takeProp(props, 'delay', 0));

	return new Timing(nProps);
}

export function parseDuration(dur: any) {
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
