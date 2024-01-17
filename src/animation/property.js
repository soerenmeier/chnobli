import Value from '../values/value.js';
import StyleValue from '../values/stylevalue.js';

export default class Property {
	constructor(name) {
		// this is the property name
		this.name = name;

		this.from = null;
		this.to = null;
	}

	allowsValueFn() {
		return true;
	}

	/**
	 * From or to might be null
	 */
	init(target, from, to) {
		if (!from)
			from = this.getValue(target);

		if (!to)
			to = this.getValue(target);

		if (!from || !to)
			throw new Error('could not determine from or to value');

		const [nFrom, nTo] = target.unifyValues(this.name, from, to);

		this.from = nFrom;
		this.to = nTo;
	}

	/**
	 * Gets called with the value of a property
	 * 
	 * For examply during initializiation
	 */
	parseValue(val) {
		return Value.parse(val);
	}

	defaultValue() {
		throw new Error('default value for ' + this.name + ' not known');
	}

	// try to access the value from the target
	getValue(target) {
		const val = target.getValue(this.name);
		if (typeof val === 'undefined' || val === null)
			return this.defaultValue();

		return val;
	}

	/**
	 * Pos needs to be between 0 and 1
	 */
	interpolate(pos) {
		const dif = this.to.num - this.from.num;

		return this.from.cloneAdd(pos * dif);
	}

	setValue(target, val) {
		return target.setValue(this.name, val);
	}

	removeValue(target) {
		return target.removeValue(this.name);
	}
}

const TRANSFORM_PROPS = {
	'x': [0, 'px'],
	'y': [0, 'px'],
	'z': [0, 'px'],
	'scale': [1, null],
	'scaleX': [1, null],
	'scaleY': [1, null],
	'scaleZ': [1, null],
	'rotate': [0, 'deg'],
	'rotateX': [0, 'deg'],
	'rotateY': [0, 'deg'],
	'rotateZ': [0, 'deg'],
	'skew': [0, 'deg'],
	'skewX': [0, 'deg'],
	'skewY': [0, 'deg']
};

export class Transform extends Property {
	constructor(name) {
		super(name);

		this._defaultValue = new Value(...TRANSFORM_PROPS[name]);
	}

	parseValue(val) {
		return Value.parse(val);
	}

	defaultValue() {
		return this._defaultValue.clone();
	}

	getValue(target) {
		return target.getTransformValue(this.name) ?? this.defaultValue();
	}

	setValue(target, val) {
		target.setTransformValue(this.name, val);
	}

	removeValue(target) {
		target.removeTransformValue(this.name);
	}
}

export class TransformXY extends Property {
	constructor(name) {
		super(name);
	}

	parseValue(val) {
		if (Array.isArray(val))
			val = { x: val[0], y: val[1] };

		const { x, y } = val;

		return {
			x: Value.parse(x),
			y: Value.parse(y)
		};
	}

	defaultValue() {
		return {
			x: new Value(0, 'px'),
			y: new Value(0, 'px')
		};
	}

	getValue(target) {
		const x = target.getTransformValue('translateX');
		const y = target.getTransformValue('translateY');

		const def = this.defaultValue();

		return {
			x: x ? x : def.x,
			y: y ? y : def.y
		};
	}

	setValue(target, val) {
		target.setTransformValue('translateX', val.x.withDefaultUnit('px'));
		target.setTransformValue('translateY', val.y.withDefaultUnit('px'));
	}

	removeValue(target) {
		target.removeTransformValue('translateX');
		target.removeTransformValue('translateY');
	}
}

const STYLE_PROPS = {
	'position': 'static',
	'display': 'block',
	'visibility': 'visible',
	'minWidth': 'px',
	'width': 'px',
	'maxWidth': 'px',
	'minHeight': 'px',
	'height': 'px',
	'maxHeight': 'px',
	'top': 'px',
	'left': 'px',
	'right': 'px',
	'bottom': 'px',
	'opacity': [1, null],
	'padding': 'px',
	'margin': 'px'
}

export class StyleProp extends Property {
	constructor(name) {
		super(name);

		const def = STYLE_PROPS[name];
		if (Array.isArray(def)) {
			this._defaultValue = new StyleValue([new Value(def[0], def[1])]);
			this.unit = def[1];
		} else if (def === 'px') {
			this._defaultValue = new StyleValue([new Value(0, def)]);
			this.unit = def;
		} else {
			this._defaultValue = new StyleValue(def);
			this.unit = null;
		}

		// text|values
		this.kind = null;
	}

