const VALID_TWO_UNITS = ['px', 'vw', 'vh', 'rem', 'em'];
const VALID_THREE_UNITS = ['rem'];

export default class Value {
	constructor(num, unit = null) {
		this.num = num;
		this.unit = unit;
	}

	static parse(v, defUnit = null) {
		if (typeof v === 'number') {
			return new Value(v, defUnit);
		}

		if (v.length < 2)
			throw new Error('value needs to be at least two chars long');

		const lastOne = v.substring(v.length - 1);
		if (lastOne === '%')
			return new Value(parseInt(v), lastOne);

		const lastTwo = v.substring(v.length - 2);
		if (VALID_TWO_UNITS.includes(lastTwo))
			return new Value(parseInt(v), lastTwo);

		const lastThree = v.substring(v.length - 3);
		if (lastThree === 'rem')
			return new Value(parseInt(v), lastThree);

		throw new Error('unknown value: ' + v);
	}

	clone(newNum = null) {
		if (newNum !== null)
			return new Value(newNum, this.unit);
		
		return new Value(this.num, this.unit);
	}

	cloneAdd(add) {
		return new Value(this.num + add, this.unit);
	}

	toString() {
		return this.num.toFixed(3) + (this.unit ?? '');
	}
}