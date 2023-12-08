import { takeProp } from '../utils/internal.js';
import Timeline from './timeline.js';
import { STATE_BEFORE, STATE_AFTER } from '../timing/timing.js';
import { callStagger } from '../stagger/stagger.js';
import Events from '../utils/events.js';

const STATE_PAUSED = 0;
const STATE_RENDER_ONCE = 1;
const STATE_PLAYING = 2;

export default class PublicTimeline {
	constructor(props = {}) {
		this._defaults = takeProp(props, 'defaults', {});
		this._inner = new Timeline(props);

		// 'start', 'end'
		this._events = new Events;

		this._state = STATE_PAUSED;
		this._runningTicker = null;
	}

	set(targets, props, offset = null) {
		// for the moment let's just add as usual but set the duration to 0
		return this.add(targets, { ...props, duration: 0 }, offset);
	}

	add(targets, props, offset = null) {
		if (Array.from(targets).length === 0)
			targets = [targets];
		else
			targets = Array.from(targets);

		let i = -1;
		for (const target of targets) {
			i++;

			const nProps = {
				...this._defaults,
				...props
			};

			for (const prop in nProps) {
				nProps[prop] = callStagger(nProps[prop], i, targets.length);
			}

			const nOffset = callStagger(offset, i);

			this._inner.add(target, nProps, nOffset, i);
		}

		return this;
	}

	label(label, offset = null) {
		this._inner.label(label, offset);

		return this;
	}

	play() {
		if (this._state === STATE_PLAYING)
			return;

		this._state = STATE_PLAYING;

		this._startTicker();

		return this;
	}

	pause() {
		if (this._state === STATE_PAUSED)
			return;

		this._state = STATE_PAUSED;

		this._stopTicker();
	}

	// 0-1
	seek(pos) {
		this._inner.init();

		this._inner.seek(pos);

		if (this._state !== STATE_PLAYING)
			this._state = STATE_RENDER_ONCE;

		this._startTicker();
	}

	reset() {
		this._inner.seek(0);
	}

	reverse() {
		this._inner.timing.reverse();
	}

	// start, update, end -> () => // remove Event
	on(event, fn) {
		return this._events.add(event, fn);
	}

	onPromise(event) {
		return this._events.wait(event);
	}

	_startTicker() {
		if (this._runningTicker)
			return;

		this._inner.init();

		this._runningTicker = this._inner.ticker.add(change => {
			if (this._inner.timing.state === STATE_BEFORE) {
				this._events.trigger('start');
			}

			if (this._inner.timing.state === STATE_AFTER) {
				this._stopTicker();
				this._events.trigger('end');
				return;
			}

			if (this._state === STATE_PLAYING)
				this._inner.advance(change);

			// todo when we add smooth seeks we need to update this

			this._inner.render();

			// we rendered once let's stop
			if (this._state === STATE_RENDER_ONCE) {
				this._state = STATE_PAUSED;
				this._stopTicker();
			}
		});
	}

	_stopTicker() {
		if (!this._runningTicker)
			return;

		this._runningTicker.remove();
		this._runningTicker = null;
	}

	// update() {
	// 	console.log('render');
	// 	this._inner.render();
	// }
}