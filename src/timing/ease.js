export default class Ease {
	constructor(prop) {
		// parse prop
		if (prop !== null && typeof prop !== 'function')
			throw new Error('ease needs to be a function');

		this.fn = prop;
	}

	apply(t) {
		if (this.fn === null)
			return t;

		return this.fn(t);
	}
}