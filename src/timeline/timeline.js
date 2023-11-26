import { takeProp } from '../utils/internal.js';
import Timing, {
	parseEase, parseRepeat, parseAlternate, parseReversed,
	STATE_RUNNING
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
		// this.animationsStartOrder = [];
		// this.animationsEndOrder = [];

		this._initialized = false;
		this._renderQueue = null;
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

		this._initAnimations();

		// console.log(this.entries.map(e => e.value._props[0]));
	}

	_initAnimations() {
		// we don't won't to have a reversed timing
		const reversed = this.timing.reversed;
		this.timing.reversed = false;

		// now initialize all animtaions
		const startOrdered = this.entries.filter(e => e.type === 'animation');
		startOrdered.sort((a, b) => a.start - b.start);

		for (let i = 0; i < startOrdered.length; i++) {
			const entry = startOrdered[i];

			this.timing.seek(entry.start / this.timing.iterDuration);

			const pos = this.timing.position * this.timing.iterDuration;

			// seek all previous and render
			for (let y = 0; y < i; y++) {
				const prevEntry = startOrdered[y];
				const prevAnimation = prevEntry.value;

				const p = (pos - prevEntry.start) / prevAnimation.duration;

				prevAnimation.seek(p);
				prevAnimation.render();
			}

			entry.value.init();
		}

		// this.

		this.timing.seek(0);
		this.timing.reversed = reversed;
		startOrdered.forEach(e => {
			e.value.seek(-1);
			e.value.render();
		});

		console.log('init done');
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


		// // render inactive
		// for (const animation of this._inactiveRender) {
		// 	console.log('inactive render');
		// 	animation.render();
		// 	console.log('inactive rendered', animation.timing.state);
		// }

		// for (const entry of this.entries) {
		// 	if (entry.type !== 'animation')
		// 		continue;

		// 	if (entry.render)
		// 		entry.value.render();
		// }
	}

	_updateTimings() {
		this._renderQueue = {
			upcoming: [],
			passed: [],
			active: []
		};

		const pos = this.timing.position * this.timing.iterDuration;
		console.log('tlPos', pos);

		for (const entry of this.entries) {
			if (entry.type !== 'animation')
				continue;

			const animation = entry.value;

			const p = (pos - entry.start) / animation.duration;

			const prevState = animation.timing.state;

			animation.seek(p);

			// const shouldRender = animation.timing.state === STATE_RUNNING ||
			// 	prevState !== animation.timing.state;

			// if (!shouldRender)
			// 	continue;

			if (p > 1) {
				this._renderQueue.passed.push(animation);
			} else if (p < 0) {
				this._renderQueue.upcoming.push(animation);
			} else {
				this._renderQueue.active.push(animation);
			}

			// const active = p >= 0 && p <= 1;

			// // todo optimize this
			// const prevState = animation.timing.state;
			
			// const stateChanged = animation.timing.state !== prevState;

			// // last Render
			// if (!active && (entry.render || stateChanged))
			// 	this._inactiveRender.push(animation);

			// entry.render = active;
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