export default class TestDomNode {
	constructor() {
		this.computedStyle = {};

		this.style = {
			setProperty: (k, v) => {
				this.style[k] = v;
			},
			removeProperty: (k) => {
				delete this.style[k];
			}
		};
	}

	syncStyles() {
		this.computedStyle = { ...this.style };
	}

	static getComputedStyle(el) {
		return el.computedStyle;
	}

	__simulatedDom__() {}

	__getComputedStyle__() {
		return TestDomNode.getComputedStyle;
	}
}

export function el() {
	return new TestDomNode();
}