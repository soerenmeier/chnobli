// A simple timing which supports easing and reversing

import {
	STATE_BEFORE,
	STATE_START,
	STATE_RUNNING,
	STATE_ENDED,
	STATE_AFTER,
	Position,
} from './Timing.js';

export type SimpleTimingProps = {
	duration: number;
	ease?: (t: number) => number;
	reversed?: boolean;
};

/**
 * This class handles everything timing related
 *
 * It manages easing, keeps track of where we are at the moment
 *
 * The most important property is position which gives the calculated position
 *
 * Timing works the same as in after effects
 * if the duration is not at least 1ms the position is always 1 and either
 * STATE_BEFORE or STATE_AFTER
 *
 * if the duration is 1ms seek 0 or 1 will always result in position 1
 * because it is like one frame, so it's an image
 */
export default class SimpleTiming {
	// removes the relevant properties from the props

	/**
	 * The total duration of the timing
	 */
	duration: number;

	ease: (t: number) => number;
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
	 * Progress is the current progress of the timing
	 * without reversing or easing
	 *
	 * -1 | 0..=1 | 2
	 */
	private progress: number;

	constructor(props: SimpleTimingProps) {
		// these vars are only readonly
		// use functions to update them

		this.ease = props.ease ?? (t => t);
		this.reversed = props.reversed ?? false;

		this.duration = 0;
		this.setDuration(props.duration);

		this.position = 0;
		this.state = STATE_BEFORE;
		this.progress = 0;
		this.seek(-1);
	}

	setDuration(duration: number) {
		this.duration = duration;
	}

	/**
	 * Returns the current position in milliseconds
	 *
	 * This is **not** equivalent to position * duration
	 */
	positionMs() {
		return this.positionAbsolute() * this.duration;
	}

	// todo find a better name
	/**
	 * Returns the position in milliseconds
	 *
	 * If the state is before or after the position might be more/less than
	 * required
	 */
	positionMsUnbounded() {
		return this.progress * this.duration;
	}

	advance(change: number) {
		if (this.state >= STATE_AFTER) return;

		if (this.duration <= 0) {
			this._updateProgress(1);
			return;
		}

		this._updateProgress(this.positionAbsolute() + change / this.duration);
	}

	seekMs(ms: number) {
		return this.seek(this.normalizeMs(ms));
	}

	/**
	 * Returns the position of time (ms) position
	 */
	normalizeMs(ms: number): number {
		if (this.duration <= 0) {
			return Math.sign(ms);
		}

		return ms / this.duration;
	}

	// Returns the position without easing or reversing
	//
	// Returns 0..=1
	positionAbsolute(): number {
		return Math.min(1, Math.max(0, this.progress));
	}

	//
	/**
	 * Seek to a specific position
	 *
	 * The position is absolute so if pos = 0 get's set the position of the timing might be
	 * 1 if the timing is reversed
	 *
	 * The position *should* be between 0-1 if outside might change the state
	 */
	seek(pos: number) {
		this._updateProgress(pos);
	}

	savePosition(): Position {
		return {
			progress: this.progress,
		};
	}

	restorePosition(pos: Position) {
		this._updateProgress(pos.progress);
	}

	reverse() {
		this.reversed = !this.reversed;

		this._updateProgress(1 - this.progress);
	}

	/**
	 * Updates the progress and the state
	 *
	 * newProgress should follow the same rules as progress
	 */
	_updateProgress(newProgress: number) {
		// if duration is zero the position is always 1
		// and the state is either BEFORE or AFTER
		if (this.duration <= 0) {
			newProgress = Math.sign(newProgress);
			this.progress = newProgress;
			this.position = 1;

			if (newProgress < 0) this.state = STATE_BEFORE;
			else this.state = STATE_AFTER;

			return;
		}

		this.progress = newProgress;

		if (newProgress < 0) {
			this.progress = -1;
			this.state = STATE_BEFORE;
		} else if (newProgress === 0) {
			this.state = STATE_START;
		} else if (newProgress === 1) {
			this.state = STATE_ENDED;
		} else if (newProgress > 1) {
			this.progress = 2;
			this.state = STATE_AFTER;
		} else {
			// > 0 && < 1
			this.state = STATE_RUNNING;
		}

		// now reverse the state if needed
		// if (this.reversed) {
		// 	this.state = 4 - this.state;
		// }

		// now calculate the position
		this.position = Math.min(1, Math.max(0, this.progress));

		// calc if we are in a reversed iteration or not
		// and we are we should invert the position
		if (this.reversed) this.position = 1 - this.position;

		this.position = this.ease(this.position);
	}
}
