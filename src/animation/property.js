import Value from '../utils/value.js';

export default class Property {
	constructor(name) {
		// this is the property name
		this.name = name;
	}

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
		// } else if (name === 'rotation') {
		// 	this.defUnit = 'deg';
		// 	this.defVal = 0;
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
		return Value.parse(val, this._defUnit);
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
		return target.setTransformValue(this._transformFunction, val);
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
			x: Value.parse(x, 'px'),
			y: Value.parse(y, 'px')
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
		target.setTransformValue('translateX', val.x);
		target.setTransformValue('translateY', val.y);
	}

	removeValue(target) {
		target.removeTransformValue('translateX');
		target.removeTransformValue('translateY');
	}
}

const STYLE_PROPS = {
	'width': 'px',
	'height': 'px',
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
		// maybe keep it unitless as long as possible, maybe until we need to
		// write it
		return Value.parse(val, this.unit);
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
		return target.setStyleValue(this.name, val);
	}

	removeValue(target) {
		return target.removeStyleValue(this.name);
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

	throw new Error('unknown prop ' + prop);
}