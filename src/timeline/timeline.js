import { takeProp } from '../utils/internal.js';
import Timing, {
	parseEase, parseRepeat, parseAlternate, parseReversed
} from '../timing/timing.js';
import Ticker from '../timing/ticker.js';
import Animation from '../animation/animation.js';

export default class Timeline {
	/*
	{
		ease,
		repeat: -1 - x,
		alternate
	}
	*/
	constructor(props = {}) {
		const nProps = {
			duration: 1,
			ease: parseEase(takeProp(props, 'ease', null)),
			repeat: parseRepeat(takeProp(props, 'repeat', false)),
			alternate: parseAlternate(takeProp(props, 'alternate', true)),
			reversed: parseReversed(takeProp(props, 'reversed', false))
		};

		this.timing = new Timing(nProps);
		this.ticker = Ticker.global();

		// { type: label|animation, value: {}, offset, start: x, end: y, render }
		this.entries = [];

		this._initialized = false;
		this._inactiveRender = [];
	}

	add(targets, props, offset = null) {
		const animation = new Animation(targets, this.ticker, props);

		if (!animation.isFinite())
			throw new Error('the animation needs to be finite');

		this.entries.push({
			type: 'animation',
			value: animation,
			offset: new Offset(offset)
		});

		return this;
	}

	label(label, offset = null) {
		this.entries.push({
			type: 'label',
			value: label,
			offset: new Offset(offset)
		});

		return this;
	}

	advance(change) {
		this.timing.advance(change);

		this._updateTimings();
	}

	seek(pos) {
		this.timing.seek(pos);

		this._updateTimings();
	}

	init() {
		if (this._initialized)
			return;
		this._initialized = true;

		let pos = 0;
		// let duration = 0;

		const labels = {};

		for (const entry of this.entries) {
			let offset = entry.offset;

			if (offset.type === 'label') {
				if (!(offset.value in labels))
					throw new Error('could not find label ' + offset.value);

				offset = new Offset(labels[offset.value]);
			}

			let start = offset.calculate(pos);
			if (start < 0)
				throw new Error('cannot go in the past start < 0');

			let end = start;
			if (entry.type === 'animation')
				end += entry.value.duration;

			if (entry.type === 'label')
				labels[entry.value] = start;

			entry.start = start;
			// entry.end = end;

			pos = Math.max(end, pos);
		}

		this.timing.setDuration(pos);
	}

	render() {
		// render inactive
		for (const animation of this._inactiveRender) {
			animation.render();
		}

		for (const entry of this.entries) {
			if (entry.type !== 'animation')
				continue;

			if (entry.render)
				entry.value.render();
		}
	}

	_updateTimings() {
		this._inactiveRender = [];

		const pos = this.timing.position * this.timing.iterDuration;

		for (const entry of this.entries) {
			if (entry.type !== 'animation')
				continue;

			const animation = entry.value;

			const p = (pos - entry.start) / animation.duration;

			const active = p >= 0 && p <= 1;

			// last Render
			if (!active && entry.render) {
				animation.seek(Math.min(Math.max(p, 0), 1));
				this._inactiveRender.push(animation);
			} else if (active) {
				animation.seek(Math.min(Math.max(p, 0), 1));
			}

			entry.render = active;
		}
	}
}


class Offset {
	constructor(offset = null) {
		this.type = 'none';

		if (typeof offset === 'number') {
			this.type = 'absolute';
			this.value = offset * 1000;
		} else if (typeof offset === 'string') {
			if (offset.startsWith('-=')) {
				this.type = 'sub';
				this.value = parseFloat(offset.substring(2)) * 1000;
			} else if (offset.startsWith('+=')) {
				this.type = 'add';
				this.value = parseFloat(offset.substring(2)) * 1000;
			} else {
				this.type = 'label';
				this.value = offset;
			}
		}
	}

	calculate(pos) {
		if (this.type === 'none')
			return pos;

		if (this.type === 'absolute')
			return this.value;

		if (this.type === 'sub')
			return pos - this.value;

		if (this.type === 'add')
			return pos + this.value;

		throw new Error('cannot calculate for type ' + this.type);
	}
}