import Value from './value.js';
import ColorValue from './colorvalue.js';

const AT_THE_END_VALUES = ['none', 'hidden'];

/**
 * A value from a style property
 * 
 * might be a textual representation like none|auto|block|var(--abc)
 * might be a value with unit or not
 * might be multiple values `10 20px 4rem`
 * 
 * values like hidden|none|null|undefined are market as at the end
 * which means they should be set at the end
 */
export default class StyleValue {
	/**
	 * Creates a style value
	 *
	 * ## value must be one of the following
	 * - string (meaning this is of kind text)
	 * - number (meaning this is of kind values with one value)
	 * - array (meaning this is of kind values and each array element needs to
	 * be a Value)
	 * - ColorValue
	 */
	constructor(value) {
		if (typeof value === 'string') {
			this.kind = 'text';
			value = value.trim();
		} else if (typeof value === 'number') {
			this.kind = 'values';
			value = [Value.parse(value)];
		} else if (Array.isArray(value)) {
			this.kind = 'values';
		} else if (value instanceof ColorValue) {
			this.kind = 'color';
		} else {
			throw new Error('unknown style value ' + value);
		}

		this.values = value;

		/**
		 * If this is true the value should be set at the end of a animation
		 * this only works with kind === text
		 */
		this.textAtTheEnd = this.kind === 'text'
			? AT_THE_END_VALUES.includes(this.values)
			: false;
	}


	static parse(v) {
		if (typeof v === 'number')
			return new StyleValue(v);

		if (Array.isArray(v)) {
			const val = v.map(v => Value.parse(v));
			return new StyleValue(val);
		}

		if (typeof v !== 'string')
			throw new Error('expected a string as style value ' + v);

		// let's first try to make it a color
		if (ColorValue.mightBeAColor(v))
			return new StyleValue(ColorValue.parse(v));

		const split = v.split(' ').map(v => v.trim()).filter(v => !!v);
		if (split.length === 0)
			throw new Error('style value cannot be empty');

		if (split.length === 1) {
			try {
				const val = Value.parse(split[0]);
				return new StyleValue([val]);
			} catch (e) {
				// console.log('failed to parse first style value ', e);
				return new StyleValue(split[0]);
			}
		}

		return new StyleValue(split.map(v => Value.parse(v)));
	}

	/// only works if the kind is values
	get length() {
		if (this.kind !== 'values')
			throw new Error('only works with kind values');

		return this.values.length;
	}

	extendToLength(length) {
		if (this.length >= length)
			return;

		this.values = Array(length).fill(this.values).flat();
	}

	/**
	 * Throws if the this does not contain exactly one value
	 */
	intoValue() {
		if (this.length !== 1)
			throw new Error('style value does not contain only one value');

		return this.values[0];
	}

	clone() {
		if (this.kind === 'text')
			return new StyleValue(this.values);

		if (this.kind === 'color')
			return new StyleValue(this.values.clone());

		return new StyleValue(this.values.map(v => v.clone()));
	}

	/// if this is called with a text value nothing happens
	withDefaultUnit(unit) {
		if (this.kind === 'text')
			return new StyleValue(this.values);

		if (this.kind === 'color')
			return new StyleValue(this.values.clone());

		return new StyleValue(this.values.map(v => v.withDefaultUnit(unit)));
	}

	toString() {
		switch (this.kind) {
			case 'text':
				return this.values;

			case 'color':
				return this.values.toString();

			case 'values':
				return this.values.join(' ');

			default:
				throw new Error('unknown kind ' + this.kind);
		}
	}
}