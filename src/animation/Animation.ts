import Timing, { newTiming, STATE_BEFORE, STATE_AFTER } from '../timing/Timing';

import Property, { ParseableValue, newProperty } from '../property/Property';
import Ticker from '../timing/Ticker';
import { Target } from '../target/Target';

export default class Animation {
	timing: Timing;
	target: Target;
	props: Record<string, PropertyAnimation<any>>;

	private _ticker: Ticker;

	private _prevTimingState: number;
	private _props: PropertyAnimation<any>[];
	private _initialized: boolean;

	/*
	props
	*/
	constructor(target: any, ticker: Ticker, props: Record<string, any> = {}) {
		this.timing = newTiming(props);
		this._ticker = ticker;
		this.target = ticker.registerTarget(target);

		this._prevTimingState = this.timing.state;
		this._props = [];
		this._initialized = false;

		this.props = {};

		for (const prop in props) {
			this.props[prop] = new PropertyAnimation(prop, props[prop], this);
			this._props.push(this.props[prop]);
		}
	}

	advance(change: number) {
		this._prevTimingState = this.timing.state;
		this.timing.advance(change);
	}

	seekMs(ms: number) {
		this._prevTimingState = this.timing.state;
		this.timing.seekMs(ms);
	}

	seek(pos: number) {
		this._prevTimingState = this.timing.state;
		this.timing.seek(pos);
	}

	isFinite(): boolean {
		return this.timing.isFinite();
	}

	get duration(): number {
		return this.timing.duration;
	}

	init(reset = false) {
		if (this._initialized && !reset) return;
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

	destroy() {
		for (const prop of this._props) {
			prop.restoreBefore(this.target);
		}

		this._ticker.unregisterTarget(this.target.inner());
	}
}

function maybeResponsiveValue<V>(prop: Property<V>, val: any): V {
	if (typeof val === 'object' && 'responsive' in val) return val.responsive;
	return prop.parseValue(val);
}

class PropertyAnimation<V> {
	prop: Property<V>;

	private staticValueFn: boolean;
	private valueFn: ((pos: number) => ParseableValue) | null;

	private iniResponsive: any;
	private iniFrom: V | null;
	private iniTo: V | null;

	constructor(prop: string, value: any, animation: Animation) {
		this.prop = newProperty(prop, animation.target.type());
		// we will get the from the targets

		this.staticValueFn = false;
		this.valueFn = null;

		this.iniResponsive = null;
		this.iniFrom = null;
		this.iniTo = null;

		if (typeof value === 'object') {
			if ('from' in value)
				this.iniFrom = maybeResponsiveValue(this.prop, value.from);
			if ('to' in value)
				this.iniTo = maybeResponsiveValue(this.prop, value.to);

			if ('responsive' in value) this.iniResponsive = value.responsive;

			if (!this.iniFrom && !this.iniTo && !this.iniResponsive)
				throw new Error('from or to expected');
		} else if (typeof value === 'function') {
			if (!this.prop.allowsValueFn()) {
				throw new Error(
					'prop ' + prop + ' does not allow value functions',
				);
			}

			this.staticValueFn = true;
			this.valueFn = value;
		} else {
			this.iniTo = this.prop.parseValue(value);
		}
	}

	// calculate from and to position
	init(target: Target) {
		// there is nothing to initialize since on every render we call the
		// value Fn
		if (this.staticValueFn) return;

		this.valueFn = null;
		let from = null;
		let to = null;

		// init via responsive fn
		if (this.iniResponsive) {
			// todo this access to target can't be
			const value = this.iniResponsive((target as any).target);

			if (typeof value === 'object') {
				if ('from' in value) from = this.prop.parseValue(value.from);
				if ('to' in value) to = this.prop.parseValue(value.to);

				if (!from && !to) throw new Error('from or to expected');
			} else if (typeof value === 'function') {
				if (!this.prop.allowsValueFn()) {
					throw new Error(
						`prop ${this.prop.name} does not allow value functions`,
					);
				}

				this.valueFn = value;
				return;
			} else {
				to = this.prop.parseValue(value);
			}
		}

		// init from
		if (!from) {
			if (typeof this.iniFrom === 'function')
				from = this.prop.parseValue(this.iniFrom(target.inner()));
			else from = this.iniFrom;
		}

		// init to
		if (!to) {
			if (typeof this.iniTo === 'function')
				to = this.prop.parseValue(this.iniTo(target.inner()));
			else to = this.iniTo;
		}

		this.prop.init(target, from, to);
	}

	restoreBefore(target: Target) {
		// todo this might not be enough
		this.prop.removeValue(target);
	}

	render(pos: number, target: Target) {
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
