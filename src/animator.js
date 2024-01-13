/* eslint no-unused-vars: 0 */

import { quadInOut, quadOut } from './easing/index.js';
import { range } from 'fire/util.js';

const START = 0;
const RUNNING = 1;
const ENDING = 2;
const ENDED = 3;

export default class Animator {
	constructor(el, props) {
		this.el = el;

		this.running = false;

		this.props = [];

		this.prevTime = null;


		for (const propName in props) {
			const prop = new PropertyAnimator(propName, props[propName], el);
			this.props.push(prop);
			this[propName] = prop;
		}
	}

	// if the animation loop has not started starts it
	run() {
		// if running
		if (this.prevTime !== null)
			return;

		requestAnimationFrame(a => this._tick(a));
	}

	_tick(elapsed) {
		if (this.prevTime === null)
			this.prevTime = elapsed;

		const change = elapsed - this.prevTime;
		this.prevTime = elapsed;

		const transforms = [];
		const cssVars = [];

		let stillRunning = false;

		for (const prop of this.props) {
			prop._tick(change);

			if (prop.state < ENDED)
				stillRunning = true;

			if (prop.name === 'translateY' || prop.name === 'scale')
				transforms.push(prop);
			else if (prop.name.startsWith('--'))
				cssVars.push(prop);
			else
				throw new Error('unknown prop ' + prop.name);
		}

		if (!stillRunning) {
			this.prevTime = null;
			return;
		}

		if (transforms.some(t => t.state  < ENDED)) {
			this.el.style.transform = transforms.map(t => {
				const v = t._toTransformValue();
				return v;
			}).join(' ');
		}

		for (const prop of cssVars) {
			if (prop.state < ENDED)
				this.el.style.setProperty(prop.name, prop._toCssValue());
		}

		requestAnimationFrame(a => this._tick(a));
	}
}


class PropertyAnimator {
	constructor(name, type, el) {
		this.name = name;
		this.type = type;

		this.fromV = null;
		this.currentV = null;
		this.toV = null;

		this.easing = quadInOut;

		this.elapsed = 0;
		this.duration = 0;
		this.state = ENDED;
	}

	set(val) {
		this.fromV = val;
		this.currentV = val;
		this.toV = val;

		this.elapsed = 0;
		this.duration = 0;
		this.state = START;
	}

	to(val, dur = null) {
		this.fromV = this.currentV;
		this.toV = val;

		if (this.state === RUNNING)
			this.easing = quadOut;
		else
			this.easing = quadInOut;

		this.elapsed = 0;
		this.duration = dur ?? 500;
		this.state = START;
	}

	_tick(change) {
		if (this.state >= ENDING)
			return this.state = ENDED;

		this.elapsed += change;

		const dur = Math.max(this.duration, 1);
		const t = Math.min(this.elapsed / dur, 1);
		if (t >= 1)
			this.state = ENDED;
		else
			this.state = RUNNING;

		const et = this.easing(t);

		if (this.type === 'num') {
			const dif = this.toV - this.fromV;
			this.currentV = this.fromV + dif * et;
		} else if (this.type === 'hex') {
			if (!Array.isArray(this.fromV))
				this.fromV = hexToRgb(this.fromV);
			if (!Array.isArray(this.toV))
				this.toV = hexToRgb(this.toV);

			// now animate
			this.currentV = this.fromV.map((from, i) => {
				return from + (this.toV[i] - from) * et;
			});
		}
	}

	_toTransformValue() {
		let v = this.currentV;
		if (this.name === 'translateY')
			v += 'px';

		return `${this.name}(${v})`;
	}

	_toCssValue() {
		if (this.type === 'hex')
			return `rgba(${this.currentV.map(v => Math.round(v)).join()}, 1)`;
		throw new Error('to css value');
	}
}


function hexToRgb(val) {
	if (!val.startsWith('#') || val.length !== 7)
		throw new Error('expected a hex value with 6 characters');

	const hex = val.substring(1);

	const values = range(0, 3)
		.map(i => parseInt(hex.substring(i * 2, i * 2 + 2), 16));

	return values;
}

// function rgbToHex(rgb) {
// 	return 
// }
