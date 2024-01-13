import Ease from './ease.js';
import { takeProp } from '../utils/internal.js';

export const STATE_BEFORE = 0;
/// start only occurs if the current position is exactly 0
export const STATE_START = 1;
export const STATE_RUNNING = 2;
/// ended only occurs if the current position is exactly 1
export const STATE_ENDED = 3;
export const STATE_AFTER = 4;

/**
 * This class handles everything timing related
 * 
 * It manages easing, keeps track of where we are at the moment
 * 
 * The most important property is position which gives the calculated position
 * 
 * 
 * Timing works the same as in after effects
 * duration must be at least 1ms
 * 
 * if the duration is 1ms seek 0 or 1 will always result in position 1
 * because it is like one frame, so it's an image
 */
export default class Timing {
	// removes the relevant properties from the props

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
	constructor(props) {
		// these vars are only readonly
		// use functions to update them

		this.setDuration(props.duration);
		this.ease = props.ease ?? (t => t);
		this.repeat = props.repeat ?? 0;
		this.alternate = props.alternate ?? true;
		this.reversed = props.reversed ?? false;

		this.position = 0;
		this.state = STATE_BEFORE;

		// progress does not take alternation into account and has no easing
		// this always increments up
		this._progress = 0;

		// scrub
	}

	positionMs() {
		return this.position * this.iterDuration;
	}

	/// iterDuration will always be >=1
	setDuration(iterDuration) {
		this.iterDuration = Math.max(iterDuration, 1);

		this.duration = this.iterDuration;
		if (this.repeat > -1) {
			this.duration = (this.repeat + 1) * this.iterDuration;
		}
	}

	isFinite() {
		return this.repeat > -1;
	}

	advance(change) {
		if (this.state >= STATE_AFTER)
			return;

		this._updateProgress(this._progress + change / this.iterDuration);
	}

	seekMs(ms) {
		this._updateProgress(ms / this.iterDuration);
	}

	// should be between 0-1 if outside might change the state
	seek(pos) {
		if (this.repeat <= 0) {
			this._updateProgress(pos);
		} else {
		// finite
			this._updateProgress(pos * (this.repeat + 1));
		}
	}

	setAlternate(alternate) {
		if (this.alternate == alternate)
			return;

		// make sure the reversed is updated according to the current inversion
		this.reversed = alternate == this._shouldInvert();
		this.alternate = alternate;
	}

	reverse() {
		this.reversed = !this.reversed;

		let p;
		if (this.state <= STATE_BEFORE) {
			p = 2;
		} else if (this.state >= STATE_AFTER) {
			p = -1;
		// check if the values should be reversed
		} else if (this.reversed != this._shouldInvert()) {
			p = Math.floor(this._progress);
			p = p + (1 - (this._progress - p));
		} else {
			p = this._progress;
		}

		this._updateProgress(p);
	}

	_shouldInvert() {
		return this.alternate && Math.floor(this._progress) % 2 === 1;
	}

	_updateProgress(newProgress) {
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

export function newTiming(props) {
	const nProps = {
		duration: parseDuration(takeProp(props, 'duration', 1000)),
		ease: parseEase(takeProp(props, 'ease', null)),
		repeat: parseRepeat(takeProp(props, 'repeat', false)),
		alternate: parseAlternate(takeProp(props, 'alternate', true))
	};
	// this._delay = parseDelay(takeProp(props, 'delay', 0));

	return new Timing(nProps);
}

export function parseDuration(dur) {
	if (typeof dur !== 'number')
		throw new Error('duration is not a number');

	// convert s to ms
	dur = Math.round(dur);

	return Math.max(dur, 1);
}

export function parseEase(ease) {
	if (ease !== null && typeof ease !== 'function')
		throw new Error('ease needs to be null or a function');

	return ease;
}

export function parseRepeat(repeat) {
	if (
		repeat !== true && repeat !== false &&
		(typeof repeat !== 'number' || repeat < 0)
	)
		throw new Error('repeat needs to be true|false|0+');

	if (repeat === true)
		repeat = -1;
	else if (repeat === false)
		repeat = 0;

	return repeat;
}

export function parseDelay(delay) {
	if (typeof delay !== 'number' || delay < 0)
		throw new Error('delay needs to be 0+');

	return delay;
}

export function parseAlternate(alternate) {
	if (alternate !== true && alternate !== false)
		throw new Error('alternate needs to be true|false');

	return alternate;
}

export function parseReversed(reversed) {
	if (reversed !== true && reversed !== false)
		throw new Error('reversed needs to be true|false');

	return reversed;
}