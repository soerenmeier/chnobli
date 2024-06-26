import Value from '../values/Value.js';
import StyleValue from '../values/StyleValue.js';
import { Target } from './Target.js';

export type Element = HTMLElement | SVGElement;

export type ExternalFunctions = {
	getComputedStyle: (el: Element) => CSSStyleDeclaration;
	getRootElement: () => Element;
};

export default class DomTarget implements Target {
	private target: Element;

	private _extFns: ExternalFunctions;

	private transformValues: Map<string, (Value | null)[]>;
	private styleValues: Map<string, StyleValue | undefined>;
	private values: Map<string, Value>;

	/**
	 * target a dom node or svg
	 *
	 * extFns: {getComputedStyle, getRootElement}
	 */
	constructor(target: Element, extFns: ExternalFunctions) {
		this.target = target;
		this._extFns = extFns;

		// for the moment

		this.transformValues = new Map();
		this.styleValues = new Map();
		this.values = new Map();
	}

	inner() {
		return this.target;
	}

	type() {
		return 'dom';
	}

	getValue(name: string): Value | null {
		return this.values.get(name) ?? null;
	}

	setValue(name: string, value: Value) {
		this.values.set(name, value);
	}

	removeValue(name: string) {
		this.values.delete(name);
	}

	getTransformValue(name: string): Value | null {
		const [fn, idx] = TRANSFORM_PROPS[name] ?? [];
		if (!fn) return null;

		const r = this.transformValues.get(fn);
		return r?.[idx ?? 0] ?? null;
	}

	setTransformValue(name: string, value: Value) {
		const [fn, idx] = TRANSFORM_PROPS[name] ?? [];
		if (!fn) throw new Error('unknown transform ' + name);

		let vals = this.transformValues.get(fn);
		if (!vals) vals = Array(TRANSFORM_FUNCTIONS[fn].length).fill(null);

		if (idx === null) vals = vals.map(() => value.clone());
		else vals[idx] = value;

		this.transformValues.set(fn, vals);
	}

	removeTransformValue(name: string) {
		const [fn, idx] = TRANSFORM_PROPS[name] ?? [];
		if (!fn) return;

		if (idx === null) {
			this.transformValues.delete(fn);
			return;
		}

		const vals = this.transformValues.get(fn);
		if (!vals) return;

		vals[idx] = null;

		if (vals.every(v => v === null)) this.transformValues.delete(fn);
	}

	getStyleValue(name: string): StyleValue | null {
		const v = this.styleValues.get(name) ?? null;

		if (v !== null) return v;

		// let's try to get it from the dom
		const style = this._extFns.getComputedStyle(this.target);
		const styleV = style.getPropertyValue(name);

		if (typeof styleV === 'undefined' || styleV === null) {
			return styleV;
		}

		try {
			const value = StyleValue.parse(styleV);
			this.styleValues.set(name, value);

			return value;
		} catch (e) {
			console.log('could not parse value', styleV);
			return v;
		}
	}

	setStyleValue(name: string, value: StyleValue) {
		this.styleValues.set(name, value);
	}

	removeStyleValue(name: string) {
		this.styleValues.set(name, undefined);
	}

	hasClass(name: string): boolean {
		return this.target.classList.contains(name);
	}

	addClass(name: string) {
		return this.target.classList.add(name);
	}

	removeClass(name: string) {
		return this.target.classList.remove(name);
	}

	private _getRem(): number {
		const rootEl = this._extFns.getRootElement();
		const style = this._extFns.getComputedStyle(rootEl);
		const fontSize = Value.parse(style.fontSize);
		if (fontSize.unit !== 'px')
			throw new Error('rem could not be determined');

		return fontSize.num;
	}

	private _convertToPx(name: string, value: Value) {
		if (value.num === 0) return new Value(0, 'px');

		switch (value.unit) {
			case 'px':
				return value;
			case 'rem':
				return new Value(value.num * this._getRem(), 'px');
			default:
				throw new Error(
					`cannot convert ${name} from ${value.unit} to px`,
				);
		}
	}

	// value needs to be a unit with pixels
	private _convertFromPx(name: string, value: Value, unit: string) {
		if (value.num === 0) return new Value(0, unit);

		let v;
		switch (unit) {
			case 'px':
				return value;

			case 'rem':
				return new Value(value.num / this._getRem(), 'rem');

			case '%':
				v = this.getStyleValue(name)?.intoValue();
				if (!v || v.unit !== 'px')
					throw new Error('cannot get style value of ' + name);

				return new Value((value.num / v.num) * 100, '%');

			default:
				throw new Error(`cannot convert ${name} from px to ${unit}`);
		}
	}

	unifyValues(name: string, a: Value, b: Value): [Value, Value] {
		if (a.unit === b.unit) return [a, b];

		if (!a.unit && b.unit) a.unit = b.unit;

		if (!b.unit && a.unit) b.unit = a.unit;

		const aPx = this._convertToPx(name, a);
		const aBUnit = this._convertFromPx(name, aPx, b.unit!);

		return [aBUnit, b];
	}

	apply() {
		this.target.style.transform = Array.from(this.transformValues.entries())
			.map(([k, vals]) => {
				// since we allow null in default Values we now need to make
				// sure either a value or a default value are set for the
				// transform function

				const defVals = TRANSFORM_FUNCTIONS[k];
				if (vals.length !== defVals.length)
					throw new Error("transform values don't match");

				const nArray = Array(vals.length);

				for (let i = 0; i < vals.length; i++) {
					let val = vals[i];

					if (val === null) val = new Value(defVals[i][0]);

					nArray[i] = val.withDefaultUnit(defVals[i][1]);
				}

				return `${k}(${nArray.join(',')})`;
			})
			.join(' ');

		// style
		for (const [k, v] of this.styleValues.entries()) {
			if (v === undefined) {
				this.target.style.removeProperty(k);
				// is this a problem?
				this.styleValues.delete(k);
			} else {
				this.target.style.setProperty(k, v.toString());
			}
		}

		// values
		for (const [k, _v] of this.values.entries()) {
			console.log('what todo with this ' + k);
		}
	}
}

const TRANSFORM_PROPS: Record<string, [string, number | null]> = {
	x: ['translate3d', 0],
	y: ['translate3d', 1],
	z: ['translate3d', 2],
	scale: ['scale3d', null],
	scaleX: ['scale3d', 0],
	scaleY: ['scale3d', 1],
	scaleZ: ['scale3d', 2],
	rotate: ['rotate3d', null],
	rotateX: ['rotate3d', 0],
	rotateY: ['rotate3d', 1],
	rotateZ: ['rotate3d', 2],
	skew: ['skew', 0],
	skewX: ['skew', 0],
	skewY: ['skew', 1],
};

const TRANSFORM_FUNCTIONS: Record<string, [number, string | null][]> = {
	translate3d: [
		[0, 'px'],
		[0, 'px'],
		[0, 'px'],
	],
	scale3d: [
		[1, null],
		[1, null],
		[1, null],
	],
	rotate3d: [
		[0, 'deg'],
		[0, 'deg'],
		[0, 'deg'],
	],
	skew: [
		[0, 'deg'],
		[0, 'deg'],
	],
};
