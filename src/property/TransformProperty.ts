import Value from '../values/Value';
import BasicProperty from './BasicProperty';
import { ParseableValue } from './Property';
import { Target } from '../target/Target';

export const TRANSFORM_PROPS: Record<string, [number, string | null]> = {
	x: [0, 'px'],
	y: [0, 'px'],
	z: [0, 'px'],
	scale: [1, null],
	scaleX: [1, null],
	scaleY: [1, null],
	scaleZ: [1, null],
	rotate: [0, 'deg'],
	rotateX: [0, 'deg'],
	rotateY: [0, 'deg'],
	rotateZ: [0, 'deg'],
	skew: [0, 'deg'],
	skewX: [0, 'deg'],
	skewY: [0, 'deg'],
};

export default class TransformProperty extends BasicProperty {
	private _defaultValue: Value;

	constructor(name: string) {
		super(name);

		this._defaultValue = new Value(...TRANSFORM_PROPS[name]);
	}

	parseValue(val: ParseableValue) {
		if (typeof val !== 'string' && typeof val !== 'number')
			throw new Error(
				`Failed to parse value '${val}' for property '${this.name}'`,
			);

		return Value.parse(val);
	}

	defaultValue() {
		return this._defaultValue.clone();
	}

	getValue(target: Target) {
		return target.getTransformValue(this.name) ?? this.defaultValue();
	}

	setValue(target: Target, val: Value) {
		target.setTransformValue(this.name, val);
	}

	removeValue(target: Target) {
		target.removeTransformValue(this.name);
	}
}
