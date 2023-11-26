import Ease from './ease.js';
import { takeProp } from '../utils/internal.js';

export const STATE_BEFORE = 0;
export const STATE_START = 1;
export const STATE_RUNNING = 2;
export const STATE_ENDED = 3;
export const STATE_AFTER = 4;

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
		this.setDuration(props.duration);
		this.ease = props.ease ?? (t => t);
		this.repeat = props.repeat ?? 0;
		this.alternate = props.alternate ?? true;
		this.reversed = props.reversed ?? false;

		this.position = 0;
		this.state = STATE_BEFORE;

		// progress does not take alternation into account and has no easing
		// this always increments up until it overflows
		this._progress = 0;
		// this._reversed = false;

		// scrub
	}

	setDuration(iterDuration) {
		this.iterDuration = iterDuration;

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

	// should be between 0-1 if outside might change the state
	seek(pos) {
		if (this.repeat <= 0) {
			this._updateProgress(pos);
		} else {
		// finite
			this._updateProgress(pos * (this.repeat + 1));
		}
	}

	reverse() {
		this.reversed = !this.reversed;

		let p = Math.floor(this._progress);
		p = p + (1 - (this._progress - p));

		this._updateProgress(p);
	}

	_updateProgress(newProgress) {
		this._progress = newProgress;

		// since infite repeat can never end let's ignore it
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


		let reversed = this.reversed;

		// calc if we are in a reversed iteration or not
		if (this.alternate) {
			let shouldInverse = Math.floor(this._progress) % 2 === 1;
			if (shouldInverse)
				reversed = !reversed;
		}

		// now calculate the position

		this.position = this._progress % 1;

		if (reversed)
			this.position = 1 - this.position;

		this.position = this.ease(this.position);
	}
}

export function newTiming(props) {
	const nProps = {
		duration: parseDuration(takeProp(props, 'duration', 1)),
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
	dur = Math.round(dur * 1000);

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