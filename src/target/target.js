import DomTarget from './domtarget.js';


export function newTarget(target) {
	if (typeof window === 'undefined') {
		if (typeof target.__simulatedDom__ === 'function') {
			return new DomTarget(target, {
				getComputedStyle: target.__getComputedStyleFn__(),
				getRootElement: target.__getRootElementFn__()
			});
		}
	} else {
		if (target instanceof HTMLElement || target instanceof SVGElement) {
			return new DomTarget(target, {
				getComputedStyle: e => window.getComputedStyle(e),
				getRootElement: () => document.documentElement
			});
		}
	}

	throw new Error('unknown target');
}