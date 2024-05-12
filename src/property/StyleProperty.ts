import StyleValue from '../values/StyleValue.js';
import Property, { ParseableValue } from './Property.js';
import Value from '../values/Value.js';
import { Target } from '../target/Target.js';
import ColorValue, { RGBA } from '../values/ColorValue.js';

export const STYLE_PROPS: Record<string, string | [number, string | null]> = {
	position: 'static',
	display: 'block',
	visibility: 'visible',
	minWidth: 'px',
	width: 'px',
	maxWidth: 'px',
	minHeight: 'px',
	height: 'px',
	maxHeight: 'px',
	top: 'px',
	left: 'px',
	right: 'px',
	bottom: 'px',
	opacity: [1, null],
	padding: 'px',
	margin: 'px',
	color: '#000',
	backgroundColor: '#fff',
};

export default class StyleProperty
	implements Property<StyleValue, StyleValue | null>
{
	name: string;

	from: StyleValue | null;
	to: StyleValue | null;

	unit: string | null;

	kind: 'text' | 'color' | 'values' | null;
	// if the kind text is set
	// from and to are text

	private _defaultValue: StyleValue | null;

	constructor(name: string, useDefaults: boolean = true) {
		this.name = name;

		this.from = null;
		this.to = null;

		const def = useDefaults ? STYLE_PROPS[name] : undefined;
		if (Array.isArray(def)) {
			this._defaultValue = new StyleValue([new Value(def[0], def[1])]);
			this.unit = def[1];
		} else if (def === 'px') {
			this._defaultValue = new StyleValue([new Value(0, def)]);
			this.unit = def;
		} else if (typeof def !== 'undefined') {
			this._defaultValue = StyleValue.parse(def);
			this.unit = null;
		} else {
			this._defaultValue = null;
			this.unit = null;
		}

		// text|color|values
		this.kind = null;
	}

	allowsValueFn(): boolean {
		return true;
	}

	init(target: Target, from: StyleValue | null, to: StyleValue | null) {
		// this check is probably not necessary?
		if (!from && !to)
			throw new Error('either from or to need to be defined');

		/*
		if the user inputed a text value both need to be treated as text
		and interpolated as classes or in reverse if they are negative values

		if the user inputed a value both need to be treated as values and need
		to match in length
		*/

		if (from?.kind === 'text' || to?.kind === 'text') {
			if (from && from.kind !== 'text')
				throw new Error('from is expected to be a text because to is');

			if (to && to.kind !== 'text')
				throw new Error('to is expected to be a text because from is');

			this.kind = 'text';
			this.from = from;
			this.to = to;
			return;
		}

		// get the current value
		if (!from) from = this.getValue(target);

		// get the current value
		if (!to) to = this.getValue(target);

		if (!from || !to)
			throw new Error(
				'from or to could not be defined, specified ' +
					'it with fromTo',
			);

		// if one is a color both need to be a color
		if (from.kind === 'color' || to.kind === 'color') {
			if (from.kind !== to.kind) throw new Error('expected two colors');

			this.kind = 'color';
			this.from = from;
			this.to = to;
			return;
		}

		// check that both are of kind values
		if (from.kind === 'text') from = this.defaultValue()!;

		if (to.kind === 'text') to = this.defaultValue()!;

		if (from.length === 0 || to.length === 0)
			throw new Error('from or to has zero values');

		// at this point from and to are values and both have some values

		// either from or to needs to be 1 to work

		if (from.length !== to.length && from.length !== 1 && to.length !== 1)
			throw new Error('from or to need to match in length or be one');

		const newLength = Math.max(from.length, to.length);
		from.extendToLength(newLength);
		to.extendToLength(newLength);

		// now let's try to unify each value
		const fromVals = [];
		const toVals = [];

		// now we need to make sure the values are the same
		for (let i = 0; i < newLength; i++) {
			const f = (from.values as Value[])[i];
			const t = (to.values as Value[])[i];

			const [nFrom, nTo] = target.unifyValues(this.name, f, t);
			fromVals.push(nFrom);
			toVals.push(nTo);
		}

		this.kind = 'values';
		this.from = new StyleValue(fromVals);
		this.to = new StyleValue(toVals);
	}

	parseValue(val: ParseableValue): StyleValue {
		return StyleValue.parse(val);
	}

	defaultValue(): StyleValue | null {
		return this._defaultValue?.clone() ?? null;
	}

	getValue(target: Target): StyleValue | null {
		const val = target.getStyleValue(this.name);
		if (!val) return this.defaultValue();

		return val;
	}

	interpolate(pos: number): StyleValue | null {
		switch (this.kind) {
			case 'text':
				return this._interpolateText(pos);

			case 'color':
				return this._interpolateColor(pos);

			default:
				return this._interpolateValues(pos);
		}
	}

	// only call this if kind is text
	private _interpolateText(pos: number): StyleValue | null {
		/*
		## if both values are set

		<=0 the from value will be set
		>0 the to value will be set


		## if only one text is set

		if the to value is 


		the text in the to value will be set >0
		the text in the to value will be removed in <=0

		the text in the from value will be set <1
		the text in the from value will be removed in >=1
		*/
		if (this.from && this.to) {
			if (pos <= 0) return this.from.clone();

			return this.to.clone();
		}

		if (this.to) {
			if (pos <= 0) return null;

			return this.to.clone();
		}

		if (this.from) {
			if (pos >= 1) return null;

			return this.from.clone();
		}

		throw new Error('expected from or to');
	}

	// only call this if kind is color
	private _interpolateColor(pos: number) {
		const vals = [];

		for (let i = 0; i < 4; i++) {
			const f = (this.from!.values as ColorValue).values[i];
			const t = (this.to!.values as ColorValue).values[i];

			const dif = t - f;

			vals.push(f + pos * dif);
		}

		return new StyleValue(new ColorValue(vals as RGBA));
	}

	// only call this if kind is values
	// both values should be the same length
	private _interpolateValues(pos: number) {
		const vals = [];

		const from = this.from!.values as Value[];
		const to = this.to!.values as Value[];

		for (let i = 0; i < from.length; i++) {
			const f = from[i];
			const t = to[i];

			const dif = t.num - f.num;

			vals.push(f.cloneAdd(pos * dif));
		}

		return new StyleValue(vals);
	}

	setValue(target: Target, val: StyleValue | null) {
		if (!val) return target.removeStyleValue(this.name);

		return target.setStyleValue(this.name, val.withDefaultUnit(this.unit));
	}

	removeValue(target: Target) {
		return target.removeStyleValue(this.name);
	}
}
