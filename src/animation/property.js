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
	getCurrentValue(target) {
		return this.defaultValue();
	}

	// if this property is a transform function return its name
	transformFunction() {
		return null;
	}

	styleName() {
		return null;
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

	transformFunction() {
		return this._transformFunction;
	}
}

const STYLE_PROPS = ['width', 'height', 'top', 'left', 'right', 'bottom'];

export class StyleProp extends Property {
	// constructor(name) {
	// 	super(name);
	// }

	parseValue(val) {
		// maybe keep it unitless as long as possible, maybe until we need to
		// write it
		return Value.parse(val, 'px');
	}

	defaultValue() {
		return new Value(0, 'px');
	}

	getCurrentValue(target) {
		if (target.type() !== 'dom')
			throw new Error('error not dom');

		const style = getComputedStyle(target.target);

		return Value.parse(style[this.name]);
	}

	styleName() {
		return this.name;
	}
}

export function newProperty(prop, targetType = '') {
	if (targetType !== 'dom')
		throw new Error('only dom is supported as target');

	if (TRANSFORM_PROPS.includes(prop))
		return new Transform(prop);
	if (STYLE_PROPS.includes(prop))
		return new StyleProp(prop);

	throw new Error('unknown prop ' + prop);
}