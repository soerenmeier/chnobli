/**
 * Staggering allows to have a different value for every target
 * allowing to easely offset each target by a few pixels
 */

function isStagger(value) {
	return typeof value === 'object' &&
		value !== null &&
		typeof value.__isStagger__ === 'function';
}

export function callStagger(value, i, l) {
	if (isStagger(value))
		return value.call(i, l);

	return value;
}

export function staggerMap(value, fn) {
	if (isStagger(value))
		return new Stagger((...args) => fn(value.call(...args)));

	return fn(value);
}

export default class Stagger {
	constructor(value) {
		if (typeof value === 'function') {
			this.fn = value;
			return;
		}

		// if (value === )
		throw new Error('unknown stagger value ' + value);
	}

	call(...args) {
		return this.fn(...args);
	}

	__isStagger__() {}
}