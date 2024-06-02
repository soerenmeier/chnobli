const REGEX = /^(-?\d+\.?\d*|\.\d+)(\w*|%)$/;

export default class Value {
	num: number;
	unit: string | null;

	constructor(num: number, unit: string | null = null) {
		this.num = num;
		this.unit = unit;
	}

	static parse(v: string | number) {
		if (typeof v === 'number') {
			return new Value(v);
		}

		// @ts-ignore
		const [_v, num, unit] = REGEX.exec(v);

		return new Value(parseFloat(num), unit ? unit : null);
	}

	eq(other: Value) {
		return this.unit === other.unit && this.num === other.num;
	}

	clone(newNum: number | null = null) {
		if (newNum !== null) return new Value(newNum, this.unit);

		return new Value(this.num, this.unit);
	}

	cloneAdd(add: number) {
		return new Value(this.num + add, this.unit);
	}

	cloneMul(mul: number) {
		return new Value(this.num * mul, this.unit);
	}

	withDefaultUnit(unit: string | null) {
		return new Value(this.num, this.unit ?? unit);
	}

	toString() {
		return this.num.toFixed(3) + (this.unit ?? '');
	}
}
