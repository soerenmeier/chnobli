import Value from './Value.js';
import ColorValue from './ColorValue.js';

const AT_THE_END_VALUES = ['none', 'hidden'];

type InnerText = {
	kind: 'text';
	values: string;
};

type InnerValues = {
	kind: 'values';
	values: Value[];
};

type InnerColor = {
	kind: 'color';
	values: ColorValue;
};

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
	private inner: InnerText | InnerValues | InnerColor;
	private textAtTheEnd: boolean;

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
	constructor(value: string | number | Value[] | ColorValue) {
		if (typeof value === 'string') {
			this.inner = {
				kind: 'text',
				values: value.trim(),
			};
		} else if (typeof value === 'number') {
			this.inner = {
				kind: 'values',
				values: [Value.parse(value)],
			};
		} else if (Array.isArray(value)) {
			this.inner = {
				kind: 'values',
				values: value,
			};
		} else if (value instanceof ColorValue) {
			this.inner = {
				kind: 'color',
				values: value,
			};
		} else {
			throw new Error('unknown style value ' + value);
		}

		/**
		 * If this is true the value should be set at the end of a animation
		 * this only works with kind === text
		 */
		this.textAtTheEnd =
			this.inner.kind === 'text'
				? AT_THE_END_VALUES.includes(this.inner.values)
				: false;
	}

	static parse(v: string | number | (string | number)[]) {
		if (typeof v === 'number') return new StyleValue(v);

		if (Array.isArray(v)) {
			const val = v.map(v => Value.parse(v));
			return new StyleValue(val);
		}

		if (typeof v !== 'string')
			throw new Error('expected a string as style value ' + v);

		// let's first try to make it a color
		if (ColorValue.mightBeAColor(v))
			return new StyleValue(ColorValue.parse(v));

		const split = v
			.split(' ')
			.map(v => v.trim())
			.filter(v => !!v);
		if (split.length === 0) throw new Error('style value cannot be empty');

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

	get kind(): 'text' | 'values' | 'color' {
		return this.inner.kind;
	}

	get values(): string | Value[] | ColorValue {
		return this.inner.values;
	}

	/// only works if the kind is values
	get length() {
		if (this.inner.kind !== 'values')
			throw new Error('only works with kind values');

		return this.inner.values.length;
	}

	extendToLength(length: number) {
		if (this.length >= length) return;

		// length already checks that kind is values
		this.inner.values = Array(length).fill(this.values).flat();
	}

	/**
	 * Throws if the this does not contain exactly one value
	 */
	intoValue(): Value {
		if (this.length !== 1)
			throw new Error('style value does not contain only one value');

		// length already checks that kind is values
		return (this.inner.values as Value[])[0];
	}

	clone() {
		if (this.inner.kind === 'text')
			return new StyleValue(this.inner.values);

		if (this.inner.kind === 'color')
			return new StyleValue(this.inner.values.clone());

		return new StyleValue(this.inner.values.map(v => v.clone()));
	}

	/// if this is called with a text value nothing happens
	withDefaultUnit(unit: string | null) {
		if (this.inner.kind === 'text')
			return new StyleValue(this.inner.values);

		if (this.inner.kind === 'color')
			return new StyleValue(this.inner.values.clone());

		return new StyleValue(
			this.inner.values.map(v => v.withDefaultUnit(unit)),
		);
	}

	toString(): string {
		switch (this.inner.kind) {
			case 'text':
				return this.inner.values;

			case 'color':
				return this.inner.values.toString();

			case 'values':
				return this.inner.values.join(' ');

			default:
				throw new Error('unknown kind ' + this.kind);
		}
	}
}
