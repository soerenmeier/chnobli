export default class Ease {
	fn: ((t: number) => number) | null;

	constructor(prop: any) {
		// parse prop
		if (prop !== null && typeof prop !== 'function')
			throw new Error('ease needs to be a function');

		this.fn = prop;
	}

	apply(t: number) {
		if (this.fn === null) return t;

		return this.fn(t);
	}
}
