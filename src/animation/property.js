import Value from '../utils/value.js';

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
		// todo remove
		return target.removeValue(this.name);
	}
}

const TRANSFORM_PROPS = ['x', 'y', 'scale', 'scaleX', 'scaleY', 'rotate'];

export class Transform extends Property {
	constructor(name) {
		super(name);

		if (name === 'x' || name === 'y') {
			this._defUnit = 'px';
			this._defVal = 0;
			this._transformFunction = 'translate' + name.toUpperCase();
		} else if (name.startsWith('scale')) {
			this._defUnit = null;
			this._defVal = 1;
			this._transformFunction = name;
		} else if (name === 'rotate') {
			this._defUnit = 'deg';
			this._defVal = 0;
			this._transformFunction = name;
		} else {
			throw new Error('unknown prop ' + name);
		}
	}

	parseValue(val) {
		return Value.parse(val);
	}

	defaultValue() {
		return new Value(this._defVal, this._defUnit);
	}

	getValue(target) {
		const val = target.getTransformValue(this._transformFunction);
		if (typeof val === 'undefined' || val === null)
			return this.defaultValue();

		return val;
	}

	setValue(target, val) {
		return target.setTransformValue(
			this._transformFunction,
			val.withDefaultUnit(this._defUnit)
		);
	}

	removeValue(target) {
		// todo remove
		return target.removeTransformValue(this._transformFunction);
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
	'opacity': null,
}

export class StyleProp extends Property {
	constructor(name) {
		super(name);

		this.unit = STYLE_PROPS[name];
	}

	parseValue(val) {
		return Value.parse(val);
	}

	defaultValue() {
		return new Value(0, this.unit);
	}

	getValue(target) {
		const val = target.getStyleValue(this.name);
		if (!val)
			return this.defaultValue();

		return val;
	}

	setValue(target, val) {
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

		if (typeof val === 'string') {
			return [val];
		}

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

	if (TRANSFORM_PROPS.includes(prop))
		return new Transform(prop);
	if (prop === 'xy')
		return new TransformXY(prop);
	if (prop in STYLE_PROPS)
		return new StyleProp(prop);
	if (prop === 'cls')
		return new ClassNameProp(prop);

	throw new Error('unknown prop ' + prop);
}