import { takeProp } from '../utils/internal.js';
import Value from '../utils/value.js';
// import Ease from '../easing/ease.js';
import Timing, {
	newTiming, STATE_BEFORE, STATE_AFTER
} from '../timing/timing.js';

import { newProperty } from './property.js';


export default class Animation {
	// targets;
	// #timing;

	/*
	props
	*/
	constructor(targets, ticker, props = {}) {
		this.timing = newTiming(props);
		this._ticker = ticker;
		this.targets = new Targets(targets, this._ticker);

		this._prevTimingState = this.timing.state;
		this._props = [];
		this._initialized = false;

		for (const prop in props) {
			if (prop in this)
				throw new Error('prop: ' + prop + ' is not allowed');

			this[prop] = new PropertyAnimation(
				prop,
				props[prop],
				this
			);
			this._props.push(this[prop]);
		}


		// transform
		// we need to setup our "world"
	}

	// play() {
		// // let's register into the global ticker
		// console.log('play');
		// if (this._runningTicker)
		// 	return;

		// this._runningTicker = this._ticker.add((change, opts) => {
		// 	let shouldKeepListener = false;

		// 	this._timing.advance(change);
		// 	if (!this._timing.ended)
		// 		shouldKeepListener = true;

		// 	// loop through all props and check if they have the same timing
		// 	for (const prop of this._props) {
		// 		if (prop._timing === this._timing)
		// 			continue;

		// 		prop._timing.advance(change);
		// 		if (!prop._timing.ended)
		// 			shouldKeepListener = true;
		// 	}

		// 	// now render
		// 	for (const prop of this._props) {
		// 		prop.render(this.targets, opts.changes);
		// 	}

		// 	if (!shouldKeepListener) {
		// 		opts.remove();
		// 		this._runningTicker = null;
		// 	}
		// });
	// }

	advance(change) {
		this._prevTimingState = this.timing.state;
		this.timing.advance(change);
	}

	seek(pos) {
		this._prevTimingState = this.timing.state;
		this.timing.seek(pos);
	}

	isFinite() {
		return this.timing.isFinite();
	}

	get duration() {
		return this.timing.duration;
	}

	init() {
		if (this._initialized)
			return;
		this._initialized = true;

		for (const prop of this._props) {
			prop.init(this.targets);
		}
	}

	// renderBefore() {

	// }

	render() {
		if (this.timing.state === STATE_BEFORE) {
			// console.log('render before');

			for (const prop of this._props) {
				prop.restoreBefore(this.targets);
			}

			// to render before we need to remove 

			return;
		} else if (this.timing.state === STATE_AFTER) {
			// console.log('render after');
			// return;
		}

		// if (
		// 	this._prevTimingState === STATE_START
		// 	// this.timing.state > STATE_START
		// ) {
		// 	console.log('start animation');
		// 	// we need to start the animation
		// 	for (const prop of this._props) {
		// 		prop.start(this.targets);
		// 	}
		// }

		// let shouldKeepListener = false;

		// this._timing.advance(change);
		// if (!this._timing.ended)
		// 	shouldKeepListener = true;

		// // loop through all props and check if they have the same timing
		// for (const prop of this._props) {
		// 	if (prop._timing === this._timing)
		// 		continue;

		// 	prop._timing.advance(change);
		// 	if (!prop._timing.ended)
		// 		shouldKeepListener = true;
		// }

		const pos = this.timing.position;

		// now render
		for (const prop of this._props) {
			prop.render(pos, this.targets);
		}

		// if (!shouldKeepListener) {
		// 	opts.remove();
		// 	this._runningTicker = null;
		// }
	}
}

class Targets {
	constructor(targets, ticker) {
		if (Array.from(targets).length > 0)
			throw new Error('only one target supported');

		// this.target = targets;

		this._globalTargets = ticker._targets;

		this.target = this._globalTargets.register(targets);

		// somewhere global probably in the ticker
		// we need to store the property changes for each target
		// which will then be applied
		// this allows to merge transform stuff for example
		// optimize to only call the dom if necessary
	}

	type() {
		return this.target.type();
	}

	// get the start value
	getValue(prop) {
		return this.target.getValue(prop);
	}

	setValue(prop, value) {
		return this.target.setValue(prop, value);
	}
}

class PropertyAnimation {
	constructor(prop, value, animation) {
		this.prop = newProperty(prop, animation.targets.type());
		// we will get the from the targets

		this.iniFrom = null;
		this.iniTo = null;

		this.from = null;
		this.to = null;

		if (typeof value === 'object') {
			if ('from' in value)
				this.iniFrom = this.prop.parseValue(value.from);
			if ('to' in value)
				this.iniTo = this.prop.parseValue(value.to);

			if (!this.iniFrom && !this.iniTo)
				throw new Error('from or to expected');
		} else {
			this.iniTo = this.prop.parseValue(value);
		}

		// // either the timing is custom which then only exists in this property
		// // or it is shared between the animation
		// this._timing = animation._timing;
	}

	// calculate from and to position
	init(targets) {
		this.from = this.iniFrom;
		if (!this.from)
			this.from = targets.getValue(this.prop);

		this.to = this.iniTo;
		if (!this.to)
			this.to = targets.getValue(this.prop);

		console.log(this.prop.name, this.from, this.to);

		if (this.to.unit !== this.from.unit)
			throw new Error(this.from.unit + ' != ' + this.to.unit);
	}

	restoreBefore(targets) {
		targets.target.removeValue(this.prop);
	}

	render(pos, targets) {
		const dif = this.to.num - this.from.num;

		targets.setValue(this.prop, this.from.cloneAdd(pos * dif));
	}
}

/*

animate(target, {
	
	// special
	// translate
	x
	y
	scale
	scaleX
	scaleY
	rotation
	skew
	skewX
	skewY


	
	// stagger
	repeatDelay
	stagger: {
    // wrap advanced options in an object
    each: 0.1,
    from: "center",
    grid: "auto",
    ease: "power2.inOut",
    repeat: -1, // Repeats immediately, not waiting for the other staggered animations to finish
  },


	ease,
	duration,
	repeat, true|false|0-x
	repeatDelay?
	delay,
	alternate
})


const tl new Timeline;

tl.add([
	animation()
], 100)

tl.addGroup()

tl.add()

*/