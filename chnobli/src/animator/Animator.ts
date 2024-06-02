import Property, { newProperty } from '../property/Property.js';
import { Target } from '../target/Target.js';
import Ticker from '../timing/Ticker.js';
import Timing, { STATE_AFTER } from '../timing/Timing.js';

export type Settings = {
	duration: number;
	ease?: (t: number) => number;
};

/*

const opacity = animator(obj, {
	duration: 200,
	ease: sinInOut
});

opacity.set({ opacity: 0 });

opacity.to({ opacity: 1 });
opacity.to({ opacity: 2 }, 1000);
*/

export default class Animator {
	setts: Settings;
	target: Target;
	private props: Map<string, PropertyAnimator<any>>;

	private ticker: Ticker;

	constructor(target: any, ticker: Ticker, setts: Settings) {
		this.setts = setts;
		this.target = ticker.registerTarget(target);

		this.ticker = ticker;

		this.props = new Map();
	}

	private getProp(name: string): PropertyAnimator<any> {
		const prop = this.props.get(name);
		if (prop) return prop;

		const newProp = new PropertyAnimator(name, this.setts, this.target);
		this.props.set(name, newProp);
		return newProp;
	}

	set(props: Record<string, any>) {
		for (const prop in props) {
			const propAni = this.getProp(prop);
			console.log('got prop ani', propAni);
			propAni.set(this.target, props[prop]);
			console.log('got prop ani', propAni);
		}
	}

	to(props: Record<string, any>, duration?: number) {
		for (const prop in props) {
			const propAni = this.getProp(prop);
			propAni.to(this.target, props[prop], duration);
		}
	}

	/// returns if the ticker should keep running
	_tick(change: number): boolean {
		let shouldStop = true;

		for (const prop of this.props.values()) {
			prop.advance(change);
			prop.render(this.target);

			if (prop.timing.state < STATE_AFTER) {
				shouldStop = false;
			}
		}

		return !shouldStop;
	}
}

export class PropertyAnimator<V> {
	prop: Property<V>;
	timing: Timing;

	private initialized: boolean;

	constructor(prop: string, setts: Settings, target: Target) {
		this.prop = newProperty(prop, target.type());

		this.timing = new Timing(setts);
		this.initialized = false;
	}

	set(target: Target, value: any) {
		const val = this.prop.parseValue(value);

		this.prop.init(target, val, val);

		this.timing.seek(2);
	}

	to(target: Target, value: any, duration?: number) {
		const val = this.prop.parseValue(value);

		let current = null;
		if (this.initialized) {
			current = this.prop.interpolate(this.timing.position);
		}

		this.prop.init(target, current, val);
		this.initialized = true;

		this.timing.seek(0);
		if (typeof duration === 'number') {
			this.timing.setDuration(duration);
		}
	}

	advance(change: number) {
		this.timing.advance(change);
	}

	// call advance first
	render(target: Target) {
		const pos = this.timing.position;

		this.prop.setValue(target, this.prop.interpolate(pos));
	}
}
