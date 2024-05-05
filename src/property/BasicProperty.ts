import Value from '../values/Value.js';
import Property, { ParseableValue } from './Property.js';
import { Target } from '../target/Target.js';

export default class BasicProperty implements Property<Value> {
	/**
	 * The name of the property
	 */
	name: string;

	/**
	 * The value at the start
	 */
	from: Value | null;

	/**
	 * The value at the end
	 */
	to: Value | null;

	constructor(name: string) {
		// this is the property name
		this.name = name;

		this.from = null;
		this.to = null;
	}

	allowsValueFn() {
		return true;
	}

	/**
	 * From or to might be null
	 */
	init(target: Target, from: Value | null, to: Value | null) {
		if (!from) from = this.getValue(target);

		if (!to) to = this.getValue(target);

		if (!from || !to)
			throw new Error('could not determine from or to value');

		const [nFrom, nTo] = target.unifyValues(this.name, from, to);

		this.from = nFrom;
		this.to = nTo;
	}

	/**
	 * Gets called with the value of a property
	 *
	 * For examply during initializiation
	 */
	parseValue(val: ParseableValue): Value {
		if (typeof val !== 'string')
			throw new Error('only strings are supported');

		return Value.parse(val);
	}

	defaultValue(): Value {
		throw new Error('default value for ' + this.name + ' not known');
	}

	// try to access the value from the target
	getValue(target: Target): Value {
		const val = target.getValue(this.name);
		if (typeof val === 'undefined' || val === null)
			return this.defaultValue();

		return val;
	}

	/**
	 * Pos needs to be between 0 and 1
	 */
	interpolate(pos: number): Value {
		const dif = this.to!.num - this.from!.num;

		return this.from!.cloneAdd(pos * dif);
	}

	setValue(target: Target, val: Value) {
		return target.setValue(this.name, val);
	}

	removeValue(target: Target) {
		return target.removeValue(this.name);
	}
}
