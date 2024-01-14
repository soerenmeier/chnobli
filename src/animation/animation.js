import {
	newTiming, STATE_BEFORE, STATE_AFTER
} from '../timing/timing.js';

import { newProperty } from './property.js';


export default class Animation {
	// targets;
	// #timing;

	/*
	props
	*/
	constructor(target, ticker, props = {}) {
		this.timing = newTiming(props);
		this._ticker = ticker;
		this.target = ticker.registerTarget(target);

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
	}

	advance(change) {
		this._prevTimingState = this.timing.state;
		this.timing.advance(change);
	}

	seekMs(ms) {
		this._prevTimingState = this.timing.state;
		this.timing.seekMs(ms);
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

	init(reset = false) {
		if (this._initialized && !reset)
			return;
		this._initialized = true;

		for (const prop of this._props) {
			prop.init(this.target);
		}
	}

	render() {
		if (this.timing.state === STATE_BEFORE) {
			// console.log('render before');

			for (const prop of this._props) {
				prop.restoreBefore(this.target);
			}

			// to render before we need to remove 

			return;
		} else if (this.timing.state === STATE_AFTER) {
			// console.log('render after');
			// return;
		}

		const pos = this.timing.position;

		// now render
		for (const prop of this._props) {
			prop.render(pos, this.target);
		}
	}
}

function maybeResponsiveValue(prop, val) {
	if (typeof val === 'object' && 'responsive' in val)
		return val.responsive;
	return prop.parseValue(val);
}

class PropertyAnimation {
	constructor(prop, value, animation) {
		this.prop = newProperty(prop, animation.target.type());
		// we will get the from the targets

		this.valueFn = null;

		this.iniFrom = null;
		this.iniTo = null;

		if (typeof value === 'object') {
			if ('from' in value)
				this.iniFrom = maybeResponsiveValue(this.prop, value.from);
			if ('to' in value)
				this.iniTo = maybeResponsiveValue(this.prop, value.to);

			if ('responsive' in value)
				this.iniTo = value.responsive;

			if (!this.iniFrom && !this.iniTo)
				throw new Error('from or to expected');
		} else if (typeof value === 'function') {
			if (!this.prop.allowsValueFn()) {
				throw new Error(
					'prop ' + prop + ' does not allow value functions'
				);
			}

			this.valueFn = value;
		} else {
			this.iniTo = this.prop.parseValue(value);
		}
	}

	// calculate from and to position
	init(target) {
		// there is nothing to initialize since on every render we call the
		// value Fn
		if (this.valueFn)
			return;

		// init from
		let from = null;
		if (typeof this.iniFrom === 'function')
			from = this.prop.parseValue(this.iniFrom(target.target));
		else
			from = this.iniFrom;

		// init to
		let to = null;
		if (typeof this.iniTo === 'function')
			to = this.prop.parseValue(this.iniTo(target.target));
		else
			to = this.iniTo;

		this.prop.init(target, from, to);
	}

	restoreBefore(target) {
		// todo this might not be enough
		this.prop.removeValue(target);
	}

	render(pos, target) {
		if (this.valueFn) {
			this.prop.setValue(target, this.prop.parseValue(this.valueFn(pos)));
			return;
		}

		this.prop.setValue(target, this.prop.interpolate(pos));
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