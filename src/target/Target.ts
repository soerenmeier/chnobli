import Value from '../values/Value.js';
import DomTarget from './DomTarget.js';
import StyleValue from '../values/StyleValue.js';
import type TestDomNode from './TestDomNode.js';
import ObjectTarget from './ObjectTarget.js';

export type Targets = AnimationTarget | AnimationTarget[];
export type AnimationTarget =
	| HTMLElement
	| SVGElement
	| TestDomNode
	| Record<string, any>;

export function newTarget(target: any): Target {
	if (typeof window === 'undefined') {
		if (typeof target.__simulatedDom__ === 'function') {
			return new DomTarget(target, {
				getComputedStyle: target.__getComputedStyleFn__(),
				getRootElement: target.__getRootElementFn__(),
			});
		}
	} else {
		if (target instanceof HTMLElement || target instanceof SVGElement) {
			return new DomTarget(target, {
				getComputedStyle: e => window.getComputedStyle(e),
				getRootElement: () => document.documentElement,
			});
		}
	}

	if (typeof target === 'object' && target !== null) {
		return new ObjectTarget(target);
	}

	throw new Error('unknown target');
}

export interface Target {
	inner(): any;
	type(): string;

	getValue(name: string): Value | null;
	setValue(name: string, value: Value): void;
	removeValue(name: string): void;

	getTransformValue(name: string): Value | null;
	setTransformValue(name: string, value: Value): void;
	removeTransformValue(name: string): void;

	getStyleValue(name: string): StyleValue | null;
	setStyleValue(name: string, value: StyleValue): void;
	removeStyleValue(name: string): void;

	hasClass(name: string): boolean;
	addClass(name: string): void;
	removeClass(name: string): void;

	unifyValues(name: string, a: Value, b: Value): [Value, Value];

	apply(): void;
}
