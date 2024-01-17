import StyleValue from '../values/stylevalue.js';


export default class BaseTarget {
	constructor(target) {
		this.target = target;

		// this might be an object, a dom node
		// what about arrays?
	}

	type() {
		return 'unknown';
	}

	getValue(name) {
		throw new Error('cannot get value of ' + name);
	}

	setValue(name, _value) {
		throw new Error('cannot set value of ' + name);
	}

	removeValue(name) {
		throw new Error('cannot remove value of ' + name);
	}

	getTransformValue(name) {
		return this.getValue(name);
	}

	setTransformValue(name, value) {
		return this.setValue(name, value);
	}

	removeTransformValue(name) {
		return this.removeValue(name);
	}

	/**
	 * returns nothing or a style value
	 */
	getStyleValue(name) {
		const val = this.getValue(name);
		if (!val)
			return val;
		return StyleValue([val]);
	}

	/**
	 * Expects a style value
	 */
	setStyleValue(name, value) {
		return this.setValue(name, value);
	}

	removeStyleValue(name) {
		return this.removeValue(name);
	}

	hasClass(name) {
		throw new Error('cannot know if class exists ' + name);
	}

	addClass(name) {
		throw new Error('cannot add class ' + name);
	}

	removeClass(name) {
		throw new Error('cannot remove class ' + name);
	}

	/**
	 * Tries to unify both values so their units match
	 * 
	 * a and b need to be a Value
	 */
	unifyValues(name, a, b) {
		if (!a.unit && b.unit)
			a.unit = b.unit;

		if (!b.unit && a.unit)
			b.unit = a.unit;

		if (a.unit !== b.unit)
			throw new Error(`${name} cannot unify ${a.unit} and ${b.unit}`);

		return [a, b];
	}

	apply() {}
}