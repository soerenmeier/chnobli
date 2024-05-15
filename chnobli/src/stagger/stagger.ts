/**
 * Staggering allows to have a different value for every target
 * allowing to easely offset each target by a few pixels
 */

function isStagger<O>(value: any): value is Stagger<O> {
	const v = value as any;

	return (
		typeof v === 'object' &&
		v !== null &&
		typeof v.__isStagger__ === 'function'
	);
}

export function callStagger<O>(
	value: O | Stagger<O>,
	i: number,
	length?: number,
): O {
	if (isStagger(value)) return value.call(i, length);

	return value;
}

export function staggerMap<O, NO>(
	value: O | Stagger<O>,
	fn: (val: O) => NO,
): NO | Stagger<NO> {
	if (isStagger(value)) {
		return new Stagger((i: number, length?: number) =>
			fn(value.call(i, length)),
		);
	}

	return fn(value);
}

export type StaggerValue<O> = (i: number, length?: number) => O;

export default class Stagger<O> {
	private fn: StaggerValue<O>;

	/**
	 * @ignore
	 */
	constructor(value: StaggerValue<O>) {
		if (typeof value === 'function') {
			this.fn = value;
			return;
		}

		// if (value === )
		throw new Error('unknown stagger value ' + value);
	}

	call(i: number, length?: number): O {
		return this.fn(i, length);
	}

	/**
	 * @ignore
	 */
	__isStagger__() {}
}
