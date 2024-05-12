import StyleValue from '../values/StyleValue.js';
import Value from '../values/Value.js';
import { Target } from './Target.js';

export default class ObjectTarget implements Target {
	private target: Record<string, any>;

	// private _extFns: ExternalFunctions;

	// private transformValues: Map<string, (Value | null)[]>;
	private styleValues: Map<string, StyleValue | undefined>;
	// private values: Map<string, Value>;

	/**
	 * target a dom node or svg
	 *
	 * extFns: {getComputedStyle, getRootElement}
	 */
	constructor(target: Record<string, any>) {
		this.target = target;

		this.styleValues = new Map();
		// this.values = new Map();
	}

	inner() {
		return this.target;
	}

	type() {
		return 'object';
	}

	getValue(name: string): Value | null {
		// return this.values.get(name) ?? null;
		throw new Error('not supported');
	}

	setValue(name: string, value: Value) {
		// this.values.set(name, value);
		throw new Error('not supported');
	}

	removeValue(name: string) {
		// this.values.delete(name);
		throw new Error('not supported');
	}

	getTransformValue(name: string): Value | null {
		throw new Error('not supported');
	}

	setTransformValue(name: string, value: Value) {
		throw new Error('not supported');
	}

	removeTransformValue(name: string) {
		throw new Error('not supported');
	}

	getStyleValue(name: string): StyleValue | null {
		const v = this.styleValues.get(name) ?? null;

		if (v !== null) return v;

		const styleV = this.target[name];
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

	setStyleValue(name: string, value: StyleValue): void {
		this.styleValues.set(name, value);
	}

	removeStyleValue(name: string): void {
		this.styleValues.set(name, undefined);
	}

	hasClass(name: string): boolean {
		throw new Error('not supported');
	}

	addClass(name: string): void {
		throw new Error('not supported');
	}

	removeClass(name: string): void {
		throw new Error('not supported');
	}

	unifyValues(name: string, a: Value, b: Value): [Value, Value] {
		if (a.unit === b.unit) return [a, b];

		if (!a.unit && b.unit) a.unit = b.unit;

		if (!b.unit && a.unit) b.unit = a.unit;

		return [a, b];
	}

	apply() {
		// style
		for (const [k, v] of this.styleValues.entries()) {
			if (v === undefined) {
				console.log('delete', k);
				delete this.target[k];
				this.styleValues.delete(k);
			} else {
				this.target[k] = v.toMixed();
			}
		}
	}
}
