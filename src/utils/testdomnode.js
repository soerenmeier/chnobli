export default class TestDomNode {
	constructor() {
		this.style = {
			setProperty: (k, v) => {
				this.style[k] = v;
			},
			removeProperty: (k) => {
				delete this.style[k];
			}
		};
	}

	static getComputedStyle(el) {
		return el.style;
	}

	__simulatedDom__() {}

	__getComputedStyle__() {
		return TestDomNode.getComputedStyle;
	}
}

export function el() {
	return new TestDomNode();
}