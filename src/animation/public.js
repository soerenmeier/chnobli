import { takeProp } from '../utils/internal.js';
import Timeline from '../timeline/public.js';
import { parseDelay } from '../timing/timing.js';
import { staggerMap } from '../stagger/stagger.js';

export default class PublicAnimation {
	constructor(targets, props = {}) {
		const autoplay = parseAutoplay(takeProp(props, 'autoplay', true));
		const delay = takeProp(props, 'delay', 0);

		// we don't wan't the ease and duration on the timeline
		const ease = takeProp(props, 'ease', null);
		const duration = takeProp(props, 'duration', null);

		this._tl = new Timeline(props);

		props.ease = ease;
		props.duration = duration;

		this._tl.add(targets, props, staggerMap(delay, v => '+=' + v));

		if (autoplay)
			this._tl.play();
	}

	play() {
		this._tl.play();
	}

	pause() {
		this._tl.pause();
	}

	// 0-1
	seek(pos) {
		this._tl.seek(pos);
	}

	reset() {
		this._tl.reset();
	}

	reverse() {
		this._tl.reverse();
	}
}

function parseAutoplay(autoplay) {
	if (autoplay !== true && autoplay !== false)
		throw new Error('autoplay needs to be true|false');

	return autoplay;
}