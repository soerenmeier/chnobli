export default class Target {
	constructor(target) {
		this.target = target;

		// this might be an object, a dom node
		// what about arrays?
	}

	type() {
		return 'unknown';
	}

	getValue(prop) {
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

		// this.startValues = new Map;
		// { prop, value }
		this.currentValues = new Map;
	}

	type() {
		return 'dom';
	}

	getValue(prop) {
		console.log('getvalue', prop.name, this.currentValues);

		let val = this.currentValues.get(prop.name);
		if (val)
			return val.value;

		val = prop.getValue(this);
		this.currentValues.set(prop.name, { prop, value: val });
		return val;
	}

	setValue(prop, value) {
		console.log('setValue', prop.name, value);
		// if (prop.name === 'y')
		// 	debugger;
		// todo maybe register the props separately
		this.currentValues.set(prop.name, { prop, value });
	}

	removeValue(prop) {
		console.log('removeValue', prop.name);
		this.currentValues.delete(prop.name);
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