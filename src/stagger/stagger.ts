/**
 * Staggering allows to have a different value for every target
 * allowing to easely offset each target by a few pixels
 */

function isStagger(value: any) {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof value.__isStagger__ === 'function'
	);
}

export function callStagger(value: any, i: number, l: any = null) {
	if (isStagger(value)) return value.call(i, l);

	return value;
}

export function staggerMap(value: any, fn: (v: any) => any) {
	if (isStagger(value))
		return new Stagger((...args: any[]) => fn(value.call(...args)));

	return fn(value);
}

export default class Stagger {
	private fn: (...args: any[]) => any;

	constructor(value: any) {
		if (typeof value === 'function') {
			this.fn = value;
			return;
		}

		// if (value === )
		throw new Error('unknown stagger value ' + value);
	}

	call(...args: any[]) {
		return this.fn(...args);
	}

	__isStagger__() {}
}
