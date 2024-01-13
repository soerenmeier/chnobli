import { takeProp } from '../utils/internal.js';
import Timing, {
	parseEase, parseRepeat, parseAlternate, parseReversed,
	STATE_RUNNING, STATE_AFTER, STATE_BEFORE, STATE_ENDED
} from '../timing/timing.js';
import Ticker from '../timing/ticker.js';
import Animation from '../animation/animation.js';

/**
 * Timeline is the most versatile class
 * 
 * A timeline can contain multiple animation, ordered one after the other or
 * offset.
 */
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
			duration: 1000,
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
		this._renderQueue = null;
	}

	// relative represents the point which the offset should be taken
	// if relative 1 is done the offset will be taken from the previous - 1
	add(targets, props, offset = null, relative = 0) {
		const animation = new Animation(targets, this.ticker, props);

		if (!animation.isFinite())
			throw new Error('the animation needs to be finite');

		this.entries.push({
			type: 'animation',
			value: animation,
			offset: new Offset(offset),
			relativeOffset: relative
		});

		return this;
	}

	label(label, offset = null) {
		this.entries.push({
			type: 'label',
			value: label,
			offset: new Offset(offset),
			relativeOffset: 0
		});

		return this;
	}

	advance(change) {
		this.timing.advance(change);

		this._updateTimings();
	}

	seekMs(ms) {
		this.timing.seekMs(ms);

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

		let duration = 0;

		const labels = {};

		let i = -1;
		for (const entry of this.entries) {
			i++;
			let offset = entry.offset;

			if (offset.type === 'label') {
				if (!(offset.value in labels))
					throw new Error('could not find label ' + offset.value);

				offset = new Offset(labels[offset.value]);
			}

			const pos = this.entries[i - 1 - entry.relativeOffset]?.end ?? 0;

			let start = offset.calculate(pos);
			if (start < 0)
				throw new Error('cannot go in the past start < 0');

			let end = start;
			if (entry.type === 'animation')
				end += entry.value.duration;

			if (entry.type === 'label')
				labels[entry.value] = start;

			entry.start = start;
			entry.end = end;

			duration = Math.max(end, duration);
		}

		this.timing.setDuration(duration);

		this._initAnimations();

		// console.log(this.entries.map(e => e.value._props[0]));
	}

	_initAnimations(reset = false) {
		// we don't wan't to have a reversed timing
		const reversed = this.timing.reversed;
		this.timing.reversed = false;

		// now initialize all animations
		// initialization means
		// we need to define which value should be used as the from and the to
		// value
		const startOrdered = this.entries.filter(e => e.type === 'animation');
		startOrdered.sort((a, b) => a.start - b.start);

		for (let i = 0; i < startOrdered.length; i++) {
			const entry = startOrdered[i];

			this.timing.seekMs(entry.start);

			const pos = this.timing.positionMs();

			// seek all previous and render
			for (let y = 0; y < i; y++) {
				const prevEntry = startOrdered[y];
				const prevAnimation = prevEntry.value;

				prevAnimation.seekMs(pos - prevEntry.start);
				prevAnimation.render();
			}

			entry.value.init(reset);
		}

		this.timing.seek(-1);
		this.timing.reversed = reversed;
		startOrdered.forEach(e => {
			e.value.seek(-1);
			e.value.render();
		});
	}

	render() {
		// the rendering order needs to be as follows
		// upcoming
		// passed
		// active

		for (const animation of this._renderQueue.upcoming) {
			animation.render();
		}

		for (const animation of this._renderQueue.passed) {
			animation.render();
		}

		for (const animation of this._renderQueue.active) {
			animation.render();
		}
	}

	_updateTimings() {
		this._renderQueue = {
			upcoming: [],
			passed: [],
			active: []
		};

		let pos = this.timing.positionMs();
		if (this.timing.state <= STATE_BEFORE) {
			pos = -1;
		} else if (this.timing.state >= STATE_AFTER) {
			pos += 1;
		}

		for (const entry of this.entries) {
			if (entry.type !== 'animation')
				continue;

			const animation = entry.value;
			animation.seekMs(pos - entry.start);

			if (animation.timing.state >= STATE_ENDED) {
				this._renderQueue.passed.push(animation);
			} else if (animation.timing.state <= STATE_BEFORE) {
				this._renderQueue.upcoming.push(animation);
			} else {
				this._renderQueue.active.push(animation);
			}
		}
	}

	update() {
		const pos = this.timing.savePosition();
		this.timing.seek(-1);
		this._updateTimings();
		this.render();
		this.ticker.applyTargets();
		// we now have removed every style we set
		// we should be able to recalculate everything now
		this._initAnimations(true);

		this.timing.restorePosition(pos);
		this._updateTimings();
		this.render();
		this.ticker.applyTargets();
	}
}


class Offset {
	constructor(offset = null) {
		this.type = 'none';

		if (typeof offset === 'number') {
			this.type = 'absolute';
			this.value = offset;
		} else if (typeof offset === 'string') {
			if (offset.startsWith('-=')) {
				this.type = 'sub';
				this.value = parseFloat(offset.substring(2));
			} else if (offset.startsWith('+=')) {
				this.type = 'add';
				this.value = parseFloat(offset.substring(2));
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