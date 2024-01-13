import Value from './value.js';

const DEBUG_SET_GET = false;

export default class Target {
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

	getStyleValue(name) {
		return this.getValue(name);
	}

	setStyleValue(name, value) {
		return this.setValue(name, value);
	}

	removeStyleValue(name) {
		return this.removeValue(name);
	}

	apply() {}
}

export class DomTarget extends Target {
	/**
	 * target a dom node or svg
	 * 
	 * extFns: {getComputedStyle}
	 */
	constructor(target, extFns) {
		super(target);

		this._extFns = extFns;

		// for the moment 

		this.transformValues = new Map;
		this.styleValues = new Map;
		this.values = new Map;
	}

	type() {
		return 'dom';
	}

	getValue(name) {
		if (DEBUG_SET_GET)
			console.log('get', name);

		return this.values.get(name);
	}

	setValue(name, value) {
		if (DEBUG_SET_GET)
			console.log('set', name, value);

		this.values.set(name, value);
	}

	removeValue(name) {
		this.values.delete(name);
	}

	getTransformValue(name) {
		if (DEBUG_SET_GET)
			console.log('get', name);

		return this.transformValues.get(name);
	}

	setTransformValue(name, value) {
		if (DEBUG_SET_GET)
			console.log('set', name, value);

		this.transformValues.set(name, value);
	}

	removeTransformValue(name) {
		this.transformValues.delete(name);
	}

	getStyleValue(name) {
		if (DEBUG_SET_GET)
			console.log('get', name);

		const v = this.styleValues.get(name);

		if (typeof v === 'undefined' || v === null) {
			// let's try to get it from the dom
			const style = this._extFns.getComputedStyle(this.target);
			const styleV = style[name];

			if (typeof styleV === 'undefined' || styleV === null)
				return styleV;

			try {
				const value = Value.parse(styleV);
				this.styleValues.set(name, value);

				return value;
			} catch (e) {
				console.log('could not parse value', styleV);
				return v;
			}
		} else
			return v;
	}

	setStyleValue(name, value) {
		if (DEBUG_SET_GET)
			console.log('set', name, value);

		this.styleValues.set(name, value);
	}

	removeStyleValue(name) {
		this.styleValues.set(name, undefined);
	}

	apply() {
		this.target.style.transform = Array.from(this.transformValues.entries())
			.map(([k, v]) => `${k}(${v})`)
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

export function newTarget(target) {
	if (typeof window === 'undefined') {
		if (typeof target.__simulatedDom__ === 'function')
			return new DomTarget(target, {
				getComputedStyle: target.__getComputedStyle__()
			});
	} else {
		if (target instanceof HTMLElement || target instanceof SVGElement)
			return new DomTarget(target, { getComputedStyle });
	}

	throw new Error('unknown target');
}