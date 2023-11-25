export default class Target {
	constructor(target) {
		this.target = target;

		// this might be an object, a dom node
		// what about arrays?
	}

	type() {
		return 'unknown';
	}

	getStartValue(prop) {
		throw new Error('cannot get start value of ' + prop.name);
	}

	setValue(prop, value) {
		throw new Error('cannot set value of ' + prop.name);
	}

	apply() {}
}

export class DomTarget extends Target {
	constructor(target) {
		super(target);

		// for the moment 

		this.startValues = new Map;
		this.currentValues = new Map;
	}

	type() {
		return 'dom';
	}

	getStartValue(prop) {
		let startVal = this.startValues.get(prop.name);
		if (startVal)
			return startVal;

		startVal = prop.getCurrentValue(this);
		this.startValues.set(prop.name, startVal);
		return startVal;
	}

	setValue(prop, value) {
		// todo maybe register the props separately
		this.currentValues.set(prop.name, { prop, value });
	}

	apply() {
		// translateX: 0, scale: []
		const transforms = {};

		for (const { prop, value } of this.currentValues.values()) {

			const transformFunction = prop.transformFunction();
			if (transformFunction) {
				transforms[transformFunction] = value.toString();
				continue;
			}

			const styleName = prop.styleName();
			if (styleName) {
				this.target.style[styleName] = value.toString();
				continue;
			}

			throw new Error('what to do with ' + prop.name);
		}

		this.target.style.transform = Object.entries(transforms)
			.map(([k, v]) => `${k}(${v})`)
			.join(' ');
	}
}

export function newTarget(target) {
	if (target instanceof HTMLElement)
		return new DomTarget(target);

	throw new Error('unknown target');
}