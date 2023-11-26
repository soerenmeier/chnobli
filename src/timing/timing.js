import Ease from './ease.js';
import { takeProp } from '../utils/internal.js';

// does timing need repeat here? or should that be in another class?

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
		this.ended = false;

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
		if (this.ended)
			return;

		this._updateProgress(this._progress + change / this.iterDuration);
	}

	// needs to be between 0 and 1
	seek(pos) {
		if (this.repeat <= 0) {
			this._updateProgress(pos);
		} else {
		// finite
			this._updateProgress(pos * (this.repeat + 1));
		}
	}

	_updateProgress(newProgress) {
		// console.log('newProgress', newProgress);

		// const prevIter = Math.floor(this._progress);
		this._progress = newProgress;
		const iter = Math.floor(this._progress);

		let reversed = this.reversed;

		if (this.repeat === 0 && this._progress > 1) {
			// let's stop it
			this._progress = 1;
			this.ended = true;
		} else if (this.repeat > 0 && this.repeat < iter) {
			// repetition ends
			this._progress = iter;
			this.ended = true;
		} else {
			this.ended = false;

			// const iterChange = Math.floor(this._progress) - prevIter;
			// if (iterChange === 1)
			// 	debugger;

			// if (this._progress > 1) {
			// 	debugger
			// }

			// calc if we are in a reversed iteration or not
			if (this.alternate) {
				// debugger;
				let shouldInverse = Math.floor(this._progress) % 2 === 1;
				if (shouldInverse)
					reversed = !reversed;
			}

			// alternate
			// if (iterChange > 0 && this.alternate) {
			// 	let shouldInverse = iterChange % 2 === 1;
			// 	if (shouldInverse)
			// 		this.reversed = !this.reversed;
			// }
		}

		// now calculate the position

		this.position = this._progress % 1;

		if (reversed)
			this.position = 1 - this.position;

		this.position = this.ease(this.position);
		// debugger
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