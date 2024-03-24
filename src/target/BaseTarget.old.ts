import Value from '../values/Value';
import StyleValue from '../values/StyleValue';

export default class BaseTarget<T> {
	target: T;

	constructor(target: T) {
		this.target = target;

		// this might be an object, a dom node
		// what about arrays?
	}

	type() {
		return 'unknown';
	}

	getValue(name: string): Value | null {
		throw new Error('cannot get value of ' + name);
	}

	setValue(name: string, _value: Value) {
		throw new Error('cannot set value of ' + name);
	}

	removeValue(name: string) {
		throw new Error('cannot remove value of ' + name);
	}

	getTransformValue(name: string): Value | null {
		return this.getValue(name);
	}

	setTransformValue(name: string, value: Value) {
		return this.setValue(name, value);
	}

	removeTransformValue(name: string) {
		return this.removeValue(name);
	}

	/**
	 * returns nothing or a style value
	 */
	getStyleValue(name: string): StyleValue | null {
		const val = this.getValue(name);
		if (!val) return val;
		return new StyleValue([val]);
	}

	/**
	 * Expects a style value
	 */
	setStyleValue(name: string, value: StyleValue) {
		return this.setValue(name, value.intoValue());
	}

	removeStyleValue(name: string) {
		return this.removeValue(name);
	}

	hasClass(name: string): boolean {
		throw new Error('cannot know if class exists ' + name);
	}

	addClass(name: string) {
		throw new Error('cannot add class ' + name);
	}

	removeClass(name: string) {
		throw new Error('cannot remove class ' + name);
	}

	/**
	 * Tries to unify both values so their units match
	 *
	 * a and b need to be a Value
	 */
	unifyValues(name: string, a: Value, b: Value): [Value, Value] {
		if (!a.unit && b.unit) a.unit = b.unit;

		if (!b.unit && a.unit) b.unit = a.unit;

		if (a.unit !== b.unit)
			throw new Error(`${name} cannot unify ${a.unit} and ${b.unit}`);

		return [a, b];
	}

	apply() {}
}
