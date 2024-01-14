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

		this.classList = {
			set: new Set,
			contains(name) {
				return this.set.has(name);
			},
			add(name) {
				this.set.add(name);
			},
			remove(name) {
				this.set.delete(name);
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