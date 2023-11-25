import { takeProp } from '../utils/internal.js';
import Value from '../utils/value.js';
// import Ease from '../easing/ease.js';
import Timing from '../timing/timing.js';
import Ticker from '../timing/ticker.js';
import { newProperty } from './property.js';


export default class Animation {
	// targets;
	// #timing;

	constructor(targets, props = {}) {
		this._timing = new Timing(props);
		// todo allow to set a custom ticker
		this._ticker = Ticker.global();
		this.targets = new Targets(targets, this._ticker);

		this._props = [];

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

	play() {
		// let's register into the global ticker
		console.log('play');

		this._ticker.add((change, opts) => {
			let shouldKeepListener = false;

			this._timing.advance(change);
			if (!this._timing.ended)
				shouldKeepListener = true;

			// loop through all props and check if they have the same timing
			for (const prop of this._props) {
				if (prop._timing === this._timing)
					continue;

				prop._timing.advance(change);
				if (!prop._timing.ended)
					shouldKeepListener = true;
			}

			// now render
			for (const prop of this._props) {
				prop.render(this.targets, opts.changes);
			}

			if (!shouldKeepListener)
				opts.remove();
		});
	}

	// t = 0-1
	seek(t) {}

	pause() {}

	reset() {
		this.seek(0);
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
	getStartValue(prop) {
		return this.target.getStartValue(prop);
	}

	setValue(prop, value) {
		return this.target.setValue(prop, value);
	}
}

class PropertyAnimation {
	constructor(prop, value, animation) {
		this.prop = newProperty(prop, animation.targets.type());
		// we will get the from the targets

		this.to = this.prop.parseValue(value);

		// either the timing is custom which then only exists in this property
		// or it is shared between the animation
		this._timing = animation._timing;
	}

	render(targets, changes) {

		const pos = this._timing.position;

		const from = targets.getStartValue(this.prop);

		if (this.to.unit !== from.unit)
			throw new Error(from.unit + ' != ' + this.to.unit);

		const dif = this.to.num - from.num;


		targets.setValue(this.prop, from.cloneAdd(pos * dif));
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