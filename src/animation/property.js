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

export class TransformXY extends Property {
	constructor(name) {
		super(name);
	}

	parseValue(val) {
		if (Array.isArray(val))
			val = { x: val[0], y: val[1] };

		const { x, y } = val;

		return {
			x: Value.parse(val.x, 'px'),
			y: Value.parse(val.y, 'px')
		};
	}

	defaultValue() {
		return {
			x: new Value(0, 'px'),
			y: new Value(0, 'px')
		};
	}

	transformFunction() {
		return (transforms, value) => {
			transforms['translateX'] = value.x.toString();
			transforms['translateY'] = value.y.toString();
		};
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
	if (prop === 'xy')
		return new TransformXY(prop);
	if (prop in STYLE_PROPS)
		return new StyleProp(prop);

	throw new Error('unknown prop ' + prop);
}