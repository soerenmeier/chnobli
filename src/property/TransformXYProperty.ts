import Value from '../values/Value';
import Property, { ParseableValue } from './Property';
import { Target } from '../target/Target';

export type XYValue = {
	x: Value;
	y: Value;
};

export default class TransformXYProperty implements Property<XYValue> {
	name: string;

	from!: XYValue;
	to!: XYValue;

	constructor(name: string) {
		this.name = name;
	}

	allowsValueFn(): boolean {
		return true;
	}

	init(target: Target, from: XYValue | null, to: XYValue | null) {
		if (!from) from = this.getValue(target);

		if (!to) to = this.getValue(target);

		if (!from || !to)
			throw new Error('could not determine from or to value');

		const [fromX, toX] = target.unifyValues('x', from.x, to.x);
		const [fromY, toY] = target.unifyValues('y', from.y, to.y);

		this.from = { x: fromX, y: fromY };
		this.to = { x: toX, y: toY };
	}

	parseValue(val: any) {
		if (Array.isArray(val)) val = { x: val[0], y: val[1] };

		const { x, y } = val;

		return {
			x: Value.parse(x),
			y: Value.parse(y),
		};
	}

	defaultValue() {
		return {
			x: new Value(0, 'px'),
			y: new Value(0, 'px'),
		};
	}

	getValue(target: Target): XYValue {
		const x = target.getTransformValue('x');
		const y = target.getTransformValue('y');

		const def = this.defaultValue();

		return {
			x: x ? x : def.x,
			y: y ? y : def.y,
		};
	}

	interpolate(pos: number): XYValue {
		const difX = this.to.x.num - this.from.x.num;
		const difY = this.to.y.num - this.from.y.num;

		return {
			x: this.from.x.cloneAdd(pos * difX),
			y: this.from.y.cloneAdd(pos * difY),
		};
	}

	setValue(target: Target, val: XYValue) {
		target.setTransformValue('x', val.x.withDefaultUnit('px'));
		target.setTransformValue('y', val.y.withDefaultUnit('px'));
	}

	removeValue(target: Target) {
		target.removeTransformValue('x');
		target.removeTransformValue('y');
	}
}
