import Ease from './ease.js';
import { takeProp } from '../utils/internal.js';

// const START = 0;
// const RUNNING = 1;
// const ENDING = 2;
// const ENDED = 3;

export default class Timing {
	// removes the relevant properties from the props

	// props duration: in s 0-x
	constructor(props) {
		// in ms
		this._duration = parseDuration(takeProp(props, 'duration', 1));
		//
		this._ease = new Ease(takeProp(props, 'ease', null));
		// -1 inifinite | repeat
		this._repeat = parseRepeat(takeProp(props, 'repeat', false));
		this._delay = parseDelay(takeProp(props, 'delay', 0));
		this._alternate = parseAlternate(takeProp(props, 'alternate', true));

		this.position = 0;
		this.ended = false;

		// progress does not take alternation into account and has no easing
		this._progress = 0;
		this._iteration = 1;
		// scrub
	}

	advance(change) {
		if (this.ended)
			return;

		this._progress += change / this._duration;

		// check if we should repeat
		if (this._progress > 1) {
			// yes repeat
			if (this._repeat !== 0) {
				// can still repeat
				if (this._repeat < 0 || this._repeat - this._iteration > 0) {
					this._iteration += 1;
					this._progress -= 1;
				} else {
					// reached the end
					this._progress = 1;
					this.ended = true;
				}
			} else {
				// no don't repeat todo should change state to ended
				this._progress = 1;
				this.ended = true;
			}
		}

		this.position = this._progress;

		// alternate
		if (this._alternate && this._iteration % 2 === 0) {
			this.position = 1 - this.position;
		}

		this.position = this._ease.apply(this.position);
	}
}

function parseDuration(dur) {
	if (typeof dur !== 'number')
		throw new Error('duration is not a number');

	// convert s to ms
	dur = Math.round(dur * 1000);

	return Math.max(dur, 1);
}

function parseRepeat(repeat) {
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

function parseDelay(delay) {
	if (typeof delay !== 'number' || delay < 0)
		throw new Error('delay needs to be 0+');

	return delay;
}

function parseAlternate(alternate) {
	if (alternate !== true && alternate !== false)
		throw new Error('alternate needs to be true|false');

	return alternate;
}