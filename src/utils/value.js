const UNITS = ['px', 'vw', 'vh', 'rem', 'em', 'rem', 'deg', 'rad'];

const REGEX = /^(\d*\.?\d*)(\w*)$/;

export default class Value {
	constructor(num, unit = null) {
		this.num = num;
		this.unit = unit;
	}

	static parse(v, defUnit = null) {
		if (typeof v === 'number') {
			return new Value(v, defUnit);
		}

		const [_v, num, unit] = REGEX.exec(v);

		if (unit && !UNITS.includes(unit))
			throw new Error('unknown unit ' + unit);

		return new Value(parseFloat(num), unit ? unit : null);
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