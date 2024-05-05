import { Target } from '../target/Target.js';
import TransformProperty, { TRANSFORM_PROPS } from './TransformProperty.js';
import TransformXYProperty from './TransformXYProperty.js';
import StyleProperty, { STYLE_PROPS } from './StyleProperty.js';
import ClassProperty from './ClassProperty.js';

export type ParseableValue = string | number | (string | number)[];

export default interface Property<V, I = V> {
	name: string;

	allowsValueFn(): boolean;

	init(target: Target, from: V | null, to: V | null): void;

	parseValue(value: ParseableValue): V;
	interpolate(pos: number): I;
	setValue(target: Target, value: I): void;
	removeValue(target: Target): void;
}

export function newProperty(prop: string, targetType = ''): Property<any> {
	if (targetType !== 'dom')
		throw new Error('only dom is supported as target');

	if (prop in TRANSFORM_PROPS) return new TransformProperty(prop);
	if (prop === 'xy') return new TransformXYProperty(prop);
	if (prop.startsWith('--')) return new StyleProperty(prop);
	if (prop in STYLE_PROPS) return new StyleProperty(prop);
	if (prop === 'cls') return new ClassProperty(prop);

	throw new Error('unknown prop ' + prop);
}