	init(target, from, to) {
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
		if (!from)
			from = this.getValue(target);

		// get the current value
		if (!to)
			to = this.getValue(target);

		// check that both are values
		if (from.kind === 'text')
			from = this.defaultValue();

		if (to.kind === 'text')
			to = this.defaultValue();

		if (from.length === 0 || to.length === 0)
			throw new Error('from or to has zero values');

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
			const f = from.values[i];
			const t = to.values[i];

			const [nFrom, nTo] = target.unifyValues(this.name, f, t);
			fromVals.push(nFrom);
			toVals.push(nTo);
		}

		this.kind = 'values';
		this.from = new StyleValue(fromVals);
		this.to = new StyleValue(toVals);
	}

	parseValue(val) {
		return StyleValue.parse(val);
	}

	defaultValue() {
		return this._defaultValue.clone();
	}

	getValue(target) {
		const val = target.getStyleValue(this.name);
		if (!val)
			return this.defaultValue();

		return val;
	}

	interpolate(pos) {
		if (this.kind === 'text') {
			return this._interpolateText(pos);
		} else {
			return this._interpolateValues(pos);
		}
	}

	_interpolateText(pos) {
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
			if (pos <= 0)
				return this.from.clone();

			return this.to.clone();
		}

		if (this.to) {
			if (pos <= 0)
				return null;

			return this.to.clone();
		}

		if (this.from) {
			if (pos >= 1)
				return null;

			return this.from.clone();
		}

		throw new Error('expected from or to');
	}

	_interpolateValues(pos) {
		// both values should be the same length

		const vals = [];

		for (let i = 0; i < this.from.values.length; i++) {
			const f = this.from.values[i];
			const t = this.to.values[i];

			const dif = t.num - f.num;

			vals.push(f.cloneAdd(pos * dif));
		}

		return new StyleValue(vals);
	}

	setValue(target, val) {
		if (!val)
			return target.removeStyleValue(this.name);

		return target.setStyleValue(this.name, val.withDefaultUnit(this.unit));
	}

	removeValue(target) {
		return target.removeStyleValue(this.name);
	}
}

/**
 * In most cases we wan't to add the class at pos 0
 * and in reverse remove it at pos 0
 * 
 * so this behaviour should be in str|{ to }
 * 
 * If we wan't to remove the class at pos 1
 * and in reverse add it at pos 1
 * we do it in { from }
 */
export class ClassNameProp extends Property {
	constructor(name) {
		super(name);
	}

	allowsValueFn() {
		return false;
	}

	init(target, from, to) {
		this.from = from ?? [];
		this.to = to ?? [];

		this.preStates = new Map;
		this.states = new Map;

		for (const cls of [...this.from, ...this.to]) {
			const exists = target.hasClass(cls);
			this.preStates.set(cls, exists);
			this.states.set(cls, exists);
		}
	}

	parseValue(val) {
		if (Array.isArray(val)) {
			return val.map(v => {
				if (typeof v !== 'string')
					throw new Error('cls only accepts strings[]');

				return v;
			});
		}

		if (typeof val === 'string')
			return [val];

		throw new Error('cls only accepts strings and strings[]');
	}

	defaultValue() {
		throw new Error('unused');
	}

	getValue(_target) {
		throw new Error('unused');
	}

	interpolate(pos) {
		/**
		 * ## to
		 * add the class at pos >0
		 * and in reverse remove it at pos 0
		 * 
		 * ## from
		 * remove the class at pos <1
		 * and in reverse add it at pos 1
		*/

		let obj = {
			add: [],
			remove: []
		};

		if (pos <= 0) {
			obj.remove = this.to;
		} else {
			obj.add = this.to;
		}

		if (pos >= 1) {
			obj.remove = this.from;
		} else {
			obj.add = [...obj.add, ...this.from];
		}

		return obj;
	}

	setValue(target, val) {
		let { add, remove } = val;
		add = add ?? [];
		remove = remove ?? [];

		if (!Array.isArray(add) || !Array.isArray(remove))
			throw new Error('add or remove expected');

		add.forEach(cls => {
			const exists = this.states.get(cls);
			if (!exists) {
				target.addClass(cls);
				this.states.set(cls, true);
			}
		});

		remove.forEach(cls => {
			const exists = this.states.get(cls);
			if (exists) {
				target.removeClass(cls);
				this.states.set(cls, false);
			}
		});
	}

	removeValue(target) {
		this.preStates.forEach((exists, cls) => {
			if (exists)
				target.addClass(cls);
			else
				target.removeClass(cls);
		});
		this.states = new Map(this.preStates);
	}
}

export function newProperty(prop, targetType = '') {
	if (targetType !== 'dom')
		throw new Error('only dom is supported as target');

	if (prop in TRANSFORM_PROPS)
		return new Transform(prop);
	if (prop === 'xy')
		return new TransformXY(prop);
	if (prop in STYLE_PROPS)
		return new StyleProp(prop);
	if (prop === 'cls')
		return new ClassNameProp(prop);

	throw new Error('unknown prop ' + prop);
}